import { useEffect, useState } from 'react';
import { ApiError, getArticle, type ArticleDetail } from '@/lib/api';

interface ArticleState {
  article: ArticleDetail | null;
  isLoading: boolean;
  error: string | null;
}

export function useArticle(slug?: string) {
  const [state, setState] = useState<ArticleState>({
    article: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (!slug) {
      setState({
        article: null,
        isLoading: false,
        error: '文章链接缺失',
      });
      return;
    }

    let cancelled = false;

    setState({
      article: null,
      isLoading: true,
      error: null,
    });

    getArticle(slug)
      .then((article) => {
        if (cancelled) {
          return;
        }

        setState({
          article,
          isLoading: false,
          error: null,
        });
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }

        const message = error instanceof ApiError ? error.message : '文章加载失败';
        setState({
          article: null,
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
