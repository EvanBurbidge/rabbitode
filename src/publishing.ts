import { rabbitLogger } from './utils';
import { addToOfflineQueue } from './offline';

export async function afterPublish(channel: any, conn: any) {
  setTimeout(async() => {
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
  routingKey:string,
  formattedContent:Buffer,
  exchangeType:string
) => err => err ? handlePublishError(
    err,
    exchangeName,
    routingKey,
    formattedContent,
    exchangeType
  )
  : rabbitLogger('message sent');

module.exports = {
  afterPublish,
  publisherCallback,
  handlePublishError,
}