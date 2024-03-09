import type { Server } from 'node:http';
import * as ws from 'ws';
import * as SocketIO from 'socket.io';
import { DEFAULT_PROXY_WSS_PORT, RN_WSS_PORT } from '../shared';

interface SetupDevtoolsProxyOptions {
  server: Server;
  host?: string;
  port?: number;
  client?: ClientSocketEvents;
  frontend?: Pick<SetupDevtoolsFrontendOptions, 'onConnect' | 'onDisconnect' | 'onError'>;
}

interface SetupDevtoolsFrontendOptions extends FrontendSocketEvents {
  server: Server;
}

interface ClientSocketEvents {
  onListen?: () => void;
  onConnect?: (ws: ws.WebSocket) => void;
  onClose?: () => void;
  onError?: (error: Error) => void;
}

interface FrontendSocketEvents {
  onConnect?: (webClientSocket: SocketIO.Socket) => void;
  onDisconnect?: () => void;
  onMessage: (data: string) => void;
  onError?: (error: Error) => void;
}

export const setupDevtoolsProxy = (options: SetupDevtoolsProxyOptions): void => {
  const {
    server,
    host = 'localhost',
    port = DEFAULT_PROXY_WSS_PORT,
    client,
    frontend,
  } = options;

  const wss = new ws.WebSocketServer({ port: RN_WSS_PORT, host });

  const frontendWss = setupDevtoolsFrontend({
    server,
    onConnect: frontend?.onConnect,
    onDisconnect: frontend?.onDisconnect,
    onError: frontend?.onError,
    onMessage: (data) => {
      wss.clients.forEach((ws) => {
        if (ws.readyState !== ws.OPEN) return;

        ws.send(data);
      });
    },
  });

  frontendWss.socket.listen(port);

  wss.on('listening', () => {
    client?.onListen?.();
  });

  wss.on('error', (error) => {
    client?.onError?.(error)
  });

  wss.on('connection', (ws) => {
    client?.onConnect?.(ws);

    frontendWss.getConnection()?.emit('setup');

    ws.on('message', (data) => {
      // eslint-disable-next-line @typescript-eslint/no-base-to-string -- ignore
      frontendWss.getConnection()?.emit('message', JSON.parse(data.toString()));
    });

    ws.on('error', (error) => client?.onError?.(error));

    ws.on('close', () => {
      frontendWss.getConnection()?.emit('disconnected');
    });
  });

  wss.on('close', () => {
    client?.onClose?.();
  })
};

const setupDevtoolsFrontend = ({
  server,
  onConnect,
  onDisconnect,
  onMessage,
  onError,
}: SetupDevtoolsFrontendOptions): {
  socket: SocketIO.Server;
  getConnection: () => SocketIO.Socket | null;
} => {
  let connection: SocketIO.Socket | null = null;

  const socket = new SocketIO.Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      allowedHeaders: [],
      credentials: false,
    },
  });
  
  socket.on('error', (error) => onError?.(error as Error));
  
  socket.on('connection', webClient => {
    connection = webClient;

    webClient.on('message', (data) => {
      onMessage(JSON.stringify(data));
    });
  
    webClient.on('disconnect', () => {
      connection = null;

      onDisconnect?.();
    });

    onConnect?.(webClient);
  });

  return {
    socket,
    getConnection: () => connection,
  };
};
