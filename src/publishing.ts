import to from 'await-to-js';
import { getDefaultQueueConfig, rabbitLogger } from './utils';
import { bufferIfy } from './encodings';
import { getNewChannel } from './channels';
import { startRabbit } from './startRabbit';
import { addToOfflineQueue } from './offline';
import { MqExchangeMessage } from './interfaces';

export const afterPublish = async (channel: any, conn: any) => {
  setTimeout(async () => {
    rabbitLogger('[Rabbitode] closing channel');
    await channel.close();
    rabbitLogger('[Rabbitode] closing connection');
    await conn.close();
  }, 2500);
};

export const handlePublishError = (err, exchangeName, routingKey, formattedContent, exchangeType) => {
  rabbitLogger(`[Rabbitode] there was a problem ${err}`, 'error');
  addToOfflineQueue({
    exchangeType,
    message: {
      exchangeName,
      routingKey,
      formattedContent,
    },
    isPublished: false,
  });
}


export const publisherCallback = (
  exchangeName: string,
  routingKey: string,
  formattedContent: Buffer,
  exchangeType: string
) => err => err ? handlePublishError(
  err,
  exchangeName,
  routingKey,
  formattedContent,
  exchangeType
)
  : rabbitLogger('message sent');

export const sendPublishMessage = async (
  channel:any,
  configs:any,
  exchangeName:string,
  routingKey:string,
  content: Buffer,
  exchangeType:string
) => {
  rabbitLogger('publishing message');
  try {
    await channel.publish(
      exchangeName,
      routingKey,
      content,
      { ...configs.channel },
      publisherCallback(exchangeName, routingKey, content, exchangeType),
    );
  } catch( error ) {
    rabbitLogger(error, 'error');
  }
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
export const publishToExchange = async (
  messageConfig: MqExchangeMessage,
  exchangeType: string,
  configs: any = getDefaultQueueConfig(),
  connectionOptions = {},
  connectionUri: string = '',
): Promise<any> => {
  const { 
    exchangeName,
    content,
    routingKey
  } = messageConfig;
  const [connErr, conn] = await to(startRabbit(connectionUri, connectionOptions));
  if (connErr) {
    rabbitLogger(`channel error ${connErr}`, 'error');
    handlePublishError(connErr, exchangeName, routingKey, bufferIfy(content), exchangeType);
    return false;
  }
  const [channelErr, channel] = await to(getNewChannel(conn, { exchangeName , exchangeType, configs }));
  if (channelErr) {
    rabbitLogger(`channel error ${connErr}`, 'error');
    handlePublishError(connErr, exchangeName, routingKey, bufferIfy(content), exchangeType);
    return false;
  }
  await sendPublishMessage(channel, configs, exchangeName, routingKey, bufferIfy(content), exchangeType);
  await afterPublish(channel, conn);
}