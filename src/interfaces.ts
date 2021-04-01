import { Channel } from "amqplib";

interface BaseExchange {
  exchangeName: string;
  exchangeType: string;
}
export interface MqExchangeMessage {
  exchangeName: string;
  routingKey: string;
  content: Buffer | string;
}

export interface MapTopicsToQueueProps {
  channel: Channel;
  queue: any;
  exchangeName: string;
  topics: string[];
}

export interface MqMessageError {
  exchangeType: string
  message: MqExchangeMessage;
  isPublished: boolean;
}

export interface MqTaskMessage {
  queueName: string;
  content: Buffer | string;
}

export interface ConsumerConfig extends BaseExchange {
  queueName: string;
  consumerCallback: (x: any) => (y: any) => void;
}

export interface CreateChannelConfig extends BaseExchange {
  configs: any;
}

export interface StartConsumerProps {
  queueConfig: ConsumerConfig;
  configs: any;
  topics?: any[];
  connectionOptions?: any
  connectionUrl: string;
  prefetchAmount?: number;
}
export interface PublishCallbackInterface {
  exchangeName: string;
  routingKey: string;
  content: string | Buffer;
  exchangeType: string;
}
export interface SendMessageProps {
  messageConfig: MqExchangeMessage;
  exchangeType: string;
  configs: any;
  connectionOptions: any;
  connectionUrl: string;
  publishCallback(t:PublishCallbackInterface): any;
}

export interface HandlePublishErrorProps extends PublishCallbackInterface{
  err: string;
}

export interface SendPublishMessageProps extends MqExchangeMessage{
  channel: any;
  configs: any;
  exchangeType: string;
  publishCallback(t:PublishCallbackInterface): any;
}