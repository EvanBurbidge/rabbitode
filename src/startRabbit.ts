import * as amqplib from 'amqplib';

export const startRabbit = (connectionUrl: string, options = {}) => amqplib.connect(connectionUrl, options);