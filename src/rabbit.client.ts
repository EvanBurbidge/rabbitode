import * as amqp from 'amqplib/callback_api';
import { to } from 'await-to-js';

/**
 * @class
 * @name RabbigMqInterface
 * @description
 *  This class provides us a number of methods for dealing with connecting to
 *  amqplib and allows us to publish and send events to rabbit mq and digest
 *  those events
 * */
export class RabbitMqInterface {

  public connection: any;
  public connectionUri: string;
  public exchange: any;
  public pubChannel: any;
  public offlinePubQueue: any[] = [];
  public exchangeName: string;
  public exchangeType: string;
  public queueName: string;
  public topicsList: string[];
  public consumerCallback: (msg:any) => void = msg => console.log(msg);

  constructor (userConfig: any) {
    this.setup(userConfig);
  }

  setup(config):Promise<any> {
    return new Promise(async (resolve, reject) => {
      this.queueName = config.queueName;
      this.exchangeName = config.exchangeName;
      this.exchangeType = config.exchangeType;
      this.consumerCallback = config.consumerCallback;
      this.connectionUri = config.connectionUri;
      let [err, data] = await to(this.startRabbit());
      if (err) {
        reject();
        console.log(`[Rabbitode] oh no theres been a  problem`);
        return this.closeOnError({ message: `error` });
      } else {
        resolve();
        this.startConsumer(config.consumerCallback);
        this.startPublisher();
        console.log(`[Rabbitode] setup complete`);
        return this;
      }
    })
  }

  /**
   * @method
   * @description
   * this method is called once upon start up
   * and the recursively anytime we have an error
   * */
  startRabbit() {
    return new Promise((resolve, reject) => {
      amqp.connect(
        this.connectionUri,
        (err, conn) => {
          if (err) {
            reject();
            return this.handleRabbitClose();
          }
          this.connection = conn;
          this.connection.on('error', err => this.handleRabbitErrror(err));
          this.connection.on('close', () => this.handleRabbitClose());
          this.startPublisher();
          resolve();
        }
      );
    })
  }

  /**
   * @method
   * @name handleRabbitErrror
   * @description
   *  This will handleRabbitErrror
   * */
  handleRabbitErrror(err) {
    if (err.message !== 'Connection closing') {
      console.error('[Rabbitode] conn error', err.message);
    }
  }

  /**
   * @method
   * @name handleRabbitClose
   * @description
   *  This will handleRabbitClose
   * */
  handleRabbitClose() {
    console.log(`[Rabbitode] Restarting`);
    return setTimeout(async () => {
      let [err, data] = await to(this.startRabbit());
      if (err) {
        this.handleRabbitClose();
      }
    }, 1000);
  }

  /**
   * @method
   * @description
   *  This will start our publications channel for
   *  rabbit mq
   * */
  startPublisher() {
    this.connection
      .createConfirmChannel((err, ch) => {
        console.log(`[Rabbitode] setting up publisher`);
        if (this.closeOnError(err)) return;

        this.pubChannel = ch;
        this.pubChannel.on('error', err => console.log(err));
        this.pubChannel.on('close', () => console.log(`CHANNEL IS CLOSING`));

        if (this.exchangeName.length > 0) {
          console.log(`[Rabbitode] setting up exchange`);
          this.exchange =
            this.pubChannel
              .assertExchange(
                this.exchangeName,
                this.exchangeType,
                { durable: false },
              );
        }
        this.publish({ msg: ' im testing' });
        while (true) {
          const m = this.offlinePubQueue.shift();
          if (!m) break;
          this.publish(m[2]);
        }

      });
  }

  /**
   * @method
   * @description
   *  This is our main publishing function
   *  it will allow us to publish methods
   * @param {Object} content
   * */
  publish(content) {
    try {
      console.log(`[Rabbitode] sending to exchange: ${this.exchangeName} queue: ${this.queueName}`);
      this.pubChannel
        .publish(
          this.exchangeName,
          this.queueName,
          new Buffer(JSON.stringify(content)),
          (err) => {
            if (err) {
              console.log(`[Rabbitode] publish`, err);
              this.offlinePubQueue.push([this.exchangeName, this.queueName, content]);
              this.pubChannel.connection.close();
            }
            console.log(`[Rabbitode] published`);
          },
        );
    } catch (e) {
      console.log(`[Rabbitode] publish failure reason: `, e.message);
      this.offlinePubQueue.push([this.exchangeName, this.queueName, content]);
    }
  }

  /**
   * @method
   * @description
   *  This will decode our buffer into an object, array, whatever it is.
   * */
  decodeToString(message): string {
    return message.content.toString();
  }

  /**
   * @method
   * @description
   *  This will decode our buffer into an object, array, whatever it is.
   * */
  decodeToJson(message): any {
    return JSON.parse(message.content.toString());
  }

  /**
   * @method
   * @description
   *  this will start a consumer that will ack a message if processed
   * @param { Function } consumerHandler this is what digests the messages from your queue. You implement this yourself
   * @param { Number } prefetchCount when our consumer loads this will allow us to see an amount of messages on load
   * @param { Object } queueConfigs this is a small configuration object for our queues.
   * @param { Object } consumeConfig this is a small configuration that tell us what we should do when we consume our features
   * */
  public async startConsumer(consumerHandler = msg => this.decodeToString(msg),
                             prefetchCount: number = 10,
                             queueConfigs = { exclusive: false },
                             consumeConfig = { noAck: false }) {
    let [err, data] = await to(this.startRabbit());
    if (err) {
      this.handleRabbitClose();
    } else {
      this.connection
        .createConfirmChannel((err, ch) => {
          if (this.closeOnError(err)) return;

          this.pubChannel = ch;
          this.pubChannel.on('error', err => console.error('[Rabbitode] channel error', err.message));
          this.pubChannel.on('close', () => console.log('[Rabbitode] channel closed'));
          this.pubChannel.prefetch(prefetchCount);
          this.pubChannel.assertQueue(this.queueName, { ...queueConfigs }, (err) => {
            console.log(`[Rabbitode] setting up exchange`);
            this.pubChannel
              .bindQueue(
                this.queueName,
                this.exchangeName,
              );

            if (this.closeOnError(err)) return;
            this.pubChannel.consume(
              this.queueName,
              consumerHandler(this.pubChannel),
              { ...consumeConfig },
            );
            console.log(`[Rabbitode] Consumer is started at ${this.exchangeName}: ${this.queueName}`);
          });
        });
    }
  }

  /**
   * @method
   * @description
   *  if there is a major error we're going to close the main
   *  connection to rabbit
   * */
  closeOnError(err) {
    if (!err) return err;
    console.log(`[FATAL RABBITODE ERROR CLOSING]`, err);
    this.connection.close();
    return true;
  }
}

module.exports.RabbigMqInterface = RabbitMqInterface;
