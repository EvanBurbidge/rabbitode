const { sendMessage } = require('../../lib/publisher');

console.log(sendMessage);

let count = 0;

setInterval(() => {
  sendMessage({
    messageConfig: {
      exchangeName: 'direct_test_exchange',
      routingKey: `direct_test_queue`,
      content: {
        message: `this is a test message for direct stuff ${count}`
      }
    },
    exchangeType: 'direct',
    connectionUrl: 'amqp://localhost',
  })
  count++;
}, 5000);