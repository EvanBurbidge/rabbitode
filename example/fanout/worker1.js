let { RabbitMqInterface } = require('../../dist/rabbitode.min');

const handleConsume = channel => msg => {
  console.log(rabbitInterface.decodeToString(msg));
  console.log(rabbitInterface.decodeToJson(msg));
  channel.ack(msg);
};
const rabbitInterface = new RabbitMqInterface();

rabbitInterface
  .enableDebugging()
  .startFanoutConsumer({
    exchangeName: 'fanout_test_exchange',
    exchangeType: 'fanout',
    queueName: '',
    consumerCallback: handleConsume,
  });
