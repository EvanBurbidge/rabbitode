let {RabbitMqInterface} = require('../../dist/rabbitode.min');

let rabbitInterface = new RabbitMqInterface();
rabbitInterface.enableDebugging();

let count = 0;

setInterval(() => {
  count++;
  console.log(`publishing`);
  rabbitInterface.sendTopic({
    exchangeName: 'topic_test_exchange',
    routingKey: `test.test`,
    content: {
      message: `this is a test message for topics: ${count}`,
    },
  });
  console.log(`published`);
},  1000);
