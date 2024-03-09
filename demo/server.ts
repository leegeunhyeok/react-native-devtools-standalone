import * as http from 'node:http';
import express from 'express';
import { setupDevtoolsProxy } from '../src/backend';

const app = express();

app.use(express.static(__dirname));

const server = http.createServer(app);

setupDevtoolsProxy({
  server,
  client: {
    onConnect: () => { console.log('onConnect'); },
    onClose: () => { console.log('onClose'); },
    onListen: () => { console.log('onListen'); },
    onError: (error) => { console.error('onError', error); },
  },
  frontend: {
    onConnect: () => { console.log('onConnect::frontend'); },
    onDisconnect: () => { console.log('onDisconnect::frontend'); },
    onError: (error) => { console.error('onError::frontend', error); },
  }
});

server.listen(3000, () => { console.log('http://localhost:3000/index.html'); });
