import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/inter';
import '../styles/design-tokens.css';
import '../styles/base.css';
import '../styles/layout.css';
import '../styles/components.css';
import '../styles/pages.css';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
