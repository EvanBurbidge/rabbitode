import to from 'await-to-js';
import Logger from './logger';
import { handleCreateChannel } from './channels';
import { getDefaultConsumerConfig } from './utils';
import { StartConsumerProps, MapTopicsToQueueProps, CreateChannelConfig, CreateChannelReturn } from './interfaces';

const baseConfig = getDefaultConsumerConfig();

export const mapTopicsToQueue = ({
  channel,
  queue,
  exchangeName,
  topics,
}: MapTopicsToQueueProps): Promise<any> => new Promise(async (resolve) => {
  const mappedTopics = topics.map((topic:string) => channel.bindQueue(queue, exchangeName, topic));
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
): Promise<boolean | CreateChannelReturn> => {
  const {
    exchangeName,
    queueName,
    consumerCallback,
  } = queueConfig;
  
  const { channel, conn }: CreateChannelReturn = await handleCreateChannel(queueConfig, connectionUrl, connectionOptions, configs);

  const [queueErr, queue]: any = await to(channel.assertQueue(queueName, { ...configs.queue }));
  if (queueErr) {
    Logger.Log(`issue with asseting queue ${queueErr}`);
    return Promise.reject(false);
  }
  if (Boolean(topics.length)) {
    await mapTopicsToQueue({
      topics,
      channel,
      exchangeName,
      queue: queue.queue,
    });
  } else {
    const [bindErr] = await to(channel.bindQueue(queue.queue, exchangeName, queue.queue));
    if (bindErr) {
      Logger.Log(`problem binding to queue ${bindErr}`);
      return Promise.reject(false);
    }
  }
  const [prefetchErr] = await to(channel.prefetch(prefetchAmount));
  if (prefetchErr) {
    Logger.Log(`something went wrong with prefetching ${prefetchErr}`);
    return Promise.reject(false);
  }
  const [consumeErr] = await to(channel.consume(queue.queue, consumerCallback(channel), { ...configs.consumer }));
  if (consumeErr) {
    Logger.Log(`something went wrong with consuming ${consumeErr}`);
    return Promise.reject(false);
  }
  return {
    channel, conn
  };
}