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
  public connectionUri: string = `amqp://localhost`;

  constructor() {
    console.log(`[Rabbitode] is ready to use`);
  }

  /**
   * @method
   * @name setRabbitUri
   * @description
   *  description here
   * */
  setRabbitUri (uri: string):void {
      this.connectionUri = uri;
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
   * */
  async publishToExchange({ exchangeName, routingKey, content }, exchangeType) {
    try {
      const conn = await this.startRabbit();
      console.log(`[Rabbitode] creating channel`);
      try {
        const channel = await conn.createConfirmChannel();
        console.log(`[Rabbitode] asserting exchange,  exchangeType: ${exchangeType}`);
        await channel.assertExchange(exchangeName, exchangeType, { durable: false });
        console.log(`[Rabbitode] publishing message`);
        let published = await channel.publish(exchangeName, routingKey, this.bufferIfy(content),
          { persistent: true },
          (err, ok) => {
            if (err) {
              console.error(`[rabbitode] there was a problem`);
            }
          });
        console.log(`[Rabbitode] message published: `, published);
        setTimeout(async () => {
          console.log(`[Rabbitode] closing channel`);
          await channel.close();
          console.log(`[Rabbitode] closing connection`);
          await conn.close();
        }, 2500);
      } catch (e) {
        console.error(`[Rabbitode] channel error`, e);
      }
    } catch (e) {
      console.error(`[Rabbitode] connection error`);
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
    console.log(`[Rabbitode] publishing message`);
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
   * */
  async startConsumer({ exchangeName = ``, exchangeType = `direct`, queueName = ``, consumerCallback }, topics: string[] = []) {
    try {
      const conn = await this.startRabbit();
      try {
        const channel = await conn.createChannel();
        console.log('[Rabbitode] asserting exchange');
        await channel.assertExchange(exchangeName, exchangeType, { durable: false });
        console.log('[Rabbitode] asserting queue');
        const queue = await channel.assertQueue(queueName, { exclusive: false });
        if (topics.length > 0) {
          console.log('[Rabbitode] binding topics to queue');
          await topics.map(async (topic) => await channel.bindQueue(queue.queue, exchangeName, topic));
        } else {
          console.log('[Rabbitode] binding queue to exchange');
          await channel.bindQueue(queue.queue, exchangeName, exchangeType === 'fanout' ? '' : queue.queue);
        }
        console.log(`[Rabbitode] prefetching`);
        await channel.prefetch(10);
        console.log(`[Rabbitode] consuming messages`);
        await channel.consume(queue.queue, consumerCallback(channel), { noAck: false });
        console.log(`[Rabbitode] waiting on more messages`)
      } catch (e) {
        console.error(`[Rabbitode] consumer channel error`, e);
      }
    } catch (e) {
      console.error(`[Rabbitode] consumer connection error`, e);
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
    console.warn(`[Rabbitode] Restarting`);
    return setTimeout(async () => this.startRabbit(), 1000);
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
    console.error(`[FATAL RABBITODE ERROR CLOSING]`, err);
    this.connection.close();
    return true;
  }
}

module.exports.RabbitMqInterface = RabbitMqInterface;
