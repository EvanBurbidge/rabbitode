![Screenshot](rabbitode-logo.png)


Rabbitode is a probject created to provide a simple interface in order to work with the AMQP interface to rabbitmq.
RabbitMQ  is an events broker that allows us to send a recieve events between producers and consumers via an event queue.

# Installation
- Installation via npm `npm install rabbitode`
## Requirements
In order for this project to run you must have a working instance of rabbitmq on your machine or server.
I reccomend docker for local development.
```docker run -p 5672:5672 -d --rm --name rabbit rabbitmq:3```

# Api
## Creating a connection
```typescript
    import { RabbitMqInterface } from 'rabbitode';
    const myConnection = new RabbitMqInterface();
    
    myConnection.setRabbitUri('http://myconnection')
    
    const handleConsume = channel => msg => {
      console.log(myConnection.decodeToString(msg))
      channel.ack(msg);
    };
    
     myConnection.sendDirect({
        exchangeName: 'direct_test_exchange',
        routingKey: `direct_test_queue`,
        content: {
          message: `this is a direct test message`
        }
      });
       
      myConnection.startDirectConsumer({
          exchangeName: 'direct_test_exchange',
          exchangeType: 'direct',
          queueName: 'direct_test_queue',
          consumerCallback: handleConsume,
      });
```

## API
#### Send Direct
```typescript
rabbitInterface.sendDirect({
    exchangeName: 'direct_test_exchange',
    routingKey: `direct_test_queue`,
    content: {
      message: `this is a test message for direct stuff ${variable}`
    }
  });

```
#### Send Fanout
```typescript
rabbitInterface.sendFanout({
    exchangeName: 'fanout_test_exchange',
    routingKey: ``, // leave this blank with a fanour
    content: `this is a test message for fanouts: ${count}` 
    // will return undefined with decodeToJSON as its a string
});
```
#### Send Topic
```typescript
rabbitInterface.sendTopic({
    exchangeName: 'topic_test_exchange',
    routingKey: `test.test`,
    content: `this is a test message for topics: ${count}`
  });
```
#### Consumer Direct
```typescript
rabbitInterface
  .startDirectConsumer({
    exchangeName: 'direct_test_exchange',
    exchangeType: 'direct',
    queueName: 'direct_test_queue',
    consumerCallback: handleConsume,
});
```

#### Consumer Fanout
```typescript
rabbitInterface
  .startFanoutConsumer({
    exchangeName: 'fanout_test_exchange',
    exchangeType: 'fanout',
    queueName: '',
    consumerCallback: handleConsume,
  });

```
#### Consumer topic
```typescript
// the topics this consumer will listen for given in the routing key
const myTopics = ['test.*', '*.test'];
rabbitInterface
    .enableDebugging()
    .startTopicConsumer({
        exchangeName: 'topic_test_exchange',
        exchangeType: 'topic',
        consumerCallback: handleConsume,
    }, myTopics);
```
#### Consumer Handler
```typescript
//MUST CONTAIN CALLBACKS
const handleConsume = channel => msg => {
  console.log(rabbitInterface.decodeToString(msg));
  console.log(rabbitInterface.decodeToJson(msg));
  //console.log(msg.fields.routingKey); topics only really
  channel.ack(msg);
};

```
#### Set custom uri
```typescript

myConnection.setRabbitUri('http://mylocation');

```
#### Enable debugging
```typescript

myConnection.enableDebugging();

```

#### Disable debugging
```typescript

myConnection.disableDebugging();

```

#### Decode to JSON
##### will check if message content is JSON or Return undefined
```typescript

myConnection.decodeToJson(message);

```
#### Decode to String
```typescript

myConnection.decodeToString(message);

```


## Copyright
Copyright 2018 Evan Burbidge

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
