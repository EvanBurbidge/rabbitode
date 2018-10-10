const amqp = require('amqplib');

export interface MqExchangeMessage {
  exchangeName: string;
  routingKey: string;
  content: Buffer | string;
}

export interface MqTaskMessage {
  queueName: string;
  content: Buffer | string;
}

export interface ConsumerConfig {
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
  public connectionUri: string = 'amqp://localhost';

  constructor() {
    this.logger('[Rabbitode] is ready to use');
  }

  /**
   * @method
   * @name setRabbitUri
   * @description
   *  description here
   * */
  setRabbitUri(uri: string): string {
    return this.connectionUri = uri;
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
  startRabbit(): Promise<any> {
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
      this.logger('[Rabbitode] creating channel');
      try {
        const channel = await conn.createConfirmChannel();
        this.logger(`[Rabbitode] asserting exchange: ${exchangeName},
        exchangeType: ${exchangeType}`);
        await channel.assertExchange(exchangeName, exchangeType, { ...configs.exchange });
        this.logger('[Rabbitode] publishing message');
        await channel.publish(exchangeName, routingKey, this.bufferIfy(content),
                              { ...configs.channel },
                              err => err ?
            this.logger(`[Rabbitode] there was a problem ${err}`, 'error') :
            this.logger('[Rabbitode] message sent'));

        setTimeout(async() => {
          this.logger('[Rabbitode] closing channel');
          await channel.close();
          this.logger('[Rabbitode] closing connection');
          await conn.close();
        },         2500);
      } catch (e) {
        this.logger(`[Rabbitode] channel error ${e}`, 'error');
      }
    } catch (e) {
      this.logger(`[Rabbitode] channel error ${e}`, 'error');
    }
  }

  sendDirect(messageConfig: MqExchangeMessage): this {
    this.publishToExchange(messageConfig, 'direct');
    return this;
  }
  sendFanout(messageConfig: MqExchangeMessage): this {
    this.publishToExchange(messageConfig, 'fanout');
    return this;
  }
  sendTopic(messageConfig: MqExchangeMessage): this {
    this.publishToExchange(messageConfig, 'topic');
    return this;
  }

  /**
   * @method
   * @name startConsumer
   * @description
   *  This will allow us to consume various sorts of queues, it MUST take a
   *  consumer call back param
   *  @param {Object} queueConfig - a user can configure their consumers
   *  @param {Object} configs - a user can configure the queue
   *  @param {Array} topics - a list of topics for a topic exchange
   * */
  async startConsumer({
                        exchangeName = '',
                        exchangeType = 'direct',
                        queueName = '',
                        consumerCallback,
                      },
                      configs: any = {
                        exchange: {
                          durable: false,
                        },
                        queue: {
                          exclusive: false,
                        },
                        consumer: {
                          noAck: false,
                        },
                      },
                      topics: string[] = []): Promise<any> {
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
          await this.mapTopics(channel, queue.queue, exchangeName, topics);
        } else {
          this.logger('[Rabbitode] binding queue to exchange');
          await channel.bindQueue(queue.queue, exchangeName, queue.queue);
        }
        this.logger('[Rabbitode] prefetching');
        await channel.prefetch(10);
        this.logger('[Rabbitode] consuming messages');
        await channel.consume(queue.queue, consumerCallback(channel), { ...configs.consumer });
        this.logger('[Rabbitode] waiting on more messages');
      } catch (e) {
        this.logger(`[Rabbitode] consumer channel error ${e}`, 'error');
      }
    } catch (e) {
      this.logger(`[Rabbitode] consumer connection error ${e}`, 'error');
    }
  }

  /**
   * @method
   * @name mapTopics
   * @description
   *  If we have topics well need to map them and await the promise
   * */
  mapTopics(channel: any, queue, exchangeName: string, topics: string[]): Promise<any> {
    return new Promise((resolve) => {
      const newTopics = topics
        .map(async topic => await channel
          .bindQueue(queue, exchangeName, topic),
        );
      resolve(newTopics);
    });
  }

  /**
   * @method
   * @name startDirectConsumer
   * @description
   *  this will allow us to start a direct consumer
   * @param {Object} consumerConfig - this is the config for our exchange name and other fields
   * */
  startDirectConsumer(consumerConfig: ConsumerConfig, configs?:any): this {
    this.startConsumer({
      ...consumerConfig,
      exchangeType: 'direct',
    },                 configs);
    return this;
  }

  /**
   * @method
   * @name startFanoutConsumer
   * @description
   *  this will allow us to start a fanout consumer
   * @param {Object} consumerConfig - this is the config for our exchange name and other fields
   * */
  startFanoutConsumer(consumerConfig: ConsumerConfig, configs?:any): this {
    this.startConsumer({
      ...consumerConfig,
      exchangeType: 'fanout',
    },                 configs);
    return this;
  }

  /**
   * @method
   * @name startTopicConsumer
   * @description
   *  this will allow us to start a topic consumer
   * @param {Object} consumerConfig - this is the config for our exchange name and other fields
   * @param {Array} topics - this is a list of topics we want the queue to listen for
   * */
  startTopicConsumer(consumerConfig: ConsumerConfig, topics: string[], configs?:any): this {
    this.startConsumer({
      ...consumerConfig,
      exchangeType: 'topic',
    },                 configs, topics);
    return this;
  }

  /**
   * @method
   * @name bufferIfy
   * @description
   *  This will turn our content into a buffer
   * @param {Object | String} content - the content we want to turn into a buffer
   * */
  bufferIfy(content: any): Buffer {
    let updatableContent = content;
    if (
      typeof updatableContent !== 'string' &&
      typeof updatableContent === 'object'
    ) {
      updatableContent = JSON.stringify(content);
    }
    return new Buffer(updatableContent);
  }

  /**
   * @method
   * @name handleRabbitErrror
   * @description
   *  This will handleRabbitErrror
   * */
  handleRabbitErrror(err):void {
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
  handleRabbitClose(): void {
    this.logger('[Rabbitode] Restarting', 'warn');
    setTimeout(async() => this.startRabbit(), 1000);
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
