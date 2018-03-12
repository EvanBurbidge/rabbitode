let {RabbitMqInterface} = require('../../dist/rabbitode');


const rabbitInterface = new RabbitMqInterface();

rabbitInterface.startFanoutConsumer({
    exchangeName: 'fanout_test_exchange',
    exchangeType: 'fanout',
    queueName: '',
    consumerCallback: handleConsume,
});

function handleConsume (channel) {
    return function (msg) {
        console.log('*************************  WORKER 1  ***********************************');
        console.log(msg.content.toString());
        channel.ack(msg)
        console.log('************************************************************');
    }
}
