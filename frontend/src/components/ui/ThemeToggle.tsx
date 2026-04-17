import { Monitor, Moon, Sun } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import Button from '@/components/ui/Button';
import { useTheme, type ThemeMode } from '@/hooks/useTheme';

const options: Array<{
  mode: ThemeMode;
  label: string;
  icon: typeof Sun;
}> = [
  { mode: 'light', label: '浅色', icon: Sun },
  { mode: 'dark', label: '深色', icon: Moon },
  { mode: 'system', label: '跟随系统', icon: Monitor },
];

export default function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const CurrentIcon = resolvedTheme === 'dark' ? Moon : Sun;

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <Button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="切换主题"
        onClick={() => setOpen((current) => !current)}
        title={`当前主题：${theme === 'system' ? '跟随系统' : theme === 'dark' ? '深色' : '浅色'}`}
        variant="icon"
      >
        <AnimatePresence mode="wait">
          <motion.span
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            className="inline-flex"
            exit={{ opacity: 0, rotate: -30, scale: 0.8 }}
            initial={{ opacity: 0, rotate: 30, scale: 0.8 }}
            key={resolvedTheme}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <CurrentIcon className="size-5" />
          </motion.span>
        </AnimatePresence>
      </Button>

      <AnimatePresence>
        {open ? (
          <motion.div
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="absolute right-0 top-12 z-50 w-40 rounded-xl border border-border bg-surface-raised p-2 shadow-lg"
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            role="menu"
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <div className="space-y-1">
              {options.map(({ mode, label, icon: Icon }) => (
                <button
                  aria-checked={theme === mode}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors duration-150 ${
                    theme === mode
                      ? 'bg-surface-sunken text-foreground'
                      : 'text-muted hover:bg-surface-sunken hover:text-foreground'
                  }`}
                  key={mode}
                  onClick={() => {
                    setTheme(mode);
                    setOpen(false);
                  }}
                  role="menuitemradio"
                  type="button"
                >
                  <span className="inline-flex items-center gap-2">
                    <Icon className="size-4" />
                    {label}
                  </span>
                  {theme === mode ? <span className="text-xs text-primary">当前</span> : null}
                </button>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
