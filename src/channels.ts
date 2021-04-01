import { Channel, Connection } from "amqplib";
import Logger from './logger';
import { startRabbit } from './connection';
import { CreateChannelConfig, ConsumerConfig, CreateChannelReturn } from "./interfaces";

export const getNewChannel = async (
  conn: Connection,
  {
    exchangeName,
    exchangeType,
    configs,
  }: CreateChannelConfig
): Promise<Channel> => {
  const channel: Channel = await conn.createConfirmChannel();
  await channel.assertExchange(exchangeName, exchangeType, { ...configs.exchange });
  return channel;
}

export const handleCreateChannel = (
  queueConfig: ConsumerConfig,
  connectionUrl: string,
  connectionOptions: any,
  configs: any,
): Promise<CreateChannelReturn> => new Promise(async (resolve, reject) => {
  const {
    exchangeName,
    exchangeType,
  } = queueConfig;
  try {
    const conn: Connection = await startRabbit(connectionUrl, connectionOptions);
    const channel: Channel = await getNewChannel(conn, { exchangeName, exchangeType, configs });
    resolve({
      conn,
      channel,
    });
  } catch (error) {
    Logger.Log(`channel connection error ${error}`, 'error');
    reject();
  }
})
