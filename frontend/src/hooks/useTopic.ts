import { useEffect, useState } from 'react';
import { ApiError, getTopic, type TopicDetail } from '@/lib/api';

interface TopicState {
  topic: TopicDetail | null;
  isLoading: boolean;
  error: string | null;
}

export function useTopic(slug?: string) {
  const [state, setState] = useState<TopicState>({
    topic: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (!slug) {
      setState({
        topic: null,
        isLoading: false,
        error: '专题链接缺失',
      });
      return;
    }

    let cancelled = false;

    setState({
      topic: null,
      isLoading: true,
      error: null,
    });

    getTopic(slug)
      .then((topic) => {
        if (cancelled) {
          return;
        }

        setState({
          topic,
          isLoading: false,
          error: null,
        });
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }

        const message = error instanceof ApiError ? error.message : '专题加载失败';
        setState({
          topic: null,
          isLoading: false,
          error: message,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return state;
}