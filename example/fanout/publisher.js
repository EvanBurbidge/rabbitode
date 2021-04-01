let { sendMessage } = require('../../dist/rabbitode.min');

let count = 0;

setInterval(() => {
    sendMessage({
        messageConfig: {
            exchangeName: 'fanout_test_exchange',
            routingKey: `fanout_test_queue`,
            content: {
                message: `this is a test message for direct stuff ${count}`
            }
        },
        exchangeType: 'fanout',
        connectionUrl: 'amqp://localhost',
        publishCallback: (done) => {
            console.log('publish callback');
        }
    })
    count++;
}, 1000);
