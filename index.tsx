import React from 'react';
import ReactDOM from 'react-dom/client';
import './globals.css';
import App from './App';
import { validateEnv } from './lib/env';
import { initSentry } from './lib/sentry';

// Validate environment variables at startup (fail-fast in production)
validateEnv();

// Initialize Sentry error monitoring (no-ops if DSN not configured)
initSentry();

// Graceful recovery from chunk loading failures after deployments
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  window.location.reload();
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
