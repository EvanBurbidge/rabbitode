import * as amqp from 'amqplib/callback_api';
/**
 * @class
 * @name RabbigMqInterface
 * @description
 *  This class provides us a number of methods for dealing with connecting to
 *  amqplib and allows us to publish and send events to rabbit mq and digest
 *  those events
 * */
class RabbitMqInterface {

  private queue: string;
  private connection: any;
  private pubChannel: any;
  private consumerHandler: any;
  private offlinePubQueue: any[] = [];
  private exchangeName: string = ``;

  constructor(
    private queueName: string,
    private connectionUri: string,
    consumerHandler = msg => console.log(msg.content.toString())
  ) {
    this.queue = this.queueName;
    this.consumerHandler = consumerHandler;
    this.startRabbit();
  }

  /**
   * @method
   * @description
   * this method is called once upon start up
   * and the recursively anytime we have an error
   * */
  startRabbit() {
    amqp.connect(
      this.connectionUri,
      (err, conn) => {
        if (err) {
          return this.handleRabbitClose();
        }
        this.connection = conn;
        this.connection.on('error', err => this.handleRabbitErrror(err));
        this.connection.on('close', () => this.handleRabbitClose());
        console.log(`[AMQP] connection established`, this.queue);
        this.startPublisher();
        this.startConsumer();
      },
    );
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
    this.connection.createConfirmChannel((err, ch) => {
      if (this.closeOnError(err)) return;
      this.pubChannel = ch;
      this.pubChannel.on('error', err => console.log(err));
      this.pubChannel.on('close', () => console.log(`CHANNEL IS CLOSING`));
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
  startConsumer() {
    this.connection.createChannel((err, ch) => {
      if (this.closeOnError(err)) return;
      this.pubChannel = ch;
      this.pubChannel.on('error', err => console.error('[AMQP] channel error', err.message));
      this.pubChannel.on('close', () => console.log('[AMQP] channel closed'));
      this.pubChannel.prefetch(10);
      this.pubChannel.assertQueue(this.queue, { durable: true }, (err) => {
        if (this.closeOnError(err)) return;
        this.pubChannel.consume(
          this.queue,
          this.consumerHandler(this.pubChannel),
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

module.exports = {
  RabbitMqInterface: RabbitMqInterface
};