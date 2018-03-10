"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
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
    function RabbitMqInterface(queueName, connectionUri, exchangeName, exchangeType) {
        if (exchangeType === void 0) { exchangeType = 'direct'; }
        this.queueName = queueName;
        this.connectionUri = connectionUri;
        this.exchangeName = exchangeName;
        this.exchangeType = exchangeType;
        this.offlinePubQueue = [];
        this.setup();
    }
    RabbitMqInterface.prototype.setup = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.startRabbit()];
                    case 1:
                        _a.sent();
                        this.startPublisher();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * @method
     * @description
     * this method is called once upon start up
     * and the recursively anytime we have an error
     * */
    RabbitMqInterface.prototype.startRabbit = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            amqp.connect(_this.connectionUri, function (err, conn) {
                if (err) {
                    reject();
                    return _this.handleRabbitClose();
                }
                _this.connection = conn;
                _this.connection.on('error', function (err) { return _this.handleRabbitErrror(err); });
                _this.connection.on('close', function () { return _this.handleRabbitClose(); });
                resolve();
            });
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
        this.connection
            .createChannel(function (err, ch) {
            if (_this.closeOnError(err))
                return;
            _this.pubChannel = ch;
            _this.pubChannel.on('error', function (err) { return console.log(err); });
            _this.pubChannel.on('close', function () { return console.log("CHANNEL IS CLOSING"); });
            if (_this.exchangeName.length > 0) {
                _this.exchange =
                    _this.pubChannel
                        .assertExchange(_this.exchangeName, _this.exchangeType, { durable: false });
            }
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
    RabbitMqInterface.prototype.startConsumer = function (consumerHandler) {
        var _this = this;
        if (consumerHandler === void 0) { consumerHandler = function (msg) { return console.log(msg.content.toString()); }; }
        this.connection.createChannel(function (err, ch) {
            if (_this.closeOnError(err))
                return;
            _this.pubChannel = ch;
            _this.pubChannel.on('error', function (err) { return console.error('[AMQP] channel error', err.message); });
            _this.pubChannel.on('close', function () { return console.log('[AMQP] channel closed'); });
            _this.pubChannel.prefetch(10);
            _this.pubChannel.assertQueue(_this.queueName, { exclusive: true }, function (err) {
                if (_this.closeOnError(err))
                    return;
                _this.pubChannel.consume(_this.queueName, consumerHandler(_this.pubChannel), { noAck: false });
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