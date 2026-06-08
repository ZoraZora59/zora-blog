import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface MarkdownImageProps {
  alt?: string;
  src?: string;
}

export default function MarkdownImage({ alt, src }: MarkdownImageProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!src) {
    return null;
  }

  // 灯箱通过 portal 挂到 body，避免成为 markdown <p> 的子节点（<div> 不能嵌套在 <p> 里）。
  const lightbox =
    typeof document === 'undefined'
      ? null
      : createPortal(
          <AnimatePresence>
            {open ? (
              <motion.div
                animate={{ opacity: 1 }}
                aria-modal="true"
                className="fixed inset-0 z-[120] flex items-center justify-center p-4 md:p-8"
                exit={{ opacity: 0 }}
                initial={{ opacity: 0 }}
                role="dialog"
                transition={{ duration: 0.15 }}
              >
                <button
                  aria-label="关闭图片预览"
                  className="absolute inset-0 cursor-zoom-out bg-black/80 backdrop-blur-sm"
                  onClick={() => setOpen(false)}
                  type="button"
                />
                <button
                  aria-label="关闭图片预览"
                  className="absolute right-4 top-4 z-10 flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                  onClick={() => setOpen(false)}
                  type="button"
                >
                  <X className="size-5" />
                </button>
                <motion.img
                  alt={alt || ''}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative max-h-full max-w-full cursor-zoom-out rounded-lg object-contain shadow-2xl"
                  exit={{ opacity: 0, scale: 0.97 }}
                  initial={{ opacity: 0, scale: 0.97 }}
                  onClick={() => setOpen(false)}
                  referrerPolicy="no-referrer"
                  src={src}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>,
          document.body,
        );

  return (
    <>
      <button
        aria-label={alt ? `放大图片：${alt}` : '放大图片'}
        className="group mx-auto block cursor-zoom-in"
        onClick={() => setOpen(true)}
        type="button"
      >
        <img
          alt={alt || ''}
          className="mx-auto max-h-[26rem] w-auto max-w-full rounded-xl object-contain shadow-sm transition-opacity duration-200 group-hover:opacity-90"
          decoding="async"
          loading="lazy"
          referrerPolicy="no-referrer"
          src={src}
        />
      </button>
      {lightbox}
    </>
  );
}
