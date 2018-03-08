"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var amqp = require("amqplib/callback_api");
/**
 * @class
 * @name RabbigMqInterface
 * @description
 *  This class provides us a number of methods for dealing with connecting to
 *  amqplib and allows us to publish and send events to rabbit mq and digest
 *  those events
 * */
var RabbitMqInterface = /** @class */ (function () {
    function RabbitMqInterface(queueName, connectionUri, consumerHandler) {
        if (consumerHandler === void 0) { consumerHandler = function (msg) { return console.log(msg.content.toString()); }; }
        this.queueName = queueName;
        this.connectionUri = connectionUri;
        this.consumerHandler = consumerHandler;
        this.offlinePubQueue = [];
        this.exchangeName = "";
        this.queue = this.queueName;
        this.startRabbit();
    }
    /**
     * @method
     * @description
     * this method is called once upon start up
     * and the recursively anytime we have an error
     * */
    RabbitMqInterface.prototype.startRabbit = function () {
        var _this = this;
        amqp.connect(this.connectionUri, function (err, conn) {
            if (err) {
                return _this.handleRabbitClose();
            }
            _this.connection = conn;
            _this.connection.on('error', function (err) { return _this.handleRabbitErrror(err); });
            _this.connection.on('close', function () { return _this.handleRabbitClose(); });
            console.log("[AMQP] connection established", _this.queue);
            _this.startPublisher();
            _this.startConsumer();
        });
    };
    /**
     * @method
     * @name handleRabbitErrror
     * @description
     *  This will handleRabbitErrror
     * */
    RabbitMqInterface.prototype.handleRabbitErrror = function (err) {
        if (err.message !== 'Connection closing') {
            console.error('[AMQP] conn error', err.message);
        }
    };
    /**
     * @method
     * @name handleRabbitClose
     * @description
     *  This will handleRabbitClose
     * */
    RabbitMqInterface.prototype.handleRabbitClose = function () {
        var _this = this;
        console.log("[AMQP] Restarting");
        return setTimeout(function () { return _this.startRabbit(); }, 1000);
    };
    /**
     * @method
     * @description
     *  This will start our publications channel for
     *  rabbit mq
     * */
    RabbitMqInterface.prototype.startPublisher = function () {
        var _this = this;
        this.connection.createConfirmChannel(function (err, ch) {
            if (_this.closeOnError(err))
                return;
            _this.pubChannel = ch;
            _this.pubChannel.on('error', function (err) { return console.log(err); });
            _this.pubChannel.on('close', function () { return console.log("CHANNEL IS CLOSING"); });
            while (true) {
                var m = _this.offlinePubQueue.shift();
                if (!m)
                    break;
                _this.publish(m[2]);
            }
        });
    };
    /**
     * @method
     * @description
     *  This is our main publishing function
     *  it will allow us to publish methods
     * @param {Object} content
     * */
    RabbitMqInterface.prototype.publish = function (content) {
        var _this = this;
        try {
            console.log("[AMQP] sending to exchange: " + this.exchangeName + " queue: " + this.queueName);
            this.pubChannel.publish(this.exchangeName, this.queueName, new Buffer(JSON.stringify(content)), function (err) {
                if (err) {
                    console.log("[AMQP] publish", err);
                    _this.offlinePubQueue.push([_this.exchangeName, _this.queueName, content]);
                    _this.pubChannel.connection.close();
                }
                console.log("[AMQP] published");
            });
        }
        catch (e) {
            console.log("[AMQP] publish", e.message);
            this.offlinePubQueue.push([this.exchangeName, this.queueName, content]);
        }
    };
    /**
     * @method
     * @description
     *  This will decode our buffer into an object, array, whatever it is.
     * */
    RabbitMqInterface.decode = function (message) {
        return JSON.parse(message.content.toString());
    };
    /**
     * @method
     * @description
     *  this will start a consumer that will ack a message if processed
     * */
    RabbitMqInterface.prototype.startConsumer = function () {
        var _this = this;
        this.connection.createChannel(function (err, ch) {
            if (_this.closeOnError(err))
                return;
            _this.pubChannel = ch;
            _this.pubChannel.on('error', function (err) { return console.error('[AMQP] channel error', err.message); });
            _this.pubChannel.on('close', function () { return console.log('[AMQP] channel closed'); });
            _this.pubChannel.prefetch(10);
            _this.pubChannel.assertQueue(_this.queue, { durable: true }, function (err) {
                if (_this.closeOnError(err))
                    return;
                _this.pubChannel.consume(_this.queue, _this.consumerHandler(_this.pubChannel), { noAck: false });
                console.log('[AMQP] Worker is started');
            });
        });
    };
    /**
     * @method
     * @description
     *  if there is a major error we're going to close the main
     *  connection to rabbit
     * */
    RabbitMqInterface.prototype.closeOnError = function (err) {
        if (!err)
            return err;
        console.log("[FATAL AMQP ERROR CLOSING]", err);
        this.connection.close();
        return true;
    };
    return RabbitMqInterface;
}());
exports.RabbitMqInterface = RabbitMqInterface;
//# sourceMappingURL=rabbit.client.js.map