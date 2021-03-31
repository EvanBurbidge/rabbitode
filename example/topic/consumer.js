let {RabbitMqInterface} = require('../../dist/rabbitode.min');

let rabbitInterface = new RabbitMqInterface();

const handleConsume = channel => msg => {
  console.log(rabbitInterface.decodeToString(msg));
  console.log(rabbitInterface.decodeToJson(msg));
  console.log(msg.fields.routingKey);
  channel.ack(msg);
};
const myTopics = ['test.*', '*.test'];

rabbitInterface
    .enableDebugging()
    .startTopicConsumer({
      consumerConfig: {
        exchangeName: 'topic_test_exchange',
        exchangeType: 'topic',
        consumerCallback: handleConsume,
      },
      topics: myTopics,        
    });

