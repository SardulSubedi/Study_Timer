import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { applyThemeToDocument, readPersistedTheme } from '@/lib/theme';
import './styles/index.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

// Apply theme from Zustand persist (with legacy key fallback) before first paint
applyThemeToDocument(readPersistedTheme());

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
