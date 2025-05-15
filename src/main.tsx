import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './components/ThemeProvider';
import { ToastContextProvider } from './components/ToastProvider';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <ToastContextProvider>
        <App />
      </ToastContextProvider>
    </ThemeProvider>
  </StrictMode>
);
