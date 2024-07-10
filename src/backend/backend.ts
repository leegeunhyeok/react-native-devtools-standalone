import { DEFAULT_HOST, DEFAULT_PROXY_WSS_PORT, RN_WSS_PORT } from '../shared';
import { ProxyWebSocket, type ProxyWebSocketDelegate } from './proxy-websocket';

interface DevToolsProxyConfig {
  /**
   * Configurations for client(React Native).
   */
  client?: {
    /**
     * Dev server host.
     */
    host?: string;
    /**
     * `__REACT_DEVTOOLS_PORT__` value in React Native runtime.
     *
     * @see https://github.com/facebook/react-native/blob/v0.73.5/packages/react-native/Libraries/Core/setUpReactDevTools.js#L50-L53
     *
     * Defaults to `8097`
     */
    port?: number;
    /**
     * WebSocket delegate
     */
    delegate?: ProxyWebSocketDelegate;
  };
  /**
   * Configurations for React DevTools.
   */
  devtools?: {
    /**
     * Dev server host.
     *
     * Defaults to `'localhost'`
     */
    host?: string;
    /**
     * Port for DevTools to connect.
     *
     * Defaults to `8098`
     */
    port?: number;
    /**
     * WebSocket delegate
     */
    delegate?: ProxyWebSocketDelegate;
  };
}

export const setupDevToolsProxy = (
  config: DevToolsProxyConfig,
): (() => Promise<void>) => {
  const { client = {}, devtools = {} } = config;

  const clientWebSocket = new ProxyWebSocket({
    host: client.host,
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
