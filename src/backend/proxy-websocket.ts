import * as ws from 'ws';
import { type ProxyEvent, ProxyEventType } from '../shared';

interface ProxyWebSocketOptions {
  host: string;
  port: number;
  delegate?: ProxyWebSocketDelegate;
}

export interface ProxyWebSocketDelegate {
  onConnect?: (
    context: ProxyWebSocketDelegateContext<{ socket: ws.WebSocket }>,
  ) => boolean | void;
  onClose?: (context: ProxyWebSocketDelegateContext) => boolean | void;
  onMessage?: (
    context: ProxyWebSocketDelegateContext<{ data: string }>,
  ) => boolean | void;
  onError?: (error: Error) => void;
}

type ProxyWebSocketDelegateContext<T = object> = T & {
  proxyWebSocket: ProxyWebSocket | undefined;
};

export class ProxyWebSocket {
  private wss: ws.WebSocketServer;
  private proxyWebSocket?: ProxyWebSocket;
  private delegate?: ProxyWebSocketDelegate;

  constructor({ host, port, delegate }: ProxyWebSocketOptions) {
    const wss = new ws.WebSocketServer({ host, port });

    wss.on('error', (error) => delegate?.onError?.(error));
    wss.on('connection', (ws) => {
      this.onConnect(ws);
      ws.on('close', this.onClose.bind(this));
      ws.on('message', this.onMessage.bind(this));
      ws.on('error', (error) => delegate?.onError?.(error));
    });

    this.wss = wss;
    this.delegate = delegate;
  }

  private createProxyEvent(event: ProxyEventType): ProxyEvent {
    return { event, __isProxy: true };
  }

  protected onConnect(socket: ws.WebSocket): void {
    const event = this.createProxyEvent(ProxyEventType.OPEN);
    const isHandled = this.delegate?.onConnect?.({
      socket,
      proxyWebSocket: this.proxyWebSocket,
    });

    !isHandled && this.proxyWebSocket?.send(JSON.stringify(event));
  }

  protected onClose(): void {
    const event = this.createProxyEvent(ProxyEventType.CLOSE);
    const isHandled = this.delegate?.onClose?.({
      proxyWebSocket: this.proxyWebSocket,
    });

    !isHandled && this.proxyWebSocket?.send(JSON.stringify(event));
  }

  protected onMessage(data: ws.RawData): void {
    const stringifiedData =
      data instanceof ArrayBuffer
        ? Buffer.from(data).toString()
        : data.toString();

    const isHandled = this.delegate?.onMessage?.({
      data: stringifiedData,
      proxyWebSocket: this.proxyWebSocket,
    });

    !isHandled && this.proxyWebSocket?.send(stringifiedData);
  }

  public send(data: string): void {
    this.wss.clients.forEach((client) => {
      client.send(data);
    });
  }

  public close(): Promise<void> {
    this.unbind();

    return new Promise((resolve, reject) => {
      this.wss.close((error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  public bind(proxyWebSocket: ProxyWebSocket): void {
    if (this.proxyWebSocket) {
      throw new Error('already another proxy websocket server bound');
    }

    this.proxyWebSocket = proxyWebSocket;
  }

  public unbind(): void {
    this.proxyWebSocket = undefined;
  }
}
