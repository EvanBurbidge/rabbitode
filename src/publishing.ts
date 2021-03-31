const { RabbitLogger } = require('./utils');

async function afterPublish(channel: any, conn: any) {
  setTimeout(async() => {
    logger('[Rabbitode] closing channel');
    await channel.close();
    logger('[Rabbitode] closing connection');
    await conn.close();
  }, 2500);
};

const handlePublishError = (err, exchangeName, routingKey, formattedContent, exchangeType) => {
  RabbitLogger(`[Rabbitode] there was a problem ${err}`, 'error');
  this.offlineQueue.push({
    exchangeType,
    message: {
      exchangeName, routingKey, formattedContent,
    },
    isPublished: false,
  });
}

const publisherCallback = (
  exchangeName: string,
  routingKey:string,
  formattedContent:string,
  exchangeType:string
) => err => err ? handlePublishError(
    err,
    exchangeName,
    routingKey,
    formattedContent,
    exchangeType
  )
  : logger('message sent');

module.exports = {
  afterPublish,
}