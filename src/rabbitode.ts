const amqp = require('amqplib');
const { afterPublish } = require('./publishing');
const { asyncForEach, RabbitLogger } = require('./utils');

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

  public debug: boolean = false;
  public connectionUri: string = 'amqp://localhost';
  private offlineQueue: any[] = [];

  constructor() {
    RabbitLogger('is ready to use');
  }

  /**
   * @method
   * @name setRabbitUri
   * @description
   *  description here
   * */
  setRabbitUri(uri: string): this {
    this.connectionUri = uri;
    return this;
  }
  /**
   * @method
   * @name endableDebugging
   * @description
   *  if this is called we will see debugging statements.
   * */
  enableDebugging():this {
    this.debug = true;
    return this;
  }
  /**
   * @method
   * @name disableDebugging
   * @description
   *  if this is called we will not debugging statements.
   * */
  disableDebugging():this {
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
  async publishToExchange(
    {
      exchangeName,
      routingKey,
      content,
    }: MqExchangeMessage,
    exchangeType: string,
    configs: any = {
      exchange: { durable: false },
      channel: { persistent: true },
    }
  ): Promise<any> {
    try {
      const conn = await this.startRabbit();
      RabbitLogger('creating channel');
      try {
        const channel = await conn.createConfirmChannel();
        await channel.assertExchange(exchangeName, exchangeType, { ...configs.exchange });
        await this.sendPublishMessage(channel, configs, exchangeName, routingKey, content, exchangeType);
        await afterPublish(channel, conn);
      } catch (e) {
        RabbitLogger(`channel error ${e}`, 'error');
        this.handlePublishError(e, exchangeName, routingKey, this.bufferIfy(content), exchangeType);
      }
    } catch (e) {
      RabbitLogger(`channel error ${e}`, 'error');
      this.handlePublishError(e, exchangeName, routingKey, this.bufferIfy(content), exchangeType);
    }
  }

  sendDirect(messageConfig: MqExchangeMessage, configs?: any): this {
    this.publishToExchange(messageConfig, 'direct', configs);
    return this;
  }
  sendFanout(messageConfig: MqExchangeMessage,  configs?: any): this {
    this.publishToExchange(messageConfig, 'fanout', configs);
    return this;
  }
  sendTopic(messageConfig: MqExchangeMessage,  configs?: any): this {
    this.publishToExchange(messageConfig, 'topic', configs);
    return this;
  }
  async sendPublishMessage(channel, configs, exchangeName, routingKey, content, exchangeType) {
    RabbitLogger('publishing message');
    const formattedContent = this.bufferIfy(content);
    await channel
      .publish(
        exchangeName,
        routingKey,
        formattedContent,
        { ...configs.channel },
        this.publisherCallback(exchangeName, routingKey, formattedContent, exchangeType),
      );
  }
  publisherCallback(exchangeName, routingKey, formattedContent, exchangeType) {
    return  (err) => {
      if (err) {
        this.handlePublishError(err, exchangeName, routingKey, formattedContent, exchangeType);
      }
      RabbitLogger('message sent');
    };
  }
  handlePublishError(err, exchangeName, routingKey, formattedContent, exchangeType) {

    RabbitLogger(`there was a problem ${err}`, 'error');

    this.offlineQueue.push({
      exchangeType,
      message: {
        exchangeName, routingKey, formattedContent,
      },
      isPublished: false,
    });
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
        RabbitLogger('asserting exchange');
        await channel.assertExchange(exchangeName, exchangeType, { ...configs.exchange });
        RabbitLogger('asserting queue');
        const queue = await channel.assertQueue(queueName, { ...configs.queue });
        if (topics.length > 0) {
          RabbitLogger('binding topics to queue');
          await this.mapTopics(channel, queue.queue, exchangeName, topics);
        } else {
          RabbitLogger('binding queue to exchange');
          await channel.bindQueue(queue.queue, exchangeName, queue.queue);
        }
        RabbitLogger('prefetching');
        await channel.prefetch(10);
        RabbitLogger('consuming messages');
        await channel.consume(queue.queue, consumerCallback(channel), { ...configs.consumer });
        RabbitLogger('waiting on more messages');
      } catch (e) {
        RabbitLogger(`consumer channel error ${e}`, 'error');
      }
    } catch (e) {
      RabbitLogger(`consumer connection error ${e}`, 'error');
    }
  }

  /**
   * @method
   * @name mapTopics
   * @description
   *  If we have topics well need to map them and await the promise
   * */
  mapTopics(channel: any, queue, exchangeName: string, topics: string[]): Promise<any> {
    return new Promise(async (resolve) => {
      const newTopics = await asyncForEach(topics, async topic => await channel.bindQueue(queue, exchangeName, topic));
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
    this.startConsumer({ ...consumerConfig, exchangeType: 'direct' }, configs);
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
    this.startConsumer({ ...consumerConfig, exchangeType: 'fanout' }, configs);
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
    this.startConsumer({ ...consumerConfig, exchangeType: 'topic' }, configs, topics);
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
    return Buffer.from(updatableContent);
  }

  /**
   * @method
   * @name handleRabbitErrror
   * @description
   *  This will handleRabbitErrror
   * */
  handleRabbitErrror(err):void {
    if (err.message !== 'Connection closing') {
      RabbitLogger(`conn error ${err.message}`, err.message);
    }
  }

  /**
   * @method
   * @name handleRabbitClose
   * @description
   *  This will handleRabbitClose
   * */
  handleRabbitClose(): void {
    RabbitLogger('Restarting', 'warn');
    setTimeout(async() => this.startRabbit(), 1000);
  }

  /**
   * @method
   * @name isJsonString
   * @description
   *  This will check to see if a value contains a valid json string
   * */
  isJsonString (str: any): boolean {
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
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
  decodeToJson(message: any): string | void {
    if (this.isJsonString(message.content.toString())) {
      return JSON.parse(message.content.toString());
    }
    RabbitLogger('message is not valid json', 'error');
  }

  
}

module.exports.RabbitMqInterface = RabbitMqInterface;
