import React, { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

type ToastType = 'error' | 'success';

type ToastItem = {
  id: number;
  type: ToastType;
  message: string;
};

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'error') => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { id, type, message }]);
    window.setTimeout(() => removeToast(id), 4000);
  }, [removeToast]);

  const value = useMemo(
    () => ({
      showToast,
      showError: (message: string) => showToast(message, 'error'),
      showSuccess: (message: string) => showToast(message, 'success'),
    }),
    [showToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex w-[min(92vw,380px)] flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`rounded-xl border px-4 py-3 shadow-xl backdrop-blur-sm ${
              toast.type === 'error'
                ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-900/30 dark:text-red-300'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/30 dark:text-emerald-300'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2 text-sm font-semibold">
                <span className="material-symbols-outlined !text-lg">
                  {toast.type === 'error' ? 'error' : 'check_circle'}
                </span>
                <span>{toast.message}</span>
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-current/70 hover:text-current"
                aria-label="Close notification"
              >
                <span className="material-symbols-outlined !text-lg">close</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
