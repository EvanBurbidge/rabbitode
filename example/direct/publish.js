let {RabbitMqInterface} = require('../../dist/rabbitode.min');

const rabbitInterface = new RabbitMqInterface();

let count = 0;

setInterval(() => {
  count++;
  console.log(`publishing`);
  rabbitInterface.sendDirect({
    exchangeName: 'direct_test_exchange',
    routingKey: `direct_test_queue`,
    content: {
      message: `this is a test message for direct stuff ${count}`
    }
  });
  console.log(`published`);
},  10000);

