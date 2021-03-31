import to from 'await-to-js';
import { getNewChannel } from './channels';
import { startRabbit } from './startRabbit';
import { StartConsumerProps } from './interfaces';
import { rabbitLogger, getDefaultConsumerConfig } from './utils';


const baseConfig = getDefaultConsumerConfig();

export const mapTopicsToQueue = (channel, queue, exchangeName, topics): Promise<any> => new Promise(async (resolve) => {
  const mappedTopics = topics.map(topic => channel.bindQueue(queue, exchangeName, topic));
  resolve(mappedTopics);
});

export const startConsumer = async ({
  queueConfig,
  configs = baseConfig,
  topics = [],
  connectionOptions = {},
  connectionUrl = '',
  prefetchAmount = 10,
}: StartConsumerProps
): Promise<boolean> => {

  const {
    exchangeName,
    exchangeType,
    queueName,
    consumerCallback,
  } = queueConfig;

  const [connErr, conn] = await to(startRabbit(connectionUrl, connectionOptions));
  if (connErr) {
    rabbitLogger(`consumer connection error ${connErr}`, 'error');
    return false;
  }
  const [channelErr, channel] = await to(getNewChannel(conn, { exchangeName, exchangeType, configs }));
  if (channelErr) {
    rabbitLogger(`channel connection error ${connErr}`, 'error');
    return false;
  }
  const [queueErr, queue]: any = await to(channel.assertQueue(queueName, { ...configs.queue }));
  if (queueErr) {
    rabbitLogger(`issue with asseting queue ${queueErr}`);
    return false;
  }
  if (Boolean(topics.length)) {
    await mapTopicsToQueue(channel, queue.queue, exchangeName, topics);
  } else {
    const [bindErr] = await to(channel.bindQueue(queue.queue, exchangeName, queue.queue));
    if (bindErr) {
      rabbitLogger(`problem binding to queue ${bindErr}`);
      return false;
    }
  }
  const [prefetchErr] = await to(channel.prefetch(prefetchAmount));
  if (prefetchErr) {
    rabbitLogger(`something went wrong with prefetching ${prefetchErr}`);
    return false;
  }
  const [consumeErr] = await to(channel.consume(queue.queue, consumerCallback(channel), { ...configs.consumer }));
  if (consumeErr) {
    rabbitLogger(`something went wrong with consuming ${consumeErr}`);
    return false;
  }
  return true;
}