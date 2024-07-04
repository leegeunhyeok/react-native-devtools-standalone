import * as ws from 'ws';
import { type ProxyEvent, ProxyEventType } from '../shared';

interface ProxyWebSocketOptions {
  host: string;
  port: number;
  delegate?: ProxyWebSocketDelegate;
}

export interface ProxyWebSocketDelegate {
  onConnect?: (socket: ws.WebSocket) => void;
  onClose?: () => void;
  onMessage?: (data: string) => void;
  onError?: (error: Error) => void;
}

export class ProxyWebSocket {
  private wss: ws.WebSocketServer;
  private proxyWss?: ProxyWebSocket;
  private delegate?: ProxyWebSocketDelegate;

  constructor({ host, port, delegate }: ProxyWebSocketOptions) {
    const wss = new ws.WebSocketServer({ host, port });

    wss.on('error', (error) => delegate?.onError?.(error));
    wss.on('close', () => delegate?.onClose?.());
    wss.on('connection', (ws) => {
      this.onConnect(ws);
      ws.on('close', this.onDisconnect.bind(this));
      ws.on('message', this.onMessage.bind(this));
      ws.on('error', (error) => delegate?.onError?.(error));
    });

    this.wss = wss;
    this.delegate = delegate;
  }

  private createProxyEvent(
    type: ProxyEventType,
    payload?: ProxyEvent['payload'],
  ): ProxyEvent {
    return { type, ...(payload ? { payload } : null) };
  }

  protected onConnect(socket: ws.WebSocket): void {
    const event = this.createProxyEvent(ProxyEventType.OPEN);
    this.proxyWss?.sendProxyEvent(event);
    this.delegate?.onConnect?.(socket);
  }

  protected onDisconnect(): void {
    const event = this.createProxyEvent(ProxyEventType.DISCONNECTED);
    this.proxyWss?.sendProxyEvent(event);
    this.delegate?.onClose?.();
  }

  protected onMessage(data: ws.RawData): void {
    const stringifiedData =
      data instanceof ArrayBuffer
        ? Buffer.from(data).toString()
        : data.toString();
    const event = this.createProxyEvent(
      ProxyEventType.MESSAGE,
      stringifiedData,
    );

    this.proxyWss?.sendProxyEvent(event);
    this.delegate?.onMessage?.(stringifiedData);
  }

  public sendProxyEvent(event: ProxyEvent): void {
    this.wss.clients.forEach((client) => {
      client.send(JSON.stringify(event));
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
    if (this.proxyWss) {
      throw new Error('already another proxy websocket server bound');
    }

    this.proxyWss = proxyWebSocket;
  }

  public unbind(): void {
    this.proxyWss = undefined;
  }
}
