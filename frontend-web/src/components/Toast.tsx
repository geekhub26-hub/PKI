import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { X, Check, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

const ToastContext = createContext<{ addToast: (t: Omit<ToastItem, 'id'>) => void }>({ addToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((t: Omit<ToastItem, 'id'>) => {
    const id = Math.random().toString(36).slice(2, 9);
    const toast: ToastItem = { id, ...t };
    setToasts((s) => [toast, ...s]);
    const dur = t.duration ?? 5000;
    setTimeout(() => setToasts((s) => s.filter(x => x.id !== id)), dur);
  }, []);

  useEffect(() => {
    const handler = (evt: Event) => {
      const detail = (evt as CustomEvent).detail as Omit<ToastItem, 'id'> | undefined;
      if (!detail?.message || !detail?.type) return;
      addToast(detail);
    };
    window.addEventListener('app-toast', handler as EventListener);
    return () => window.removeEventListener('app-toast', handler as EventListener);
  }, [addToast]);

  const removeToast = (id: string) => {
    setToasts((s) => s.filter(x => x.id !== id));
  };

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <Check className="w-5 h-5 flex-shrink-0" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 flex-shrink-0" />;
      case 'info':
        return <Info className="w-5 h-5 flex-shrink-0" />;
    }
  };

  const getStyles = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50 border-green-200',
          text: 'text-green-800',
          icon: 'text-green-600',
          progressBar: 'bg-green-500'
        };
      case 'error':
        return {
          bg: 'bg-red-50 border-red-200',
          text: 'text-red-800',
          icon: 'text-red-600',
          progressBar: 'bg-red-500'
        };
      case 'info':
        return {
          bg: 'bg-blue-50 border-blue-200',
          text: 'text-blue-800',
          icon: 'text-blue-600',
          progressBar: 'bg-blue-500'
        };
    }
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm pointer-events-none">
        {toasts.map(t => {
          const styles = getStyles(t.type);
          return (
            <div
              key={t.id}
              className={`
                flex items-start gap-3 p-4 rounded-lg border shadow-lg
                ${styles.bg} ${styles.text}
                backdrop-blur-sm animate-in slide-in-from-right-full duration-300
                pointer-events-auto
              `}
            >
              <div className={styles.icon}>
                {getIcon(t.type)}
              </div>
              <div className="flex-1 pt-0.5">
                <p className="text-sm font-semibold">{t.message}</p>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className={`
                  flex-shrink-0 p-1 rounded hover:bg-white/20 transition-colors
                  ${styles.text}
                `}
              >
                <X className="w-4 h-4" />
              </button>
              {/* Progress bar */}
              <div className="absolute bottom-0 left-0 h-1 rounded-bl-lg w-full bg-white/10">
                <div
                  className={`h-full rounded-bl-lg ${styles.progressBar}`}
                  style={{
                    animation: `shrink ${t.duration ?? 5000}ms linear`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </ToastContext.Provider>
  );
}
