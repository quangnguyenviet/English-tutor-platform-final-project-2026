import { useState, useCallback, createContext, useContext } from "react";
import { Toast } from "./Toast";

const ToastContext = createContext(null);

let idCounter = 0;
const generateId = () => ++idCounter;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, options = {}) => {
    const id = generateId();
    const { type = "info", duration = 5000 } = options;
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
    return id;
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = {
    showToast,
    dismissToast,
    success: (message, opts) => showToast(message, { ...opts, type: "success" }),
    error: (message, opts) => showToast(message, { ...opts, type: "error" }),
    warning: (message, opts) => showToast(message, { ...opts, type: "warning" }),
    info: (message, opts) => showToast(message, { ...opts, type: "info" }),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto w-[380px]">
            <Toast
              id={toast.id}
              message={toast.message}
              type={toast.type}
              duration={toast.duration}
              onDismiss={dismissToast}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
