import to from 'await-to-js';
import { rabbitLogger } from './utils';
import { bufferIfy } from './encoding';
import { getNewChannel } from './channels';
import { startRabbit } from './connection';
import { handlePublishError } from './errorHandling';
import {
  SendMessageProps,
  SendPublishMessageProps,
} from './interfaces';
import { Connection } from 'amqplib';

export const publishMessageToQueue = async ({
  channel,
  configs,
  exchangeName,
  routingKey,
  content,
  exchangeType,
  publishCallback,
}: SendPublishMessageProps) => {
  rabbitLogger('publishing message');
  try {
    await channel.publish(
      exchangeName,
      routingKey,
      content,
      { ...configs.channel },
      publishCallback({
        exchangeName,
        routingKey,
        content,
        exchangeType
      }),
    );
  } catch(error) {
    rabbitLogger(error, 'error');
  }
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
 * @property {String} connectionUrl - the connection url we want
 * @property {Array} topics - the topics we want to subscibe to
 * @example
 * const { conn, channel } = await sendMessage({
 *   messageConfig: {
 *       exchangeName: 'direct_test_exchange',
 *       routingKey: `direct_test_queue`,
 *       content: {
 *         message: `this is a test message for direct stuff ${count}`
 *       }
 *   },
 *   exchangeType: 'direct',
 *   connectionUrl: 'amqp://localhost',
 *   configs: {},
 *   connectionOptions: {},
 * });
 * await closeRabbit(conn, channel);
 * */
export const sendMessage = async ({
  messageConfig,
  exchangeType,
  configs,
  connectionOptions,
  connectionUrl,
  publishCallback
}: SendMessageProps): Promise<any> => {
  const { 
    exchangeName,
    content,
    routingKey
  } = messageConfig;
  const conn: Connection = await startRabbit(connectionUrl, connectionOptions);
  const [channelErr, channel]: any = await to(getNewChannel(conn, { exchangeName , exchangeType, configs }));
  if (channelErr) {
    handlePublishError({
      routingKey,
      exchangeType,
      exchangeName,
      err: channelErr,
      content:bufferIfy(content),
    });
    return false;
  }
  await publishMessageToQueue({
    channel,
    configs,
    routingKey,
    exchangeType,
    exchangeName,
    publishCallback,
    content: bufferIfy(content),
  });
  return {
    channel, conn,
  };
}