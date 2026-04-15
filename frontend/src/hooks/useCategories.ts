import { useEffect, useState } from 'react';
import { ApiError, getCategories, type Category } from '@/lib/api';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    setIsLoading(true);
    setError(null);

    getCategories()
      .then((items) => {
        if (cancelled) {
          return;
        }

        setCategories(items);
        setIsLoading(false);
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }

        setError(error instanceof ApiError ? error.message : '分类加载失败');
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    categories,
    isLoading,
    error,
  };
}
