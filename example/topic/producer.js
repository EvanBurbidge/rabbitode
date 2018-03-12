let {RabbitMqInterface} = require('../../dist/rabbitode.min');

let rabbitInterface = new RabbitMqInterface();
rabbitInterface.enableDebugging();

let count = 0;

setInterval(() => {
  count++;
  console.log(`publishing`);
  rabbitInterface.send({
    exchangeName: 'topic_test_exchange',
    routingKey: `test.test`,
    content: `this is a test message for topics: ${count}`
  }, 'topic');
  console.log(`published`);
},  10000);
