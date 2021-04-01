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
### Sending Messages

**Direct**
 
```javascript
const { conn, channel } = await sendMessage({
  messageConfig: {
      exchangeName: 'direct_test_exchange',
      routingKey: `direct_test_queue`,
      content: {
        message: `this is a test message for direct connection`
      }
  },
  exchangeType: 'direct', // direct, fanout, exchange are all available types
  connectionUrl: 'amqp://localhost',
  configs: {},
  connectionOptions: {},
  publishCallback: () => {
    // something here
  }
});

```
### Consuming messages

### Turning off logging

### Closing connections

### Getting JSON from a message

### Getting a string from a message

### Encoding your message to a buffer

### Getting default configs

### Getting failed "offline" messages




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
## Copyright
Copyright 2021 Evan Burbidge

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
