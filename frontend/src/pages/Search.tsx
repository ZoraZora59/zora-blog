import {
  CalendarDays,
  Eye,
  History,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useArticles } from '@/hooks/useArticles';
import {
  ApiError,
  resolveMediaUrl,
  searchArticles,
  type SearchResult,
} from '@/lib/api';
import { formatDate, formatNumber } from '@/lib/utils';

const SEARCH_HISTORY_KEY = 'zora-search-history';

function readSearchHistory() {
  if (typeof window === 'undefined') {
    return [] as string[];
  }

  try {
    const raw = window.localStorage.getItem(SEARCH_HISTORY_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function writeSearchHistory(history: string[]) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = (searchParams.get('q') ?? '').trim();
  const page = Math.max(Number(searchParams.get('page') ?? '1') || 1, 1);
  const [inputValue, setInputValue] = useState(query);
  const [history, setHistory] = useState<string[]>(() => readSearchHistory());
  const [result, setResult] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { articles: recommendedArticles } = useArticles({
    limit: 3,
    sort: 'viewCount',
  });

  useEffect(() => {
    setInputValue(query);
  }, [query]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const normalized = inputValue.trim();
      if (normalized === query) {
        return;
      }

      const next = new URLSearchParams(searchParams);
      if (normalized) {
        next.set('q', normalized);
      } else {
        next.delete('q');
      }
      next.delete('page');
      setSearchParams(next, { replace: true });
    }, 300);

    return () => {
      window.clearTimeout(timer);
    };
  }, [inputValue, query, searchParams, setSearchParams]);

  useEffect(() => {
    if (!query) {
      setResult(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    searchArticles({
      q: query,
      page,
      limit: 10,
    })
      .then((data) => {
        if (cancelled) {
          return;
        }

        setResult(data);
        setHistory((current) => {
          const next = [query, ...current.filter((item) => item !== query)].slice(0, 10);
          writeSearchHistory(next);
          return next;
        });
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }

        setError(error instanceof ApiError ? error.message : '搜索失败');
        setResult(null);
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [page, query]);

  const total = result?.pagination.total ?? 0;
  const totalPages = result?.pagination.totalPages ?? 0;
  const canGoPrevious = page > 1;
  const canGoNext = page < totalPages;
  const hasQuery = Boolean(query);
  const hasResults = (result?.items.length ?? 0) > 0;
  const historyItems = useMemo(() => history.slice(0, 10), [history]);

  const updateQuery = (nextQuery: string) => {
    setInputValue(nextQuery);
    const next = new URLSearchParams(searchParams);

    if (nextQuery.trim()) {
      next.set('q', nextQuery.trim());
    } else {
      next.delete('q');
    }
    next.delete('page');

    setSearchParams(next, { replace: true });
  };

  const updatePage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams);

    if (nextPage <= 1) {
      next.delete('page');
    } else {
      next.set('page', String(nextPage));
    }

    setSearchParams(next, { replace: true });
  };

  const clearHistory = () => {
    writeSearchHistory([]);
    setHistory([]);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-8 lg:px-16 lg:py-16">
      <div className="space-y-8">
        <header className="space-y-5">
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-subtle">Search</p>
            <h1 className="text-3xl font-heading font-bold text-foreground md:text-4xl">搜索文章</h1>
            <p className="max-w-2xl text-base leading-relaxed text-muted">
              标题、摘要和正文都会参与检索。输入关键词后，结果会自动更新。
            </p>
          </div>

          <div className="rounded-xl bg-surface-raised p-4 shadow-sm md:p-5">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-subtle" />
              <Input
                className="h-12 border-transparent bg-surface-sunken pl-12 text-base"
                onChange={(event) => setInputValue(event.target.value)}
                placeholder="搜索标题、摘要或正文关键词"
                value={inputValue}
              />
            </label>
          </div>

          {historyItems.length > 0 ? (
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 text-sm text-muted">
                <History className="size-4" />
                最近搜索
              </span>
              {historyItems.map((item) => (
                <button
                  className="rounded-full bg-surface-raised px-4 py-2 text-sm text-foreground shadow-sm transition-colors duration-150 hover:bg-surface-sunken"
                  key={item}
                  onClick={() => updateQuery(item)}
                  type="button"
                >
                  {item}
                </button>
              ))}
              <button
                className="inline-flex items-center gap-2 text-sm text-subtle transition-colors duration-150 hover:text-foreground"
                onClick={clearHistory}
                type="button"
              >
                <Trash2 className="size-4" />
                清空
              </button>
            </div>
          ) : null}
        </header>

        {!hasQuery ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <Card className="space-y-4">
              <div className="flex items-center gap-3 text-foreground">
                <Sparkles className="size-5 text-primary" />
                <h2 className="text-xl font-heading font-bold">从一个关键词开始</h2>
              </div>
              <p className="text-sm leading-relaxed text-muted">
                你可以输入技术栈、装备名称、场景关键词或正文片段，结果页会直接高亮命中内容。
              </p>
            </Card>

            <Card className="space-y-4">
              <h2 className="text-lg font-heading font-bold text-foreground">最近值得读</h2>
              <div className="space-y-4">
                {recommendedArticles.map((article) => (
                  <Link className="block space-y-1.5" key={article.id} to={`/articles/${article.slug}`}>
                    <p className="font-medium text-foreground transition-colors duration-150 hover:text-primary">
                      {article.title}
                    </p>
                    <p className="text-sm text-muted">{article.excerpt || '继续阅读完整内容。'}</p>
                  </Link>
                ))}
              </div>
            </Card>
          </div>
        ) : null}

        {hasQuery ? (
          <section className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted">
                {isLoading
                  ? `正在搜索 “${query}”`
                  : hasResults
                    ? `找到 ${total} 篇与 “${query}” 相关的文章`
                    : `没有找到与 “${query}” 相关的文章`}
              </p>
              {totalPages > 1 ? (
                <p className="text-sm text-subtle">
                  第 {page} / {totalPages} 页
                </p>
              ) : null}
            </div>

            {error ? (
              <Card className="space-y-2">
                <h2 className="text-lg font-heading font-bold text-foreground">搜索暂时不可用</h2>
                <p className="text-sm text-muted">{error}</p>
              </Card>
            ) : null}

            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div className="h-48 animate-pulse rounded-xl bg-surface-raised" key={index} />
                ))}
              </div>
            ) : null}

            {!isLoading && hasResults ? (
              <div className="space-y-5">
                {result?.items.map((item) => (
                  <Link
                    className="grid gap-5 rounded-xl bg-surface-raised p-5 shadow-sm transition-shadow duration-200 hover:shadow-md md:grid-cols-[220px_minmax(0,1fr)]"
                    key={item.id}
                    to={`/articles/${item.slug}`}
                  >
                    <div className="overflow-hidden rounded-xl bg-surface-sunken">
                      <img
                        alt={item.title}
                        className="aspect-[16/10] w-full object-cover"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        src={
                          resolveMediaUrl(item.coverImage) ||
                          'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1200&q=80'
                        }
                      />
                    </div>

                    <div className="space-y-4 [&_mark]:rounded [&_mark]:bg-primary/15 [&_mark]:px-1 [&_mark]:text-primary">
                      <div className="flex flex-wrap items-center gap-3 text-xs text-subtle">
                        <span className="rounded-full bg-secondary/10 px-3 py-1 font-medium text-secondary">
                          {item.category.name}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays className="size-4" />
                          {formatDate(item.publishedAt)}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Eye className="size-4" />
                          {formatNumber(item.viewCount)} 阅读
                        </span>
                      </div>

                      <div className="space-y-3">
                        <h2
                          className="text-2xl font-heading font-bold text-foreground"
                          dangerouslySetInnerHTML={{ __html: item.highlightedTitle }}
                        />
                        <p
                          className="text-sm leading-relaxed text-muted"
                          dangerouslySetInnerHTML={{ __html: item.highlightedExcerpt }}
                        />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : null}

            {!isLoading && !error && !hasResults ? (
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                <Card className="space-y-4">
                  <h2 className="text-xl font-heading font-bold text-foreground">换个关键词再试一次</h2>
                  <p className="text-sm leading-relaxed text-muted">
                    可以尝试技术栈、文章中的一句话、专题名，或者更短一点的关键词。
                  </p>
                </Card>

                <Card className="space-y-4">
                  <h2 className="text-lg font-heading font-bold text-foreground">推荐阅读</h2>
                  <div className="space-y-4">
                    {recommendedArticles.map((article) => (
                      <Link className="block space-y-1.5" key={article.id} to={`/articles/${article.slug}`}>
                        <p className="font-medium text-foreground transition-colors duration-150 hover:text-primary">
                          {article.title}
                        </p>
                        <p className="text-sm text-muted">{article.excerpt || '继续阅读完整内容。'}</p>
                      </Link>
                    ))}
                  </div>
                </Card>
              </div>
            ) : null}

            {!isLoading && hasResults && totalPages > 1 ? (
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button
                  disabled={!canGoPrevious}
                  onClick={() => updatePage(page - 1)}
                  variant="secondary"
                >
                  上一页
                </Button>
                <span className="text-sm text-muted">
                  第 {page} 页，共 {totalPages} 页
                </span>
                <Button
                  disabled={!canGoNext}
                  onClick={() => updatePage(page + 1)}
                  variant="secondary"
                >
                  下一页
                </Button>
              </div>
            ) : null}
          </section>
        ) : null}
      </div>
    </div>
  );
}
