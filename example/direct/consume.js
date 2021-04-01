const { startConsumer } = require('../../lib/consumers');
const { decodeToJson, decodeToString } = require('../../lib/encoding');

const handleConsume = channel => msg => {
  console.log(decodeToString(msg));
  console.log(decodeToJson(msg));
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