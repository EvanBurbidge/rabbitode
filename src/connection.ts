import { Channel, connect, Connection } from 'amqplib';
import { ConnectionOptions } from 'tls';
import Logger from './logger'

export const startRabbit = (connectionUrl: string, options: ConnectionOptions): Promise<Connection> => connect(connectionUrl, options);

export const closeRabbit = async (connection: Connection, channel: Channel): Promise<void> => {
  Logger.Log('closing channel');
  try {
    await channel.close();
  } catch (error) {
    return Promise.reject(error);
  }
  try {
    Logger.Log('closing connection');
    await connection.close();
  } catch (closeError) {
    return Promise.reject(closeError);
  }
}