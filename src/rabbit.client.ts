import * as amqp from 'amqplib/callback_api';
/**
 * @class
 * @name RabbigMqInterface
 * @description
 *  This class provides us a number of methods for dealing with connecting to
 *  amqplib and allows us to publish and send events to rabbit mq and digest
 *  those events
 * */
export class RabbitMqInterface {

  private connection: any;
  private exchange: any;
  private pubChannel: any;
  private offlinePubQueue: any[] = [];

  constructor(
    private queueName: string,
    private connectionUri: string,
    private exchangeName: string,
    private exchangeType: string = 'direct',
  ) {
    this.setup();
  }

  async setup () {
    await this.startRabbit();
    this.startPublisher();
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
      console.error('[AMQP] conn error', err.message);
    }
  }

  /**
   * @method
   * @name handleRabbitClose
   * @description
   *  This will handleRabbitClose
   * */
  handleRabbitClose() {
    console.log(`[AMQP] Restarting`);
    return setTimeout(() => this.startRabbit(), 1000);
  }

  /**
   * @method
   * @description
   *  This will start our publications channel for
   *  rabbit mq
   * */
  startPublisher() {
    this.connection
      .createChannel((err, ch) => {
      if (this.closeOnError(err)) return;
      this.pubChannel = ch;
      this.pubChannel.on('error', err => console.log(err));
      this.pubChannel.on('close', () => console.log(`CHANNEL IS CLOSING`));

      if (this.exchangeName.length > 0) {
        this.exchange =
          this.pubChannel
          .assertExchange(
            this.exchangeName,
            this.exchangeType,
            { durable: false },
          );
      }
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
      console.log(`[AMQP] sending to exchange: ${this.exchangeName} queue: ${this.queueName}`);
      this.pubChannel.publish(
        this.exchangeName,
        this.queueName,
        new Buffer(JSON.stringify(content)),
        (err) => {
          if (err) {
            console.log(`[AMQP] publish`, err);
            this.offlinePubQueue.push([this.exchangeName, this.queueName, content]);
            this.pubChannel.connection.close();
          }
          console.log(`[AMQP] published`);
        },
      );
    } catch (e) {
      console.log(`[AMQP] publish`, e.message);
      this.offlinePubQueue.push([this.exchangeName, this.queueName, content]);
    }
  }
  /**
   * @method
   * @description
   *  This will decode our buffer into an object, array, whatever it is.
   * */
  static decode (message): any {
    return JSON.parse(message.content.toString());
  }

  /**
   * @method
   * @description
   *  this will start a consumer that will ack a message if processed
   * */
  startConsumer( consumerHandler = msg => console.log(msg.content.toString())) {
    this.connection.createChannel((err, ch) => {
      if (this.closeOnError(err)) return;
      this.pubChannel = ch;
      this.pubChannel.on('error', err => console.error('[AMQP] channel error', err.message));
      this.pubChannel.on('close', () => console.log('[AMQP] channel closed'));
      this.pubChannel.prefetch(10);
      this.pubChannel.assertQueue(this.queueName, { exclusive: true }, (err) => {
        if (this.closeOnError(err)) return;
        this.pubChannel.consume(
          this.queueName,
          consumerHandler(this.pubChannel),
          { noAck: false },
        );
        console.log('[AMQP] Worker is started');
      });
    });
  }

  /**
   * @method
   * @description
   *  if there is a major error we're going to close the main
   *  connection to rabbit
   * */
  closeOnError(err) {
    if (!err) return err;
    console.log(`[FATAL AMQP ERROR CLOSING]`, err);
    this.connection.close();
    return true;
  }
}
