import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import {
  createBridge,
  createStore,
  initialize as createDevTools,
  type DevtoolsProps,
} from 'react-devtools-inline/frontend';
import { io } from 'socket.io-client';
import { DEFAULT_PROXY_WSS_PORT } from '../shared';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- payload
type Data = any;

interface ConnectToProxyServer {
  element: HTMLElement;
  host?: string;
  port?: number;
  devtoolsProps?: DevtoolsProps;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onSetup?: () => void;
  onMessage?: (data: Data) => void;
  onSend?: (data: {
    event: string;
    payload: Data;
  }) => void;
}

const noop = (): void => undefined;

export const connectToProxyServer = (options: ConnectToProxyServer): void => {
  const {
    element,
    host = 'localhost',
    port = DEFAULT_PROXY_WSS_PORT,
    devtoolsProps = {
      showTabBar: true,
      hideViewSourceAction: true,
    },
    onConnect,
    onDisconnect,
    onSetup,
    onMessage,
    onSend,
  } = options;

  let root: Root | null = null;
  let innerHTML: string;

  const socket = io(`http://${host}:${port}`);
  
  socket.on('connect', () => { onConnect?.(); });

  socket.on('setup', () => {
    if (root) {
      return;
    }

    const bridge = createBridge(window, {
      listen(listener) {
        socket.on('message', (data) => {
          listener(data);

          onMessage?.(data);
        });

        return noop;
      },
      send(event, payload) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- allow
        const data = { event, payload };
        socket.emit('message', data);

        onSend?.(data);
      },
    });

    const store = createStore(bridge, {
      supportsNativeInspection: true,
    });

    const DevTools = createDevTools(window, { bridge, store });

    innerHTML = element.innerHTML;

    root = createRoot(element);
    root.render(createElement(DevTools, devtoolsProps));

    onSetup?.();
  });

  socket.on('disconnect', () => {
    root?.unmount();
    root = null;

    element.innerHTML = innerHTML;

    onDisconnect?.();
  });
}
