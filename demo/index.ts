import { connectToServer } from '../src/frontend';

window.onload = () => {
  const targetElement = document.getElementById('container');

  if (!targetElement) {
    console.error('unable to get element');
    return;
  }

  connectToServer({
    element: targetElement,
    onConnect: () => { console.log('onConnect'); },
    onDisconnect: () => { console.log('onDisconnect'); },
    onSetup: () => { console.log('onSetup'); },
    onMessage: (data) => { console.log('onMessage', data); },
    onSend: (data) => { console.log('onSend', data); },
  });
}

