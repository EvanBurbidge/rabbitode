const { RabbitMqInterface } = require('rabbitode');
const express = require('express');
const app = express();
function consumerCB (channel) {
    console.log('we have the channel');
    return function (msg) {
        console.log('*************************');
        console.log(msg.content.toString());
        channel.ack(msg);
        console.log('*************************');
    }
}
const rabbitInstance = new RabbitMqInterface({
    queueName:`test.bloop`,
    connectionUri: `amqp://localhost`,
    exchangeName: `testing_exchange`,
    exchangeType: `direct`,
    consumerHandler: consumerCB,
});
rabbitInstance.startConsumers();
app.listen(4001, () => console.log("listening on 4001"));