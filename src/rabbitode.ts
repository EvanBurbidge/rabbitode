import * as amqp from 'amqplib';
import { getNewChannel } from './channels';
import { asyncForEach, rabbitLogger } from './utils';
import { afterPublish, publisherCallback, handlePublishError } from './publishing';
import { bufferIfy, isJsonString, decodeToString, decodeToJson } from './encodings';
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

  constructor() {
    rabbitLogger('is ready to use');
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
  startRabbit(connectionOptions = {}): Promise<any> {
    return amqp.connect(this.connectionUri, connectionOptions);
  }
  /**
   * @method
   * @name publishToExchange
   * @description
   *  This will publish our item to an exchange
   * @param {Object} messageConfig - the configuration of the message to be sent
   * @param {String} exchangeType - this is the type e.g. direct, fanout, topic
   * @param {Object} configs - a user can configure the exchanges and stuff whichever way they want
   * @param {Object} connectionOptions - connection options for connecting to rabbitmq
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
    },
    connectionOptions = {}
  ): Promise<any> {
    try {
      const conn = await this.startRabbit(connectionOptions);
      rabbitLogger('creating channel');
      try {
        const channel = await getNewChannel(
          conn, { exchangeName, exchangeType, configs }
        );
        await this.sendPublishMessage(channel, configs, exchangeName, routingKey, content, exchangeType);
        await afterPublish(channel, conn);
      } catch (e) {
        rabbitLogger(`channel error ${e}`, 'error');
        handlePublishError(e, exchangeName, routingKey, this.bufferIfy(content), exchangeType);
      }
    } catch (e) {
      rabbitLogger(`channel error ${e}`, 'error');
      handlePublishError(e, exchangeName, routingKey, this.bufferIfy(content), exchangeType);
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
    rabbitLogger('publishing message');
    const formattedContent = this.bufferIfy(content);
    await channel
      .publish(
        exchangeName,
        routingKey,
        formattedContent,
        { ...configs.channel },
        publisherCallback(exchangeName, routingKey, formattedContent, exchangeType),
      );

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
   * @param {Object} connectionOptions - connection options for connecting to rabbitmq
   * */
  async startConsumer(
    {
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
    topics: string[] = [],
    connectionOptions = {},
  ): Promise<any> {
    try {
      const conn = await this.startRabbit(connectionOptions);
      try {
        const channel = await getNewChannel(conn, {exchangeName, exchangeType, configs});
        const queue = await channel.assertQueue(queueName, { ...configs.queue });
        if (topics.length > 0) {
          rabbitLogger('binding topics to queue');
          await this.mapTopics(channel, queue.queue, exchangeName, topics);
        } else {
          rabbitLogger('binding queue to exchange');
          await channel.bindQueue(queue.queue, exchangeName, queue.queue);
        }
        rabbitLogger('prefetching');
        await channel.prefetch(10);
        rabbitLogger('consuming messages');
        await channel.consume(queue.queue, consumerCallback(channel), { ...configs.consumer });
        rabbitLogger('waiting on more messages');
      } catch (e) {
        rabbitLogger(`consumer channel error ${e}`, 'error');
      }
    } catch (e) {
      rabbitLogger(`consumer connection error ${e}`, 'error');
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
    return bufferIfy(content);
  }

  /**
   * @method
   * @name handleRabbitErrror
   * @description
   *  This will handleRabbitErrror
   * */
  handleRabbitErrror(err):void {
    if (err.message !== 'Connection closing') {
      rabbitLogger(`conn error ${err.message}`, err.message);
    }
  }

  /**
   * @method
   * @name handleRabbitClose
   * @description
   *  This will handleRabbitClose
   * */
  handleRabbitClose(): void {
    rabbitLogger('Restarting', 'warn');
    setTimeout(async() => this.startRabbit(), 1000);
  }

  /**
   * @method
   * @name isJsonString
   * @description
   *  This will check to see if a value contains a valid json string
   * */
  isJsonString (str: any): boolean {
   return isJsonString(str);
  }

  /**
   * @method
   * @description
   *  This will decode our buffer into an object, array, whatever it is.
   * */
  decodeToString(message): string {
    return decodeToString(message)
  }

  /**
   * @method
   * @description
   *  This will decode our buffer into an object, array, whatever it is.
   * */
  decodeToJson(message: any): string | void {
    return decodeToJson(message);
  }

  
}

module.exports.RabbitMqInterface = RabbitMqInterface;

export default RabbitMqInterface;