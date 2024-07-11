import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import {
  createBridge,
  createStore,
  initialize as createDevTools,
  type Config as DevtoolsStoreConfig,
  type DevtoolsProps,
  type Wall,
  type Bridge,
  type Store,
} from 'react-devtools-inline/frontend';
import {
  DEFAULT_PROXY_WSS_PORT,
  ProxyEventType,
  type ProxyEvent,
} from '../shared';

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
   * React DevTools store config.
   */
  devtoolsStoreConfig?: DevtoolsStoreConfig;
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
  onConnect?: (context: { target: Target }) => void;
  onClose?: (context: { target: Target }) => boolean | void;
  onMessage?: (context: { data: string }) => boolean | void;
  onSend?: (context: { data: string }) => boolean | void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- allow
function isProxyEvent(message: any): message is ProxyEvent {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- allow
  return Boolean('__isProxy' in message && message.__isProxy);
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
    devtoolsStoreConfig,
    delegate,
  } = config;

  let root: Root | null = null;
  let bridge: Bridge<
    Record<string, unknown[]>,
    Record<string, unknown[]>
  > | null = null;
  let store: Store | null = null;
  let devToolsEventListener: Wall['listen'] | null = null;

  const socket = new WebSocket(`ws://${host}:${port}`);

  function setup(): void {
    if (root) {
      return;
    }

    bridge = createBridge(window, {
      listen(listener) {
        devToolsEventListener = listener;
        return noop;
      },
      send(event, payload) {
        if (socket.readyState !== WebSocket.OPEN) return;
        const data = JSON.stringify({
          event,
          ...(payload ? { payload } : null),
        });
        const isHandled = delegate?.onSend?.({ data });

        !isHandled && socket.send(data);
      },
    });

    store = createStore(bridge, {
      checkBridgeProtocolCompatibility: true,
      supportsTraceUpdates: true,
      /**
       * @see https://github.com/facebook/react/blob/6587fe19338d22076b9c0fe50185717218b4a8bc/packages/react-devtools-shared/src/devtools/store.js#L75
       */
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment, @typescript-eslint/prefer-ts-expect-error -- wrong type def
      // @ts-ignore
      supportsClickToInspect: true,
      ...devtoolsStoreConfig,
    });

    const DevTools = createDevTools(window, { bridge, store });

    root = createRoot(element);
    root.render(createElement(DevTools, devtoolsProps));
  }

  function cleanup(): void {
    root?.unmount();
    root = null;
    bridge?.shutdown();
    bridge = null;
    store = null;
    devToolsEventListener = null;
  }

  function reload(): void {
    cleanup();
    setup();
  }

  socket.addEventListener('open', () => {
    delegate?.onConnect?.({ target: 'proxy-server' });
    setup();
  });

  socket.addEventListener('message', ({ data: rawData }) => {
    const message = JSON.parse(rawData);

    if (isProxyEvent(message)) {
      switch (message.event) {
        case ProxyEventType.OPEN:
          delegate?.onConnect?.({ target: 'client' });
          break;

        case ProxyEventType.CLOSE: {
          const handled = delegate?.onClose?.({ target: 'client' });
          !handled && reload();
          break;
        }
      }
    } else {
      const isHandled = delegate?.onMessage?.({ data: rawData as string });

      !isHandled && devToolsEventListener?.(JSON.parse(rawData));
    }
  });

  socket.addEventListener('close', () => {
    delegate?.onClose?.({ target: 'proxy-server' });
    cleanup();
  });
};
