let {RabbitMqInterface} = require('../../dist/rabbitode.min');

let rabbitInterface = new RabbitMqInterface();

const myTopics = ['test.*', '*.test'];
rabbitInterface.startTopicConsumer({
  exchangeName: 'topic_test_exchange',
  consumerCallback: channel => msg => {
    console.log(myConnection.decodeToJson(msg));
    channel.ack(msg);
  },
}, myTopics);