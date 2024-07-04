import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import {
  createBridge,
  createStore,
  initialize as createDevTools,
  type DevtoolsProps,
  type Wall,
} from 'react-devtools-inline/frontend';
import {
  DEFAULT_PROXY_WSS_PORT,
  ProxyEventType,
  type ProxyEvent,
} from '../shared';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- payload
type Data = any;
type Target = 'client' | 'proxy-server';

interface DevToolsConfigs {
  /**
   * Element to render DevTools.
   */
  element: HTMLElement;
  /**
   * Proxy web socket server host.
   *
   * Defaults to `'localhost'`
   */
  host?: string;
  /**
   * Proxy web socket server port.
   *
   * Defaults to `8098`
   */
  port?: number;
  /**
   * React DevTools props.
   *
   * Defaults to `{ showTabBar: true, hideViewSourceAction: true }`
   */
  devtoolsProps?: DevtoolsProps;
  /**
   * WebSocket delegate.
   */
  delegate?: ProxyWebSocketDelegate;
}

interface ProxyWebSocketDelegate {
  onConnect?: (target: Target) => void;
  onClose?: (target: Target) => void;
  onMessage?: (data: Data) => void;
  onSend?: (data: { event: string; payload: Data }) => void;
}

const noop = (): void => undefined;

export const setupDevTools = (config: DevToolsConfigs): void => {
  const {
    element,
    host = 'localhost',
    port = DEFAULT_PROXY_WSS_PORT,
    devtoolsProps = {
      showTabBar: true,
      hideViewSourceAction: true,
    },
    delegate,
  } = config;

  let root: Root | null = null;
  let devToolsEventListener: Wall['listen'] | null = null;

  const socket = new WebSocket(`ws://${host}:${port}`);
  const wall: Wall = {
    listen(listener) {
      devToolsEventListener = listener;
      return noop;
    },
    send(event, payload) {
      if (socket.readyState !== WebSocket.OPEN) return;

      const data = { event, payload };
      socket.send(JSON.stringify(data));
      delegate?.onSend?.(data);
    },
  };

  function setup(): void {
    if (root) {
      return;
    }

    const bridge = createBridge(window, wall);
    const store = createStore(bridge, {
      supportsNativeInspection: true,
    });
    const DevTools = createDevTools(window, { bridge, store });

    root = createRoot(element);
    root.render(createElement(DevTools, devtoolsProps));
  }

  function cleanup(): void {
    root?.unmount();
    root = null;
    devToolsEventListener = null;
  }

  socket.addEventListener('open', () => {
    setup();
    delegate?.onConnect?.('proxy-server');
  });

  socket.addEventListener('message', ({ data: rawData }) => {
    const event = JSON.parse(rawData) as ProxyEvent;

    switch (event.type) {
      case ProxyEventType.OPEN:
        delegate?.onConnect?.('client');
        break;

      case ProxyEventType.DISCONNECTED:
        delegate?.onClose?.('client');
        break;

      case ProxyEventType.MESSAGE: {
        const parsedData = JSON.parse(event.payload);
        devToolsEventListener?.(parsedData);
        break;
      }
    }

    delegate?.onMessage?.(rawData);
  });

  socket.addEventListener('close', () => {
    cleanup();
    delegate?.onClose?.('proxy-server');
  });
};
