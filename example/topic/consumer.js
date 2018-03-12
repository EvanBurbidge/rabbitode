let {RabbitMqInterface} = require('../../dist/rabbitode.min');

let rabbitInterface = new RabbitMqInterface();

const myTopics = ['test.*', '*.test'];
rabbitInterface.startTopicConsumer({
  exchangeName: 'topic_test_exchange',
  consumerCallback: handleConsume,
}, myTopics);

function handleConsume (channel) {
  return function (msg) {
    console.log('*************************  WORKER 1  ***********************************');
    console.log(msg.content.toString());
    channel.ack(msg)
    console.log('************************************************************');
  }
}
