import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface MobileTocDrawerProps {
  headings: TocItem[];
  activeHeading: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileTocDrawer({
  headings,
  activeHeading,
  isOpen,
  onClose,
}: MobileTocDrawerProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleHeadingClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      onClose();
    }
  };

  if (headings.length === 0) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            animate={{ opacity: 1 }}
            aria-hidden="true"
            className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm lg:hidden"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            animate={{ x: 0 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[70vh] overflow-y-auto rounded-t-2xl bg-surface-raised shadow-2xl lg:hidden"
            exit={{ x: '100%' }}
            initial={{ x: '100%' }}
            role="dialog"
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-border/60 bg-surface-raised px-5 py-4">
              <p className="text-sm font-medium text-foreground">目录</p>
              <button
                aria-label="关闭目录"
                className="rounded-full p-1.5 text-muted hover:bg-surface-sunken hover:text-foreground"
                onClick={onClose}
                type="button"
              >
                <X className="size-5" />
              </button>
            </div>
            <nav aria-label="文章目录" className="space-y-1 p-4">
              {headings.map((heading) => (
                <button
                  className={cn(
                    'block w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors duration-150',
                    activeHeading === heading.id
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted hover:bg-surface-sunken hover:text-foreground',
                    heading.level === 3 && 'ml-4',
                  )}
                  key={heading.id}
                  onClick={() => handleHeadingClick(heading.id)}
                  type="button"
                >
                  {heading.text}
                </button>
              ))}
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
