const { startConsumer } = require('../../lib/consumers');

const handleConsume = channel => msg => {
  console.log(rabbitInterface.decodeToString(msg));
  console.log(rabbitInterface.decodeToJson(msg));
  channel.ack(msg);
};

startConsumer({
  queueConfig: {
    exchangeName: 'direct_test_exchange',
    exchangeType: 'direct',
    queueName: 'direct_test_queue',
    consumerCallback: handleConsume,
  },
  connectionUrl: 'amqp://localhost',
});