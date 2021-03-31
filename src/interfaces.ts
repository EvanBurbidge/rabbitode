
export interface MqExchangeMessage {
  exchangeName: string;
  routingKey: string;
  content: Buffer | string;
}

export interface MqTaskMessage {
  queueName: string;
  content: Buffer | string;
}

export interface ConsumerConfig {
  exchangeName: string;
  exchangeType: string;
  queueName: string;
  consumerCallback: (x: any) => (y: any) => void;
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