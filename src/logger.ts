class Logger {
  debug: boolean;
  constructor(debug: boolean) {
    this.debug = debug;
  }

  setDebug(debug: boolean):this {
    this.debug = debug
    return this;
  }

  Log(message: string, level?: string): void {
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
}

export default new Logger(true);