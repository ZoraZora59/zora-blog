import { useEffect, useState, type RefObject } from 'react';

export function useReadingProgress(targetRef: RefObject<HTMLElement | null>) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const element = targetRef.current;
      if (!element) {
        setProgress(0);
        return;
      }

      const rect = element.getBoundingClientRect();
      const scrollTop = window.scrollY;
      const elementTop = scrollTop + rect.top;
      const height = element.scrollHeight;
      const viewport = window.innerHeight;
      const total = Math.max(height - viewport, 1);
      const current = Math.min(Math.max(scrollTop - elementTop, 0), total);

      setProgress(Math.min((current / total) * 100, 100));
    };

    updateProgress();
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);

    return () => {
      window.removeEventListener('scroll', updateProgress);
      window.removeEventListener('resize', updateProgress);
    };
  }, [targetRef]);

  return progress;
}
