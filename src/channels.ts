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
  try {
    const channel: Channel = await conn.createConfirmChannel();
    await channel.assertExchange(exchangeName, exchangeType, { ...configs.exchange });
    return channel;
  } catch (err) {
    return Promise.reject();
  }
  
}

export const handleCreateChannel = async (
  queueConfig: ConsumerConfig,
  connectionUrl: string,
  connectionOptions: any,
  configs: any,
): Promise<CreateChannelReturn> => {
  const {
    exchangeName,
    exchangeType,
  } = queueConfig;
  try {
    const conn: Connection = await startRabbit(connectionUrl, connectionOptions);
    const channel: Channel = await getNewChannel(conn, { exchangeName, exchangeType, configs });
    return {
      conn,
      channel,
    };
  } catch (error) {
    Logger.Log(`channel connection error ${error}`, 'error');
    return Promise.reject();
  }
}
