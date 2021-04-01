import { Channel, connect, Connection } from 'amqplib';
import { ConnectionOptions } from 'tls';
import { rabbitLogger } from './utils'

export const startRabbit = (connectionUrl: string, options: ConnectionOptions): Promise<Connection> => connect(connectionUrl, options);

export const closeRabbit = async (connection: Connection, channel: Channel): Promise<void> => {
  rabbitLogger('closing channel');
  await channel.close();
  rabbitLogger('closing connection');
  await connection.close();
}