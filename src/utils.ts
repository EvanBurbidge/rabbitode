type forEachCb = (i: any, idx:number, array: any[]) => Promise<any>;

export async function asyncForEach(array: any[], callback:forEachCb) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

export function rabbitLogger(message: string, level: string = 'log', debug?: boolean): void {
 if (debug) {
   switch (level) {
     case 'warning':
       console.warn(`[Rabbitode] ${message}`);
       break;
     case 'info':
       console.info(`[Rabbitode] ${message}`);
       break;
     case 'error':
       console.error(`[Rabbitode] ${message}`);
       break;
     default:
       console.log(`[Rabbitode] ${message}`);
       break;
   }
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