import { DEFAULT_HOST, DEFAULT_PROXY_WSS_PORT, RN_WSS_PORT } from '../shared';
import { ProxyWebSocket, type ProxyWebSocketDelegate } from './proxy-websocket';

interface SetupDevToolsProxyConfig {
  client: {
    host?: string;
    port?: number;
    delegate?: ProxyWebSocketDelegate;
  };
  devtools: {
    host?: string;
    port?: number;
    delegate?: ProxyWebSocketDelegate;
  };
}

export const setupDevToolsProxy = (
  config: SetupDevToolsProxyConfig,
): (() => Promise<void>) => {
  const { client, devtools } = config;

  const clientWebSocket = new ProxyWebSocket({
    host: client.host ?? DEFAULT_HOST,
    port: client.port ?? RN_WSS_PORT,
    delegate: client.delegate,
  });

  const devToolsWebSocket = new ProxyWebSocket({
    host: devtools.host ?? DEFAULT_HOST,
    port: devtools.port ?? DEFAULT_PROXY_WSS_PORT,
    delegate: devtools.delegate,
  });

  clientWebSocket.bind(devToolsWebSocket);
  devToolsWebSocket.bind(clientWebSocket);

  return async function cleanup(): Promise<void> {
    await clientWebSocket.close();
    await devToolsWebSocket.close();
  };
};
