import { setupDevTools } from '../src/frontend';

function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

window.onload = () => {
  const targetElement = document.getElementById('container');
  const loadingElement = document.getElementById('loading');

  assert(targetElement, 'unable to get element');
  assert(loadingElement, 'unable to get element');

  const showLoadingView = (show: boolean): void => {
    loadingElement.classList[show ? 'remove' : 'add']('hide');
  };

  setupDevTools({
    element: targetElement,
    delegate: {
      onConnect: ({ target }) => {
        console.log('onConnect', target);

        if (target === 'client') {
          showLoadingView(false);
        }
      },
      onClose: ({ target }) => {
        console.log('onClose', target);

        if (target === 'client') {
          showLoadingView(true);
        }
      },
      onMessage: ({ data }) => {
        console.log('onMessage', JSON.parse(data));
      },
      onSend: ({ data }) => {
        console.log('onSend', JSON.parse(data));
      },
    },
  });
};
