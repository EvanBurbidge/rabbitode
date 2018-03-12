let {RabbitMqInterface} = require('../../dist/rabbitode.min');

let rabbitInterface = new RabbitMqInterface();

const myTopics = ['test.*', '*.test'];
rabbitInterface
    .enableDebugging()
    .startTopicConsumer({
        exchangeName: 'topic_test_exchange',
        exchangeType: 'topic',
        consumerCallback: handleConsume,
    }, myTopics , {
        exchange: {
            durable: false,
        },
        queue: {
            exclusive: true,
        },
        consumer: {
            noAck: false,
        }});

function handleConsume(channel) {
    return function (msg) {
        console.log('*************************  TOPIC 1  ***********************************');
        console.log(msg.content.toString());
        console.log(msg.fields.routingKey);
        console.log('************************************************************');
    }
}
