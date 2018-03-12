let {RabbitMqInterface} = require('../../dist/rabbitode.min');

let rabbitInterface = new RabbitMqInterface();


let count = 0;

setInterval(() => {
    count++;
    console.log(`publishing`);
    rabbitInterface.send({
        exchangeName: 'fanout_test_exchange',
        routingKey: ``,
        content: `this is a test message for fanouts: ${count}`
    }, 'fanout');
    console.log(`published`);
},  10000);
