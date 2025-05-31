// Adapted from shadcn/ui toast component
// https://ui.shadcn.com/docs/components/toast

import { ToastActionElement, ToastProps } from "./toast";

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const;

let count = 0;

function generateId() {
  count = (count + 1) % Number.MAX_VALUE;
  return count.toString();
}

type ActionType = typeof actionTypes;

// Action types and state definitions have been removed as they're not used
// in this simplified implementation

// This is a simplified version that doesn't rely on the full context implementation
// Integrate with your ToastProvider component at src/components/ToastProvider.tsx
export function useToast() {
  return {
    toast: ({ title, description, ...props }: Omit<ToasterToast, "id">) => {
      // Find toast element
      const toastElements = document.querySelectorAll('[role="status"]');
      
      // If we find elements, assume the toast is already shown by your ToastProvider
      if (toastElements.length > 0) {
        // This is a simplified version - ideally would integrate with your actual toast provider
        // For now, just log to console if toast couldn't be displayed
        console.log("Toast:", { title, description, ...props });
      }
      
      // Return a placeholder ID (your real implementation would return the actual toast ID)
      return { id: generateId() };
    },
    dismiss: (toastId?: string) => {
      // Find dismiss buttons and click the one that matches
      const dismissButtons = document.querySelectorAll('[data-dismiss-toast]');
      if (dismissButtons.length > 0) {
        // If no ID provided, dismiss first toast
        if (!toastId && dismissButtons[0]) {
          (dismissButtons[0] as HTMLButtonElement).click();
        } else {
          // Find button with matching ID
          dismissButtons.forEach((button) => {
            if (button.getAttribute('data-toast-id') === toastId) {
              (button as HTMLButtonElement).click();
            }
          });
        }
      }
    },
  };
}
