const { startConsumer } = require('../../lib/consumers');
const { decodeToJson, decodeToString } = require('../../lib/encoding');

const handleConsume = channel => msg => {
  console.log(decodeToString(msg));
  console.log(decodeToJson(msg));
  console.log(msg.fields.routingKey);
  channel.ack(msg);
};

startConsumer({
  queueConfig: {
    exchangeName: 'topic_test_exchange',
    exchangeType: 'topic',
    queueName: 'topic_test_queue',
    consumerCallback: handleConsume,
  },
  connectionUrl: 'amqp://localhost',
  topics: ['test.*', '*.test'],
});

