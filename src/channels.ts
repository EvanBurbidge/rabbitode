import { Channel, Connection } from "amqplib";
import { CreateChannelConfig } from "./interfaces";

export const getNewChannel = async (
  conn: Connection,
  {
    exchangeName,
    exchangeType,
    configs,
  }: CreateChannelConfig ): Promise<Channel> => {
  const channel: Channel = await conn.createConfirmChannel();
  await channel.assertExchange(exchangeName, exchangeType, { ...configs.exchange });
  return channel;
}