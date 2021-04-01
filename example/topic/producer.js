const { sendMessage } = require('../../dist/rabbitode.min');

let count = 0;

setInterval(() => {
  sendMessage({
    messageConfig: {
      exchangeName: 'topic_test_exchange',
      routingKey: `test.test`,
      content: {
        message: `this is a test message for topic stuff ${count}`
      }
    },
    exchangeType: 'topic',
    connectionUrl: 'amqp://localhost',
    publishCallback: (done) => {
      console.log('publish callback');
      console.log(done);
    }
  })
  count++;
}, 1000);
