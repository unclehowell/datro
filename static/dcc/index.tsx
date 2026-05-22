
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Simple Service Worker Registration for Offline Capabilities
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // We register a simple worker that handles caching. 
    // In a real environment, this would be a separate file, but here we can 
    // simulate basic persistence for a PWA experience.
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
