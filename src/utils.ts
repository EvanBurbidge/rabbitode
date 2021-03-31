export async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}
/**
* @method
* @description
*  This will either log or not log messages depending
*  on a debug flag set by users
* */
export function rabbitLogger(message: string, level: string = 'log'): void {
 if (this.debug) {
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
})