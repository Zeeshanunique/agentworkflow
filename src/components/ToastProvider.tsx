import React, { createContext, useContext, useState } from 'react';
import {
  Toast,
  ToastProvider,
  ToastViewport,
  ToastTitle,
  ToastDescription,
  ToastClose,
} from './ui/toast';

type ToastType = 'default' | 'success' | 'error' | 'warning' | 'info';

interface ToastContextProps {
  toast: (options: {
    title?: string;
    description: string;
    type?: ToastType;
    duration?: number;
  }) => void;
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  return context;
}

interface ToastItem {
  id: string;
  title?: string;
  description: string;
  type: ToastType;
  duration: number;
}

export const ToastContextProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = ({
    title,
    description,
    type = 'default',
    duration = 5000,
  }: {
    title?: string;
    description: string;
    type?: ToastType;
    duration?: number;
  }) => {
    const id = Math.random().toString(36).substring(2, 9);
    
    setToasts((prevToasts) => [
      ...prevToasts,
      { id, title, description, type, duration },
    ]);

    // Auto dismiss
    setTimeout(() => {
      dismissToast(id);
    }, duration);
  };

  const dismissToast = (id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };

  const getVariant = (type: ToastType) => {
    switch (type) {
      case 'error':
        return 'destructive';
      default:
        return 'default';
    }
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      <ToastProvider>
        {children}
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            variant={getVariant(toast.type)}
            className={
              toast.type === 'success'
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                : toast.type === 'error'
                ? 'border-destructive bg-destructive/10'
                : toast.type === 'warning'
                ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                : toast.type === 'info'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : ''
            }
          >
            <div className="flex flex-col gap-1">
              {toast.title && <ToastTitle>{toast.title}</ToastTitle>}
              <ToastDescription>{toast.description}</ToastDescription>
            </div>
            <ToastClose onClick={() => dismissToast(toast.id)} />
          </Toast>
        ))}
        <ToastViewport />
      </ToastProvider>
    </ToastContext.Provider>
  );
};
