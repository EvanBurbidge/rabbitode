const amqp = require('amqplib');

interface MqExchangeMessage {
  exchangeName: string;
  routingKey: string;
  content: Buffer | string;
}

interface MqTaskMessage {
  queueName: string;
  content: Buffer | string;
}

interface ConsumerConfig {
  exchangeName: string;
  exchangeType: string;
  queueName: string;
  consumerCallback: (x: any) => (y: any) => void;
}

/**
 * @class
 * @name RabbitMqInterface
 * @description
 *  This class provides us a number of methods for dealing with connecting to
 *  amqplib and allows us to publish and send events to rabbit mq and digest
 *  those events
 * */
export class RabbitMqInterface {

  public connection: any;
  public debug: boolean = false;
  public connectionUri: string = `amqp://localhost`;

  constructor() {
    this.logger(`[Rabbitode] is ready to use`);
  }

  /**
   * @method
   * @name setRabbitUri
   * @description
   *  description here
   * */
  setRabbitUri(uri: string): void {
    this.connectionUri = uri;
  }

  /**
   * @method
   * @name endableDebugging
   * @description
   *  if this is called we will see debugging statements.
   * */
  enableDebugging() {
    this.debug = true;
    return this;
  }

  /**
   * @method
   * @name disableDebugging
   * @description
   *  if this is called we will not debugging statements.
   * */
  disableDebugging() {
    this.debug = false;
    return this;
  }


  /**
   * @method
   * @description
   * this method is called once upon start up
   * and the recursively anytime we have an error
   * */
  startRabbit() {
    return amqp.connect(this.connectionUri);
  }

  /**
   * @method
   * @name publishToExchange
   * @description
   *  This will publish our item to an exchange
   * @param {Object} messageConfig - the configuration of the message to be sent
   * @param {String} exchangeType - this is the type e.g. direct, fanout, topic
   * @param {Object} configs - a user can configure the exchanges and stuff whichever way they want
   * */
  async publishToExchange({ exchangeName, routingKey, content },
                          exchangeType: string,
                          configs: any = {
                            exchange: { durable: false },
                            channel: { persistent: true },
                          }): Promise<any> {
    try {
      const conn = await this.startRabbit();
      this.logger(`[Rabbitode] creating channel`);
      try {
        const channel = await conn.createConfirmChannel();
        this.logger(`[Rabbitode] asserting exchange,  exchangeType: ${exchangeType}`);
        await channel.assertExchange(exchangeName, exchangeType, { ...configs.exchange });
        this.logger(`[Rabbitode] publishing message`);
        let published = await channel.publish(exchangeName, routingKey, this.bufferIfy(content),
          { ...configs.channel },
          (err) => err ?
            this.logger(`[Rabbitode] there was a problem ${err}`, 'error') :
            this.logger(`[Rabbitode] message sent`));

        this.logger(`[Rabbitode] message published: ${published}`);
        setTimeout(async() => {
          this.logger(`[Rabbitode] closing channel`);
          await channel.close();
          this.logger(`[Rabbitode] closing connection`);
          await conn.close();
        }, 2500);
      } catch (e) {
        this.logger(`[Rabbitode] channel error ${e}`, 'error');
      }
    } catch (e) {
      this.logger(`[Rabbitode] channel error ${e}`, 'error');
    }
  }

  /**
   * @method
   * @name send
   * @description
   *  We just want to expose one function to the user e.g. send.
   *  @param {Object} message - the message the user wants to send
   *  @param {String} exchangeType - the exchange type the user wants to use
   * */
  send(message: any, exchangeType: string) {
    this.logger(`[Rabbitode] publishing message`);
    switch (exchangeType) {
      case 'direct':
        return this.publishDirect(message);
      case 'fanout':
        return this.publishFanout(message);
      case 'topic':
        return this.publishTopic(message);
      default:
        return this.publishDirect(message);
    }
  }

  // helper method for publishing
  publishDirect(messageConfig: MqExchangeMessage) {
    return this.publishToExchange(messageConfig, 'direct');
  }

  // helper method for publishing
  publishFanout(messageConfig: MqExchangeMessage) {
    return this.publishToExchange(messageConfig, 'fanout');
  }

  // helper method for publishing
  publishTopic(messageConfig: MqExchangeMessage) {
    return this.publishToExchange(messageConfig, 'topic');
  }

  // helper method for publishing
  // sendTask(messageConfig: MqTaskMessage) {
  //   return this.publishToQueue(messageConfig);
  // }

  /**
   * @method
   * @name startConsumer
   * @description
   *  This will allow us to consume various sorts of queues, it MUST take a
   *  consumer call back param
   *  @param {Object} queueConfig - a user can configure their consumers
   *  @param {Object} configs - a user can configure the q's to have certain settings there are default settings
   *  @param {Array} topics - a list of topics for a topic exchange
   * */
  async startConsumer({ exchangeName = ``, exchangeType = `direct`, queueName = ``, consumerCallback },
                      configs: any = {
                        exchange: {
                          durable: false,
                        },
                        queue: {
                          exclusive: false,
                        },
                        consumer: {
                          noAck: false,
                        }
                      },
                      topics: string[] = []) {
    try {
      const conn = await this.startRabbit();
      try {
        const channel = await conn.createChannel();
        this.logger('[Rabbitode] asserting exchange');
        await channel.assertExchange(exchangeName, exchangeType, { ...configs.exchange });
        this.logger('[Rabbitode] asserting queue');
        const queue = await channel.assertQueue(queueName, { ...configs.queue });
        if (topics.length > 0) {
          this.logger('[Rabbitode] binding topics to queue');
          topics.forEach(async(topic) => {
            this.logger(`[Rabbitode] topic:`, topic);
            await channel.bindQueue(queue.queue, exchangeName, topic)
          });
        } else {
          this.logger('[Rabbitode] binding queue to exchange');
          await channel.bindQueue(queue.queue, exchangeName, queue.queue);
        }
        this.logger(`[Rabbitode] prefetching`);
        await channel.prefetch(10);
        this.logger(`[Rabbitode] consuming messages`);
        await channel.consume(queue.queue, consumerCallback(channel), { ...configs.consumer });
        this.logger(`[Rabbitode] waiting on more messages`)
      } catch (e) {
        this.logger(`[Rabbitode] consumer channel error ${e}`, 'error');
      }
    } catch (e) {
      this.logger(`[Rabbitode] consumer connection error ${e}`, 'error');
    }
  }

  /**
   * @method
   * @name startDirectConsumer
   * @description
   *  this will allow us to start a direct consumer
   * @param {Object} consumerConfig - this is the config for our exchange name and other fields
   * */
  startDirectConsumer(consumerConfig: ConsumerConfig) {
    return this.startConsumer({
      ...consumerConfig,
      exchangeType: 'direct'
    })
  }

  /**
   * @method
   * @name startFanoutConsumer
   * @description
   *  this will allow us to start a fanout consumer
   * @param {Object} consumerConfig - this is the config for our exchange name and other fields
   * */
  startFanoutConsumer(consumerConfig: ConsumerConfig) {
    return this.startConsumer({
      ...consumerConfig,
      exchangeType: 'fanout'
    })
  }

  /**
   * @method
   * @name startTopicConsumer
   * @description
   *  this will allow us to start a topic consumer
   * @param {Object} consumerConfig - this is the config for our exchange name and other fields
   * @param {Array} topics - this is a list of topics we want the queue to listen for
   * */
  startTopicConsumer(consumerConfig: ConsumerConfig, topics: string[]) {
    return this.startConsumer({
      ...consumerConfig,
      exchangeType: 'topic'
    }, topics);
  }

  /**
   * @method
   * @name bufferIfy
   * @description
   *  This will turn our content into a buffer
   * @param {Object | String} content - the content we want to turn into a buffer
   * */
  bufferIfy(content: any): Buffer {
    if (
      typeof content !== 'string' &&
      typeof content == 'object'
    ) {
      content = JSON.stringify(content);
    }
    return new Buffer(content);
  }

  /**
   * @method
   * @name handleRabbitErrror
   * @description
   *  This will handleRabbitErrror
   * */
  handleRabbitErrror(err) {
    if (err.message !== 'Connection closing') {
      this.logger(`[Rabbitode] conn error ${err.message}`, err.message);
    }
  }

  /**
   * @method
   * @name handleRabbitClose
   * @description
   *  This will handleRabbitClose
   * */
  handleRabbitClose() {
    this.logger(`[Rabbitode] Restarting`, 'warn');
    return setTimeout(async() => this.startRabbit(), 1000);
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
   *  if there is a major error we're going to close the main
   *  connection to rabbit
   * */
  closeOnError(err) {
    if (!err) return err;
    this.logger(`[FATAL RABBITODE ERROR CLOSING] ${err}`, 'error');
    this.connection.close();
    return true;
  }

  /**
   * @method
   * @name logger
   * @description
   *  This will either log or not log messages depending
   *  on a debug flag set by users
   * */
  logger(message: string, level: string = 'log'): void {
    if (this.debug) {
      switch (level) {
        case 'warning':
          console.warn(message);
          break;
        case 'info':
          console.info(message);
          break;
        case 'error':
          console.error(message);
          break;
        default:
          console.log(message);
          break;
      }
    }
  }
}

module.exports.RabbitMqInterface = RabbitMqInterface;
