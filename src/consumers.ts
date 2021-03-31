import to from 'await-to-js';
import { rabbitLogger, asyncForEach, getDefaultQueueConfig } from './utils';
import { getNewChannel } from './channels';
import { startRabbit } from './startRabbit';
import { ConsumerConfig } from './interfaces';


const baseConfig = Object.assign({}, getDefaultQueueConfig(), { consumer: { noAck: false } });

export const mapTopicsToQueue = (channel, queue, exchangeName, topics): Promise<any> => new Promise(async (resolve) => {
  const mappedTopics = [];
  await asyncForEach(topics, async topic => {
    const t = await channel.bindQueue(queue, exchangeName, topic);
    mappedTopics.push(t);
  });
  resolve(mappedTopics);
});


interface StartConsumerArgs {
  queueConfig: ConsumerConfig;
  configs: any;
  topics?: any[];
  connectionOptions?: any
  connectionUrl: string;
  prefetchAmount?: number;
}

export const startConsumer = async ({
  queueConfig,
  configs = baseConfig,
  topics = [],
  connectionOptions = {},
  connectionUrl = '',
  prefetchAmount = 10,
}: StartConsumerArgs): Promise<any> => {
    const {
      exchangeName,
      exchangeType,
      queueName,
      consumerCallback,
    } = queueConfig;
    console.log('consuming');
    const [connErr, conn] = await to(startRabbit(connectionUrl, connectionOptions));
    if (connErr) {
      rabbitLogger(`consumer connection error ${connErr}`, 'error');
      return false;
    }
    const [channelErr, channel] = await to(getNewChannel(conn, {exchangeName, exchangeType, configs}));
    if (channelErr) {
      rabbitLogger(`channel connection error ${connErr}`, 'error');
      return false;
    }
    const queue = await channel.assertQueue(queueName, { ...configs.queue });
    if (Boolean(topics.length)) {
      rabbitLogger('binding topics to queue');
      await mapTopicsToQueue(channel, queue.queue, exchangeName, topics);
    } else {
      rabbitLogger('binding queue to exchange');
      await channel.bindQueue(queue.queue, exchangeName, queue.queue);
    }
    rabbitLogger('prefetching');
    const [prefetchErr] = await to(channel.prefetch(prefetchAmount));
    if (prefetchErr) {
      rabbitLogger(`something went wrong with prefetching ${prefetchErr}`);
    }
    rabbitLogger('consuming messages');
    const [consumeErr] = await to(channel.consume(queue.queue, consumerCallback(channel), { ...configs.consumer }));
    if (consumeErr) {
      rabbitLogger(`something went wrong with consuming ${consumeErr}`);
    }
}