import { useEffect, useMemo, useState } from 'react';
import { ApiError, listArticles, type ArticleListParams, type ArticleSummary, type Pagination } from '@/lib/api';

interface UseArticlesOptions extends Pick<ArticleListParams, 'category' | 'tag' | 'sort' | 'order'> {
  limit?: number;
}

interface ArticlesState {
  articles: ArticleSummary[];
  pagination: Pagination | null;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
}

export function useArticles(options: UseArticlesOptions = {}) {
  const { category, tag, sort, order, limit = 7 } = options;
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [state, setState] = useState<ArticlesState>({
    articles: [],
    pagination: null,
    isLoading: true,
    isLoadingMore: false,
    error: null,
  });

  useEffect(() => {
    setPage(1);
  }, [category, tag, sort, order, limit]);

  useEffect(() => {
    let cancelled = false;

    setState((current) => ({
      ...current,
      isLoading: page === 1,
      isLoadingMore: page > 1,
      error: null,
    }));

    listArticles({
      category,
      tag,
      page,
      limit,
      sort,
      order,
    })
      .then((result) => {
        if (cancelled) {
          return;
        }

        setState((current) => ({
          articles: page === 1 ? result.items : [...current.articles, ...result.items],
          pagination: result.pagination,
          isLoading: false,
          isLoadingMore: false,
          error: null,
        }));
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }

        const message = error instanceof ApiError ? error.message : '文章列表加载失败';
        setState((current) => ({
          ...current,
          isLoading: false,
          isLoadingMore: false,
          error: message,
        }));
      });

    return () => {
      cancelled = true;
    };
  }, [category, limit, order, page, refreshKey, sort, tag]);

  const hasMore = useMemo(() => {
    if (!state.pagination) {
      return false;
    }

    return page < state.pagination.totalPages;
  }, [page, state.pagination]);

  return {
    ...state,
    hasMore,
    activePage: page,
    loadMore: () => {
      if (hasMore && !state.isLoadingMore) {
        setPage((current) => current + 1);
      }
    },
    reload: () => {
      setPage(1);
      setRefreshKey((current) => current + 1);
    },
  };
}
