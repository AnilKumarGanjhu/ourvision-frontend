import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import "./Toast.css";

const ToastContext = createContext(null);

const MAX_TOASTS = 4;
const EXIT_MS = 300;
const DEFAULT_DURATION = { success: 3500, info: 3500, warning: 4500, error: 5000 };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  // id -> timer handle (auto-dismiss timer, then exit-animation timer)
  const timers = useRef(new Map());

  const dismissToast = useCallback((id) => {
    const pending = timers.current.get(id);
    if (pending) clearTimeout(pending);

    setToasts((prev) =>
      prev.map((t) => (t.id === id && !t.exiting ? { ...t, exiting: true } : t)),
    );

    const removeTimer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      timers.current.delete(id);
    }, EXIT_MS);
    timers.current.set(id, removeTimer);
  }, []);

  const showToast = useCallback(
    (message, type = "success", duration) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const ms = duration ?? DEFAULT_DURATION[type] ?? 3500;

      setToasts((prev) => [
        ...prev.slice(-(MAX_TOASTS - 1)),
        { id, message: String(message ?? ""), type, exiting: false },
      ]);
      timers.current.set(id, setTimeout(() => dismissToast(id), ms));
      return id;
    },
    [dismissToast],
  );

  // Clear every pending timer when the provider unmounts.
  useEffect(() => {
    const map = timers.current;
    return () => {
      map.forEach((handle) => clearTimeout(handle));
      map.clear();
    };
  }, []);

  const value = useMemo(() => ({ showToast, dismissToast }), [showToast, dismissToast]);

  const container = (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role={toast.type === "error" ? "alert" : "status"}
          className={`toast ${toast.type} ${toast.exiting ? "exit" : ""}`}
        >
          <span className="toast-msg">{toast.message}</span>
          <button
            type="button"
            className="toast-close"
            aria-label="Dismiss notification"
            onClick={() => dismissToast(toast.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {typeof document !== "undefined" ? createPortal(container, document.body) : container}
    </ToastContext.Provider>
  );
}

// Use anywhere inside <ToastProvider>. Never throws, so a missing provider only logs.
export function useToast() {
  const context = useContext(ToastContext);
  if (context) return context;
  return {
    showToast: (message, type) => console.warn(`[toast:${type}] ${message}`),
    dismissToast: () => {},
  };
}
