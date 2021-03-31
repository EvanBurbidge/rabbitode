import { startRabbit } from './startRabbit';
import { startConsumer } from './consumers'
import {  publishToExchange } from './publishing';
import { rabbitLogger } from './utils';
import { bufferIfy, isJsonString, decodeToString, decodeToJson } from './encodings';
import {
  MqExchangeMessage,
  ConsumerConfig,
  startConsumerProps,
} from './interfaces'

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
    rabbitLogger.bind(this);
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
    return startRabbit(this.connectionUri, connectionOptions);
  }
  /**
   * @method
   * @description
   * this method can be used to send direct messages
   * */
  async sendDirect(messageConfig: MqExchangeMessage, configs: any, connectionOptions: any): Promise<this> {
    console.log(messageConfig);
    await publishToExchange(messageConfig, 'direct', configs, connectionOptions, this.connectionUri);
    return this;
  }
  /**
   * @method
   * @description
   * this method can be used to send fanout messages
   * */
  async sendFanout(messageConfig: MqExchangeMessage,  configs: any, connectionOptions: any): Promise<this> {
    await publishToExchange(messageConfig, 'fanout', configs, connectionOptions, this.connectionUri);
    return this;
  }
  /**
   * @method
   * @description
   * this method can be used to send topic messages
   * */
  async sendTopic(messageConfig: MqExchangeMessage,  configs: any, connectionOptions: any): Promise<this> {
    await publishToExchange(messageConfig, 'topic', configs, connectionOptions, this.connectionUri);
    return this;
  }
  /**
   * @method
   * @name startDirectConsumer
   * @description
   *  this will allow us to start a direct consumer
   * @param {Object} consumerConfig - this is the config for our exchange name and other fields
   * */
  async startDirectConsumer({
    consumerConfig,
    configs,
    connectionOptions,
  }: startConsumerProps): Promise<this> {
    await startConsumer({
      queueConfig: { ...consumerConfig, exchangeType: 'direct' },
      configs,
      connectionOptions,
      connectionUrl: this.connectionUri,
    });
    return this;
  }
  /**
   * @method
   * @name startFanoutConsumer
   * @description
   *  this will allow us to start a fanout consumer
   * @param {Object} consumerConfig - this is the config for our exchange name and other fields
   * */
  async startFanoutConsumer({
    consumerConfig,
    configs,
    connectionOptions
  }: startConsumerProps): Promise<this> {
    await startConsumer({
      queueConfig: { ...consumerConfig, exchangeType: 'fanout' },
      configs,
      connectionOptions,
      connectionUrl: this.connectionUri,
    });
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
  async startTopicConsumer({
    consumerConfig,
    configs,
    connectionOptions,
    topics,
  }: startConsumerProps): Promise<this> {
    await startConsumer({
      queueConfig: { ...consumerConfig, exchangeType: 'topic' },
      topics,
      configs,
      connectionOptions,
      connectionUrl: this.connectionUri,
    });
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
   * @name handleRabbitError
   * @description
   *  This will handleRabbitError
   * */
  handleRabbitError(err):void {
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
    setTimeout(async() => this.startRabbit({}), 1000);
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