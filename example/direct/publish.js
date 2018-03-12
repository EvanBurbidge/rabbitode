let {RabbitMqInterface} = require('../../dist/rabbitode');
let express  = require('express');
let app = express();
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
app.listen(4000, () => console.log('listening on 4000'));
