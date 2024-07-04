import * as http from 'node:http';
import express from 'express';
import { setupDevToolsProxy } from '../src/backend';

const app = express();

app.use(express.static(__dirname));

const server = http.createServer(app);

setupDevToolsProxy({
  client: {
    delegate: {
      onConnect: () => {
        console.log('onConnect::client');
      },
      onClose: () => {
        console.log('onClose::client');
      },
      onError: (error) => {
        console.error('onError::client', error);
      },
      onMessage: (data) => {
        console.log('onMessage::client', data);
      },
    },
  },
  devtools: {
    delegate: {
      onConnect: () => {
        console.log('onConnect::devtools');
      },
      onClose: () => {
        console.log('onClose::devtools');
      },
      onError: (error) => {
        console.error('onError::devtools', error);
      },
      onMessage: (data) => {
        console.log('onMessage::devtools', data);
      },
    },
  },
});

server.listen(3000, () => {
  console.log('http://localhost:3000/index.html');
});
