import to from 'await-to-js';
import Logger from './logger';
import { bufferIfy } from './encoding';
import { getNewChannel } from './channels';
import { getDefaultConsumerConfig } from './utils';
import { handlePublishError } from './errorHandling';
import { startRabbit, closeRabbit } from './connection';
import {
  SendMessageProps,
  SendPublishMessageProps,
} from './interfaces';
import { Connection } from 'amqplib';

const baseConfig = getDefaultConsumerConfig();

export const publishMessageToQueue = async ({
  channel,
  configs,
  exchangeName,
  routingKey,
  content,
  exchangeType,
  publishCallback = t => {},
}: SendPublishMessageProps) => {
  Logger.Log('publishing message');
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
    Logger.Log(error, 'error');
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
 * */
export const sendMessage = async ({
  messageConfig,
  exchangeType,
  configs = baseConfig,
  connectionOptions,
  connectionUrl,
  publishCallback = t => {}
}: SendMessageProps): Promise<boolean> => {
  const { 
    exchangeName,
    content,
    routingKey
  } = messageConfig;
  Logger.Log('starting publisher');
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
    return Promise.reject(false);
  }
  Logger.Log('channel established');
  try {
    await publishMessageToQueue({
      channel,
      configs,
      routingKey,
      exchangeType,
      exchangeName,
      publishCallback,
      content: bufferIfy(content),
    });
    Logger.Log('message published');
  } catch (publishErr) {
    handlePublishError({
      routingKey,
      exchangeType,
      exchangeName,
      err: publishErr,
      content:bufferIfy(content),
    });
    return Promise.reject(false);
  }
  try {
    await closeRabbit(conn, channel);
    Logger.Log('connection closed');
  } catch (closeError) {
    handlePublishError({
      routingKey,
      exchangeType,
      exchangeName,
      err: closeError,
      content:bufferIfy(content),
    });
    return Promise.reject(false);
  }
  return true;
}