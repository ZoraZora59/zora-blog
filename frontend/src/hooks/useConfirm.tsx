import { AlertTriangle } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export type ConfirmTone = 'default' | 'danger';

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  tone?: ConfirmTone;
}

interface ConfirmState extends ConfirmOptions {
  id: number;
  resolve: (value: boolean) => void;
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfirmState | null>(null);
  const idRef = useRef(0);

  const close = useCallback(
    (value: boolean) => {
      setState((current) => {
        if (current) {
          current.resolve(value);
        }
        return null;
      });
    },
    [],
  );

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        idRef.current += 1;
        setState({
          id: idRef.current,
          resolve,
          ...options,
        });
      }),
    [],
  );

  useEffect(() => {
    if (!state) {
      return;
    }
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [state, close]);

  const value = useMemo<ConfirmContextValue>(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <AnimatePresence>
        {state ? (
          <motion.div
            animate={{ opacity: 1 }}
            aria-labelledby={`confirm-title-${state.id}`}
            aria-modal="true"
            className="fixed inset-0 z-[120] flex items-center justify-center px-4"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            role="dialog"
            transition={{ duration: 0.15 }}
          >
            <button
              aria-label="关闭对话框"
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => close(false)}
              type="button"
            />
            <motion.div
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl bg-surface-raised shadow-2xl"
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              <div className="space-y-4 p-6">
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      'flex size-10 shrink-0 items-center justify-center rounded-full',
                      state.tone === 'danger'
                        ? 'bg-error/10 text-error'
                        : 'bg-primary/10 text-primary',
                    )}
                  >
                    <AlertTriangle className="size-5" />
                  </span>
                  <div className="min-w-0 space-y-1.5">
                    <h2
                      className="font-heading text-lg font-bold text-foreground"
                      id={`confirm-title-${state.id}`}
                    >
                      {state.title}
                    </h2>
                    {state.description ? (
                      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-muted">
                        {state.description}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button onClick={() => close(false)} size="sm" variant="secondary">
                    {state.cancelText ?? '取消'}
                  </Button>
                  <Button
                    autoFocus
                    onClick={() => close(true)}
                    size="sm"
                    variant={state.tone === 'danger' ? 'danger' : 'primary'}
                  >
                    {state.confirmText ?? '确定'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return ctx.confirm;
}
