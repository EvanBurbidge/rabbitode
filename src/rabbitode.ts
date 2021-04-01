import { setDebug } from './logger';
import { sendMessage } from './publisher';
import { startConsumer } from './consumers';
import { getNewChannel } from './channels';
import { handlePublishError } from './errorHandling';
import { startRabbit, closeRabbit } from './connection';
import {
  getDefaultQueueConfig,
  getDefaultConsumerConfig, 
} from './utils';
import {
  addToOfflineQueue,
  getOfflineQueue,
} from './offline'
import { decodeToJson, decodeToString, bufferIfy } from './encoding'

export default {
  sendMessage,
  startConsumer,
  startRabbit,
  closeRabbit,
  decodeToJson,
  decodeToString,
  bufferIfy,
  getNewChannel,
  handlePublishError,
  setDebug,
  getDefaultConsumerConfig,
  getDefaultQueueConfig,
  addToOfflineQueue,
  getOfflineQueue,
};
