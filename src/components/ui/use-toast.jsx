
import React, { createContext, useContext, useState, useEffect } from "react";

const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 5000;

// Global state for programmatic usage outside components
let toasts = [];
let listeners = [];
let toastCount = 0;

function generateId() {
  toastCount = (toastCount + 1) % Number.MAX_VALUE;
  return toastCount.toString();
}

export const toast = (props) => {
  const id = generateId();

  const dismiss = () => {
    toasts = toasts.map((t) => (t.id === id ? { ...t, open: false } : t));
    listeners.forEach((listener) => listener([...toasts]));

    setTimeout(() => {
      toasts = toasts.filter((t) => t.id !== id);
      listeners.forEach((listener) => listener([...toasts]));
    }, 1000); 
  };

  const newToast = {
    ...props,
    id,
    open: true,
    dismiss,
  };

  toasts = [newToast, ...toasts].slice(0, TOAST_LIMIT);
  listeners.forEach((listener) => listener([...toasts]));

  if (props.duration !== Infinity) {
    setTimeout(() => {
      dismiss();
    }, props.duration || TOAST_REMOVE_DELAY);
  }

  return { id, dismiss };
};

const ToastContext = createContext(null);

export const ToastContextProvider = ({ children }) => {
  const [stateToasts, setStateToasts] = useState(toasts);

  useEffect(() => {
    const listener = (newToasts) => {
      setStateToasts(newToasts);
    };
    
    listeners.push(listener);
    
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toasts: stateToasts, toast }}>
      {children}
    </ToastContext.Provider>
  );
};

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastContextProvider");
  }
  return context;
}
