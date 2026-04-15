import { useEffect, useState } from 'react';
import type { TocHeading } from '@/lib/markdown';

export function useActiveHeading(headings: TocHeading[]) {
  const [activeId, setActiveId] = useState(headings[0]?.id ?? '');

  useEffect(() => {
    if (headings.length === 0) {
      setActiveId('');
      return;
    }

    const updateActiveHeading = () => {
      const currentPosition = window.scrollY + 180;
      let currentId = headings[0]?.id ?? '';

      headings.forEach((heading) => {
        const element = document.getElementById(heading.id);
        if (element && element.offsetTop <= currentPosition) {
          currentId = heading.id;
        }
      });

      setActiveId(currentId);
    };

    updateActiveHeading();
    window.addEventListener('scroll', updateActiveHeading, { passive: true });

    return () => {
      window.removeEventListener('scroll', updateActiveHeading);
    };
  }, [headings]);

  return activeId;
}
