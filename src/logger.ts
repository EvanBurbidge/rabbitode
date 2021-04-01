const loggerConfig = {
  debug: true,
}

export const setDebug = (shouldDebug: boolean): void => {
  loggerConfig.debug = shouldDebug;
};

export function rabbitLogger(message: string, level: string = 'log'): void {
  if (loggerConfig.debug) {
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
 