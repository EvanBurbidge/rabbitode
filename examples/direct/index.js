const {RabbitMqInterface} = require('rabbitode');
const express = require('express');
const app = express();

function consumerCB(channel) {
    console.log('we have the channel');
    return function (msg) {
        console.log('*************************');
        console.log(msg.content.toString());
        channel.ack(msg);
        console.log('*************************');
    }
}

const rabbitInstance = new RabbitMqInterface({
    queueName: `test.bloop`,
    connectionUri: `amqp://localhost`,
    exchangeName: `testing_exchange`,
    exchangeType: `direct`,
    consumerHandler: consumerCB,
});
rabbitInstance.startConsumers();
rabbitInstance.startPublishers();
let count = 0;
setInterval(() => {
    count = count + 1;
    rabbitInstance.publish({
        exchangeName: `testing_exchange`,
        routingKey: `test.bloop`,
        content: {
            message: `this is a direct test message ${count}`,
        }
    });
}, 3000);


app.listen(4000, () => console.log('listening on 4000'));