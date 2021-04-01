const { setDebug } = require('../../lib/logger');
const { startConsumer } = require('../../lib/consumers');
const { decodeToJson, decodeToString } = require('../../lib/encoding');


setDebug(false);

const handleConsume = channel => msg => {
  console.log(decodeToString(msg));
  console.log(decodeToJson(msg));
  channel.ack(msg);
};

startConsumer({
  queueConfig: {
    exchangeName: 'fanout_test_exchange',
    exchangeType: 'fanout',
    queueName: 'fanout_test_queue',
    consumerCallback: handleConsume,
  },
  connectionUrl: 'amqp://localhost',
});