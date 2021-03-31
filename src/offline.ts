export const offlineQueue = [];

export function addToOfflineQueue(message) {
  offlineQueue.push(message);
};

export function getOfflineQueue() {
  return offlineQueue;
};
