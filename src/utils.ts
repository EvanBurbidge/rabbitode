type forEachCb = (i: any, idx:number, array: any[]) => Promise<any>;

export async function asyncForEach(array: any[], callback:forEachCb) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

export const getDefaultQueueConfig = () => ({
  exchange: {
    durable: false,
  },
  queue: {
    exclusive: false,
  },
});

export const getDefaultConsumerConfig = () => Object.assign({}, getDefaultQueueConfig(), { consumer: { noAck: false } });