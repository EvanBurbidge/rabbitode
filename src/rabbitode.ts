import { startRabbit } from './startRabbit';
import { startConsumer } from './consumers'
import {  publishToExchange } from './publisher';
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
   * @name sendMessage
   * @description
   *  sends a message to a given exchange types
   * @param {Object} senderProps - this is the config for our exchange name and other fields
   * @property {Object} messageConfig - the message to be sent
   * @property {Object} configs - extra config options
   * @property {Object} connectionOptions - extra options to pass to rabbitmq start method
   * @property {String} exchangeType - the type of exchange we want
   * @property {Array} topics - the topics we want to subscibe to
   * */
  async sendMessage({
    messageConfig,
    configs,
    connectionOptions,
    exchangeType
  }): Promise<this> {
    await publishToExchange(messageConfig, exchangeType, configs, connectionOptions, this.connectionUri);
    return this;
  }
  /**
   * @method
   * @name startListener
   * @description
   *  this will allow us to start a consumer for a given exchange type
   * @param {Object} consumerProps - this is the config for our exchange name and other fields
   * @property {Object} consumerConfig - the configuration for the queue consumer
   * @property {Object} configs - the configuration for the queue consumer
   * @property {Object} connectionOptions - extra options to pass to rabbitmq
   * @property {String} exchangeType - the type of exchange we want
   * @property {Array} topics - the topics we want to subscibe to
   * */
  async startListener({
    consumerConfig,
    configs,
    connectionOptions,
    exchangeType,
    topics,
  }: startConsumerProps): Promise<this> {
    await startConsumer({
      queueConfig: { ...consumerConfig, exchangeType },
      configs,
      topics,
      connectionOptions,
      connectionUrl: this.connectionUri,
    });
    return this;
  }
}

export default RabbitMqInterface;