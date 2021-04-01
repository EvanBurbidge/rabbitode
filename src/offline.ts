import { MqMessageError } from "./interfaces";

export const offlineQueue: MqMessageError[] = [];

export function addToOfflineQueue(message: MqMessageError) {
  offlineQueue.push(message);
};

export function getOfflineQueue() {
  return offlineQueue;
};
