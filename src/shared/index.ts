// https://github.com/facebook/react-native/blob/v0.73.5/packages/react-native/Libraries/Core/setUpReactDevTools.js#L50-L53
export const RN_WSS_PORT = 8097;
export const DEFAULT_PROXY_WSS_PORT = 8098;
export const DEFAULT_HOST = 'localhost';

export enum ProxyEventType {
  OPEN = 'proxy:open',
  DISCONNECTED = 'proxy:disconnected',
  MESSAGE = 'proxy:message',
}

export interface ProxyEvent {
  type: ProxyEventType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- allow
  payload?: any;
}
