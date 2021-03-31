import { rabbitLogger } from './utils';
import { addToOfflineQueue } from './offline';
import { HandlePublishErrorProps } from './interfaces'


export const handlePublishError = ({
  err,
  routingKey,
  exchangeType,
  exchangeName,
  content,
}: HandlePublishErrorProps): void => {
  rabbitLogger(`[Rabbitode] there was a problem ${err}`, 'error');
  addToOfflineQueue({
    exchangeType,
    message: {
      exchangeName,
      routingKey,
      content,
    },
    isPublished: false,
  });
}
