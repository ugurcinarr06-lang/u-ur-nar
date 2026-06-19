import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { StandaloneMobile } from './views/mobile/StandaloneMobile';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// URL params: ?m=1&p=PEER_ID → telefon modu
const params = new URLSearchParams(window.location.search);
const isMobileMode = params.get('m') === '1';
const peerIdParam = params.get('p') ?? '';

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    {isMobileMode && peerIdParam ? (
      <StandaloneMobile peerId={peerIdParam} />
    ) : (
      <App />
    )}
  </React.StrictMode>
);
