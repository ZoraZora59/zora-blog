import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/utils';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  show: (message: string, variant?: ToastVariant) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_DURATION = 3500;

const variantStyles: Record<ToastVariant, { icon: typeof CheckCircle2; accent: string; bar: string }> = {
  success: {
    icon: CheckCircle2,
    accent: 'text-success',
    bar: 'bg-success',
  },
  error: {
    icon: XCircle,
    accent: 'text-error',
    bar: 'bg-error',
  },
  info: {
    icon: Info,
    accent: 'text-primary',
    bar: 'bg-primary',
  },
  warning: {
    icon: AlertTriangle,
    accent: 'text-warning',
    bar: 'bg-warning',
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const show = useCallback(
    (message: string, variant: ToastVariant = 'info') => {
      idRef.current += 1;
      const id = idRef.current;
      setToasts((prev) => [...prev, { id, message, variant }]);
      window.setTimeout(() => dismiss(id), TOAST_DURATION);
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      show,
      success: (message) => show(message, 'success'),
      error: (message) => show(message, 'error'),
      info: (message) => show(message, 'info'),
      warning: (message) => show(message, 'warning'),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-2 md:right-6 md:top-6"
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast) => {
            const style = variantStyles[toast.variant];
            const Icon = style.icon;
            return (
              <motion.div
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="pointer-events-auto overflow-hidden rounded-xl border border-border/60 bg-surface-raised shadow-lg shadow-black/5"
                exit={{ opacity: 0, y: -12, scale: 0.98 }}
                initial={{ opacity: 0, y: -12, scale: 0.98 }}
                key={toast.id}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                <div className="flex items-start gap-3 px-4 py-3">
                  <span className={cn('mt-0.5 shrink-0', style.accent)}>
                    <Icon className="size-5" />
                  </span>
                  <p className="flex-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
                    {toast.message}
                  </p>
                  <button
                    aria-label="关闭提示"
                    className="shrink-0 rounded-full p-1 text-subtle transition-colors hover:bg-surface-sunken hover:text-foreground"
                    onClick={() => dismiss(toast.id)}
                    type="button"
                  >
                    <X className="size-4" />
                  </button>
                </div>
                <div className={cn('h-0.5 w-full', style.bar)} />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}
