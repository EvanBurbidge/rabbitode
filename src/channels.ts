export const getNewChannel = async (conn, {
  exchangeName,
  exchangeType,
  configs,
}) => {
  const channel = await conn.createConfirmChannel();
  await channel.assertExchange(exchangeName, exchangeType, { ...configs.exchange });
  return channel;
}