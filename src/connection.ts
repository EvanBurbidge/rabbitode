import { Channel, connect, Connection } from 'amqplib';
import { ConnectionOptions } from 'tls';
import Logger from './logger'

export const startRabbit = (connectionUrl: string, options: ConnectionOptions): Promise<Connection> => connect(connectionUrl, options);

export const closeRabbit = async (connection: Connection, channel: Channel): Promise<void> => {
  Logger.Log('closing channel');
  await channel.close();
  Logger.Log('closing connection');
  await connection.close();
}