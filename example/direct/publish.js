let {RabbitMqInterface} = require('../../dist/rabbitode');

const rabbitInterface = new RabbitMqInterface();

let count = 0;

setInterval(() => {
  count++;
  console.log(`publishing`);
  rabbitInterface.send({
    exchangeName: 'direct_test_exchange',
    routingKey: `direct_test_queue`,
    content: `this is a test message for direct stuff ${count}`
  }, 'direct');
  console.log(`published`);
},  10000);

