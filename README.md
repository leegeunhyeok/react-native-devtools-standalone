# react-native-devtools-standalone

Standalone [react-devtools](https://github.com/facebook/react/tree/main/packages/react-devtools) APIs for React Native.

## Installation

```bash
npm install react-native-devtools-standalone
# or
yarn add react-native-devtools-standalone
```

## Usage

### Backend

```ts
import * as http from 'node:http';
import { setupDevtoolsProxy } from 'react-native-devtools-standalone/backend';

const server = http.createServer();

setupDevtoolsProxy({ server });

server.listen(...);
```

### Frontend

```ts
import { connectToProxyServer } from 'react-native-devtools-standalone/frontend';

connectToProxyServer({ element: document.getElementById('container') });
```

## Development

```bash
# start dev server (http://localhost:3000/index.html)
yarn start
```

## License

[MIT](./LICENSE)
