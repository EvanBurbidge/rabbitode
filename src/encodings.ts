import { rabbitLogger } from './utils';

export const bufferIfy = (content: any): Buffer => {
  let updatableContent = content;
  if (
    typeof updatableContent !== 'string' &&
    typeof updatableContent === 'object'
  ) {
    updatableContent = JSON.stringify(content);
  }
  return Buffer.from(updatableContent);
}

export const isJsonString = (str: string ):boolean  => {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}

export const decodeToString = (message): string => message.content.toString();
export const decodeToJson = (message:any): string | void => {
  const str = message.content.toString();
  if (isJsonString(str)) {
    return JSON.parse(str);
  }
  rabbitLogger('message is not valid json', 'error');
}