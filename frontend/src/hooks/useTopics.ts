import { useEffect, useState } from 'react';
import { ApiError, listTopics, type TopicSummary } from '@/lib/api';

export function useTopics() {
  const [topics, setTopics] = useState<TopicSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    setIsLoading(true);
    setError(null);

    listTopics()
      .then((items) => {
        if (cancelled) {
          return;
        }

        setTopics(items);
        setIsLoading(false);
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }

        setError(error instanceof ApiError ? error.message : '专题加载失败');
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    topics,
    isLoading,
    error,
  };
}