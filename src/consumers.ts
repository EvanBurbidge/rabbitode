import to from 'await-to-js';
import { getNewChannel, handleCreateChannel } from './channels';
import { startRabbit } from './connection';
import { rabbitLogger, getDefaultConsumerConfig } from './utils';
import { StartConsumerProps, MapTopicsToQueueProps, CreateChannelConfig, CreateChannelReturn } from './interfaces';
import { Connection } from 'amqplib';

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
): Promise<boolean> => {
  const {
    exchangeName,
    queueName,
    consumerCallback,
  } = queueConfig;
  
  const { channel }: CreateChannelReturn = await handleCreateChannel(queueConfig, connectionUrl, connectionOptions, configs);

  const [queueErr, queue]: any = await to(channel.assertQueue(queueName, { ...configs.queue }));
  if (queueErr) {
    rabbitLogger(`issue with asseting queue ${queueErr}`);
    return false;
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