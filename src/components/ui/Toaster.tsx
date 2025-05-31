import { useEffect, useState } from 'react';
import { logger } from '../../utils/logger';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

interface ToasterProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

const toasts: Toast[] = [];
let listeners: ((toasts: Toast[]) => void)[] = [];

export const toast = {
  success(message: string, duration = 3000) {
    addToast({ type: 'success', message, duration });
  },
  error(message: string, duration = 5000) {
    addToast({ type: 'error', message, duration });
    logger.error(message);
  },
  info(message: string, duration = 3000) {
    addToast({ type: 'info', message, duration });
  },
  warning(message: string, duration = 4000) {
    addToast({ type: 'warning', message, duration });
    logger.warn(message);
  }
};

function addToast({ type, message, duration }: Omit<Toast, 'id'>) {
  const id = Math.random().toString(36).substr(2, 9);
  const newToast: Toast = { id, type, message, duration };
  toasts.push(newToast);
  listeners.forEach(listener => listener([...toasts]));

  if (duration) {
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }
}

function removeToast(id: string) {
  const index = toasts.findIndex(t => t.id === id);
  if (index > -1) {
    toasts.splice(index, 1);
    listeners.forEach(listener => listener([...toasts]));
  }
}

export function Toaster({ position = 'bottom-right' }: ToasterProps) {
  const [currentToasts, setCurrentToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (updatedToasts: Toast[]) => {
      setCurrentToasts(updatedToasts);
    };
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }, []);

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  };

  const typeClasses = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-yellow-500'
  };

  return (
    <div
      className={`fixed z-50 flex flex-col gap-2 ${positionClasses[position]}`}
      role="alert"
      aria-live="polite"
    >
      {currentToasts.map(toast => (
        <div
          key={toast.id}
          className={`${typeClasses[toast.type]} text-white px-4 py-2 rounded shadow-lg flex items-center justify-between min-w-[300px] max-w-md transform transition-all duration-300 ease-in-out`}
        >
          <p className="flex-1">{toast.message}</p>
          <button
            onClick={() => removeToast(toast.id)}
            className="ml-4 text-white hover:text-gray-200 focus:outline-none"
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

export default Toaster; 