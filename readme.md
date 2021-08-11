![Screenshot](rabbitode-logo.png)


Rabbitode is a probject created to provide a simple interface in order to work with the AMQP interface to rabbitmq.
RabbitMQ  is an events broker that allows us to send a recieve events between producers and consumers via an event queue.

# Installation
- Installation via npm `npm install rabbitode -S`
- Installation via yarn `yarn add rabbitode`

## Requirements
In order for this project to run you must have a working instance of rabbitmq on your machine or server.
I reccomend docker for local development.
```docker run -p 5672:5672 -d --rm --name rabbit rabbitmq:3```

# Api
### Sending Messages

**Direct**

```javascript
// const { exchangeTypes, sendMessage, getDefaultQueueConfig } = require('rabbitode') <--- could also be this then use exchangeTypes.DIRECT
const { DIRECT } = require('rabbitode/lib/exchangeTypes');
const { sendMessage } = require('rabbitode/lib/sendMessage');
const { getDefaultQueueConfig } = require('rabbitode/lib/utils');

await sendMessage({
  messageConfig: {
      exchangeName: 'direct_test_exchange',
      routingKey: `direct_test_queue`,
      content: {
        message: `this is a test message for direct connection`
      }
  },
  exchangeType: DIRECT, // direct, fanout, exchange are all available types
  connectionUrl: 'amqp://localhost',
  configs: getDefaultQueueConfig(),
  connectionOptions: {},
  publishCallback: () => {
    // something here
  }
});
```

**Fanout**
 
```javascript
// const { exchangeTypes, sendMessage, getDefaultQueueConfig } = require('rabbitode') <--- could also be this then use exchangeTypes.FANOUT
const { FANOUT } = require('rabbitode/lib/exchangeTypes');
const { sendMessage } = require('rabbitode/lib/sendMessage');
const { getDefaultQueueConfig } = require('rabbitode/lib/utils');

await sendMessage({
  messageConfig: {
      exchangeName: 'fanout_test_exchange',
      routingKey: `fanout_test_queue`,
      content: {
          message: `this is a test message for direct stuff ${count}`
      }
  },
  exchangeType: FANOUT,
  connectionUrl: 'amqp://localhost',
  configs: getDefaultQueueConfig(), // replace this with queue configs from amqplib
  connectionOptions: {},
  publishCallback: () => {}
});
```
**Topic**
 
```javascript
// const { exchangeTypes, sendMessage, getDefaultQueueConfig } = require('rabbitode') <--- could also be this then use exchangeTypes.TOPIC
const { TOPIC } = require('rabbitode/lib/exchangeTypes');
const { sendMessage } = require('rabbitode/lib/sendMessage');
const { getDefaultQueueConfig } = require('rabbitode/lib/utils');
await sendMessage({
  messageConfig: {
      exchangeName: 'topic_test_exchange',
      routingKey: `topic.key`,
      content: {
          message: `this is a test message for direct stuff ${count}`
      }
  },
  exchangeType: TOPIC,
  connectionUrl: 'amqp://localhost',
  configs: {
    ...getDefaultQueueConfig(),
    somethingElse: true,
  }, // replace this with queue configs from amqplib
  connectionOptions: {},
  publishCallback: () => {
    // something here
  }
});
```
### Consuming messages

**Direct**

```javascript
const { closeRabbit } = require('rabbitode/lib/connection');
const { startConsumer } = require('rabbitode/lib/consumers');
const { decodeToJson, decodeToString } = require('rabbitode/lib/encoding');

const handleConsume = channel => msg => {
  console.log(decodeToString(msg));
  console.log(decodeToJson(msg));
  channel.ack(msg);
};

const { conn, channel } = startConsumer({
  queueConfig: {
    exchangeName: 'direct_test_exchange',
    exchangeType: 'direct',
    queueName: 'direct_test_queue',
    consumerCallback: handleConsume,
  },
  connectionUrl: 'amqp://localhost',
});
await closeRabbit(conn, channel);
```

**Fanout**
```javascript
const { closeRabbit } = require('rabbitode/lib/connection');
const { startConsumer } = require('rabbitode/lib/consumers');
const { decodeToJson, decodeToString } = require('rabbitode/lib/encoding');

const handleConsume = channel => msg => {
  console.log(decodeToString(msg));
  console.log(decodeToJson(msg));
  channel.ack(msg);
};

const { conn, channel } = startConsumer({
  queueConfig: {
    exchangeName: 'fanout_test_exchange',
    exchangeType: 'fanout',
    queueName: 'fanout_test_queue',
    consumerCallback: handleConsume,
  },
  connectionUrl: 'amqp://localhost',
});

await closeRabbit(conn, channel);

```

**Topic**
```javascript
const { closeRabbit } = require('rabbitode/lib/connection');
const { startConsumer } = require('rabbitode/lib/consumers');
const { decodeToJson, decodeToString } = require('rabbitode/lib/encoding');

const handleConsume = channel => msg => {
  console.log(decodeToString(msg));
  console.log(decodeToJson(msg));
  console.log(msg.fields.routingKey);
  channel.ack(msg);
};

const { conn, channel } = startConsumer({
  queueConfig: {
    exchangeName: 'topic_test_exchange',
    exchangeType: 'topic',
    queueName: 'topic_test_queue',
    consumerCallback: handleConsume,
  },
  connectionUrl: 'amqp://localhost',
  topics: ['test.*', '*.test'],
});
await closeRabbit(conn, channel);
```
### Turning off logging
```javascript
const Logger = require('rabbitode/lib/logger');
logger.setDebug(false);
```
### Getting JSON from a message
```javascript
const { startConsumer } = require('rabbitode/lib/consumers');
const { decodeToJson } = require('rabbitode/lib/encoding');

const handleConsume = channel => msg => {
  console.log(decodeToJson(msg));
  channel.ack(msg);
};
```
### Getting a string from a message
```javascript
const { startConsumer } = require('rabbitode/lib/consumers');
const { decodeToString } = require('rabbitode/lib/encoding');

const handleConsume = channel => msg => {
  console.log(decodeToString(msg));
  channel.ack(msg);
};
```
### Getting default configs
```javascript
const {
  getDefaultQueueConfig,
  getDefaultConsumerConfig,
} = require('rabbitode/lib/utils');

const baseconfig = getDefaultQueueConfig();
const consumerConfig = getDefaultConsumerConfig();
```
### Getting failed "offline" messages
```javascript
const { getOfflineQueue } = require('rabbitode/lib/offline');
const queue = getOfflineQueue();

// once your connection is backup you can loop the queue and send again

queue.forEach(config => {
  sendMessage({
    messageConfig: config.message,
    exchangeType: config.exchangeType, // direct, fanout, exchange are all available types
    connectionUrl: 'amqp://localhost',
    configs: {},
    connectionOptions: {},
    publishCallback: () => {},
  });
});
```


# Changes
### v-2.0.0
 - Most methods return this to enable method chaining 
 - send method no longer available, use sendDirect, sendTopic, sendFanout instead
### v-2.0.1
  - Security Vulnerability fixes in package.json
  
### v-2.1.0
  - Security Vulnerability fixes in package.json
  - Update build process for smaller files

### v-3.0.0
  - Total refactor to functional components
  - Reduced methods single method for send / consume
  - Able to be imported as individual files or as a main rabbitode file
  - Total removal of original Rabbitode class
  - Added tests to ensure methods call as required
  - More indepth types and logging

### V2 Docs
[Read here](https://github.com/EvanBurbidge/rabbitode/blob/master/readme-old.md)
## Copyright
Copyright 2021 Evan Burbidge

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
