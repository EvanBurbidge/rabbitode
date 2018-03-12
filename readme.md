# Rabbitode
Rabbitode is a probject created to provide a simple interface in order to work with the AMQP interface to rabbitmq.
RabbitMQ  is an events broker that allows us to send a recieve events between producers and consumers via an event queue.

# Installation
- Installation via npm `npm install rabbitode`
## Requirements
In order for this project to run you must have a working instance of rabbitmq on your machine. 
I reccomend docker.
```docker run -p 5672:5672 -d --rm --name rabbit rabbitmq:3```

# Api
## Creating a connection

```typescript 
    import { RabbitMqInterface } from 'rabbitode';
    const myConnection = new RabbitMqInterface();
    // if you want to set a uri different to the main uri
    myConnection.setUri('http://myconnection')
    
    // this will send a direct message to our queue
     myConnection.send({
        exchangeName: 'direct_test_exchange',
        routingKey: `direct_test_queue`, // for fanouts leave this blank
        content: {
          message: `this is a direct test message`
        }
      }, 'direct');
       // this will keep a live connection that will wait for messages
      myConnection.startDirectConsumer({
          exchangeName: 'direct_test_exchange',
          exchangeType: 'direct',
          queueName: 'direct_test_queue', // for fanouts leave this blank
          consumerCallback: handleConsume,
      });
      // your consumer function MUST return a closure in order to provide access to the channel
      // which will allow us to ack or nack the message
      function handleConsume (channel) {
          return function (msg) {
              console.log('************************************************************');
              console.log(msg.content.toString());
              channel.ack(msg);
              console.log('************************************************************');
          }
      }
``` 

## API
#### Send Direct
```typescript
// direct message
myConnection.send({
    exchangeName: 'direct_test_exchange',
    routingKey: `direct_test_queue`, // for fanouts leave this blank
    content: {
      message: `this is a direct test message`
    }
}, 'direct',
 {
    exchange: {
        durable: false
    },
    channel: {
        persistent: true
    }
});
```
#### Send Fanout
```typescript
// direct message
myConnection.send({
    exchangeName: 'fanout_test_exchange',
    routingKey: ``, // for fanouts leave this blank
    content: {
      message: `this is a fanout test message which should be received by multiple consumers`
    }
}, 'fanout', {
 exchange: {
     durable: false
 },
 channel: {
     persistent: true
 }
});
```
#### Send Topic
```typescript
myConnection.send({
    exchangeName: 'fanout_test_exchange',
    routingKey: `test.*`, // for fanouts leave this blank
    content: {
      message: `this is a fanout test message which should be received by multiple consumers`
    }
}, 'topic', {
 exchange: {
     durable: false
 },
 channel: {
     persistent: true
 }
});
```
#### Consumer Direct
```typescript
myConnection.startDirectConsumer({
    exchangeName: 'direct_test_exchange',
    queueName: 'direct_test_queue',
    consumerCallback: channel => msg => {
      console.log(myConnection.decodeToJson(msg));
      channel.ack(msg);
    },
}, {
    exchange: {
        durable: false
    },
    queue: {
        exclusive: false
    },
    consumer: {
        noAck: false
    }
});
```

#### Consumer Fanout
```typescript
myConnection.startFanoutConsumer({
    exchangeName: 'fanout_test_exchange',
    queueName: '',
    consumerCallback: channel => msg => {
      // set multiple woekers to test
      console.log('******************** WORKER {ID} ************************') 
      console.log(myConnection.decodeToJson(msg));
      channel.ack(msg);
    },
}, {
     exchange: {
         durable: false
     },
     queue: {
         exclusive: false
     },
     consumer: {
         noAck: false
     }
 });
```
#### Consumer topic
```typescript
const myTopics = ['test.*', '*.test'];
myConnection.startTopicConsumer({
    exchangeName: 'topic_test_exchange',
    queueName: '',
    consumerCallback: channel => msg => {
      // set multiple woekers to test
      console.log('******************** WORKER {ID} ************************') 
      console.log(myConnection.decodeToJson(msg));
      channel.ack(msg);
    },
}, {
   exchange: {
       durable: false
   },
   queue: {
       exclusive: false
   },
   consumer: {
       noAck: false
   }
},
 myTopics);
```

#### Set custom uri
```typescript

myConnection.setUri('http://mylocation');

```


## Copyright
Copyright 2018 Evan Burbidge

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.