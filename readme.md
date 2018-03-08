# Rabbitmq Node JS Interface
When working on a project I found that I had need of using Rabbit MQ between a number of difference microservices.
In order to get this functionality I introduced RabbitMQ to my project. What started out as a small function became this class and now it's free
for anyone who wishes to use it. 

# Installation
- Installation via npm `npm install rabbitode`
- Feel free to fork this project and use it.

# Api
## Creating a connection

```typescript 
    import { RabbitMqInterface } from 'rabbitode';
    const myConnection = new RabbitMqInterface(
            `myQueue`, 
            `amqp://localhost` 
             queueProcessingFunction(),
    );
``` 

## Sending a message

```typescript
    myConnection.publish({ myTest: 'testing data' });
```

## Serializing a message
Every message is sent in a Buffer data type. This will allow us to turn it into an object
```typescript
  const decoded = myConnection.decode(message.content);
```


## Copyright
Copyright 2018 Evan Burbidge

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.