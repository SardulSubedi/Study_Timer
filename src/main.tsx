import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

// Apply theme preference before first paint
const savedTheme = localStorage.getItem('studytimer:theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const useDark = savedTheme ? savedTheme === 'dark' : prefersDark || true;
if (useDark) document.documentElement.classList.add('dark');

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
