import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import AppButton from '../components/app/AppButton';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-success shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-danger shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-warning shrink-0" />,
    info: <Info className="w-5 h-5 text-info shrink-0" />,
  };

  const borders = {
    success: 'border-success/30 bg-surface text-ink shadow-lg',
    error: 'border-danger/30 bg-surface text-ink shadow-lg',
    warning: 'border-warning/30 bg-surface text-ink shadow-lg',
    info: 'border-info/30 bg-surface text-ink shadow-lg',
  };

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-[12px] border transition-all animate-in slide-in-from-bottom-2 ${
              borders[toast.type] || borders.info
            }`}
          >
            {icons[toast.type] || icons.info}
            <div className="flex-1 text-sm font-medium leading-5">
              {toast.message}
            </div>
            <AppButton
              variant="ghost"
              size="sm"
              onClick={() => removeToast(toast.id)}
              className="text-muted hover:text-ink rounded-lg p-0.5 transition-colors"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </AppButton>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
