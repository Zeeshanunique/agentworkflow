import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider, ToastContextProvider } from './shared/contexts';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <ToastContextProvider>
        <App />
      </ToastContextProvider>
    </ThemeProvider>
  </StrictMode>
);
