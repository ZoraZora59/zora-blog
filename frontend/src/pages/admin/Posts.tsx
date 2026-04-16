import {
  ExternalLink,
  FileText,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import {
  ApiError,
  deleteAdminArticle,
  getAdminArticleStats,
  listAdminArticles,
  resolveMediaUrl,
  type AdminArticleListParams,
  type AdminArticleStats,
  type ArticleSummary,
} from '@/lib/api';
import { cn, formatDate, formatNumber } from '@/lib/utils';

type StatusFilter = 'all' | 'published' | 'draft';

const PAGE_SIZE = 10;

const statusTabs: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'published', label: '已发布' },
  { value: 'draft', label: '草稿' },
];

export default function AdminPosts() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [stats, setStats] = useState<AdminArticleStats | null>(null);

  // 加载全局统计
  useEffect(() => {
    getAdminArticleStats()
      .then(setStats)
      .catch(() => {
        // 静默失败
      });
  }, [refreshKey]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    const params: AdminArticleListParams = {
      status,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
      sort: 'updatedAt',
      order: 'desc',
      search: searchQuery || undefined,
    };

    listAdminArticles(params)
      .then((result) => {
        if (cancelled) {
          return;
        }
        setArticles(result.items);
        setTotal(result.pagination.total);
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) {
          return;
        }
        const message = err instanceof ApiError ? err.message : '文章列表加载失败';
        setError(message);
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [page, refreshKey, status, searchQuery]);

  // 搜索防抖
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchQuery(keyword.trim());
      setPage(1);
    }, 300);

    return () => {
      window.clearTimeout(timer);
    };
  }, [keyword]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleDelete = async (article: ArticleSummary) => {
    if (deletingId) {
      return;
    }
    const confirmed = window.confirm(`确定要删除《${article.title}》吗？该操作不可撤销。`);
    if (!confirmed) {
      return;
    }

    setDeletingId(article.id);

    try {
      await deleteAdminArticle(article.id);
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : '删除失败';
      window.alert(message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleStatusChange = (next: StatusFilter) => {
    setStatus(next);
    setPage(1);
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-subtle">Content Manager</p>
          <h1 className="font-heading text-3xl font-bold text-foreground">文章管理</h1>
          <p className="text-sm text-muted">浏览、编辑、发布与归档你所有的博客内容。</p>
        </div>

        <Button onClick={() => navigate('/admin/posts/new')}>
          <Plus className="size-4" />
          新建文章
        </Button>
      </header>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="space-y-1">
          <p className="text-xs text-subtle">总文章数</p>
          <p className="font-heading text-2xl font-bold text-foreground">{formatNumber(stats?.total ?? total)}</p>
        </Card>
        <Card className="space-y-1">
          <p className="text-xs text-subtle">已发布</p>
          <p className="font-heading text-2xl font-bold text-foreground">{formatNumber(stats?.published ?? 0)}</p>
        </Card>
        <Card className="space-y-1">
          <p className="text-xs text-subtle">草稿</p>
          <p className="font-heading text-2xl font-bold text-foreground">{formatNumber(stats?.drafts ?? 0)}</p>
        </Card>
        <Card className="space-y-1">
          <p className="text-xs text-subtle">累计阅读</p>
          <p className="font-heading text-2xl font-bold text-foreground">{formatNumber(stats?.totalViews ?? 0)}</p>
        </Card>
      </section>

      <Card className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {statusTabs.map((tab) => (
              <button
                className={cn(
                  'rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-150',
                  status === tab.value
                    ? 'bg-primary text-white'
                    : 'bg-surface-sunken text-muted hover:bg-border hover:text-foreground',
                )}
                key={tab.value}
                onClick={() => handleStatusChange(tab.value)}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
            <Input
              className="pl-10"
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="搜索标题、摘要、内容..."
              value={keyword}
            />
          </div>
        </div>

        {error ? (
          <div className="rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
            {error}
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-subtle">
              <tr>
                <th className="pb-3 pr-4 font-medium">文章</th>
                <th className="pb-3 pr-4 font-medium">状态</th>
                <th className="pb-3 pr-4 font-medium">分类</th>
                <th className="pb-3 pr-4 font-medium">更新时间</th>
                <th className="pb-3 pr-4 font-medium">阅读</th>
                <th className="pb-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <tr className="animate-pulse" key={`skeleton-${index}`}>
                    <td className="py-4 pr-4">
                      <div className="h-4 w-60 rounded bg-surface-sunken" />
                    </td>
                    <td className="py-4 pr-4">
                      <div className="h-4 w-16 rounded bg-surface-sunken" />
                    </td>
                    <td className="py-4 pr-4">
                      <div className="h-4 w-24 rounded bg-surface-sunken" />
                    </td>
                    <td className="py-4 pr-4">
                      <div className="h-4 w-20 rounded bg-surface-sunken" />
                    </td>
                    <td className="py-4 pr-4">
                      <div className="h-4 w-12 rounded bg-surface-sunken" />
                    </td>
                    <td className="py-4">
                      <div className="ml-auto h-8 w-24 rounded-full bg-surface-sunken" />
                    </td>
                  </tr>
                ))
              ) : articles.length === 0 ? (
                <tr>
                  <td className="py-10 text-center text-muted" colSpan={6}>
                    <FileText className="mx-auto mb-3 size-8 text-subtle" />
                    {searchQuery ? '没有匹配的文章' : '该筛选下暂无文章'}
                  </td>
                </tr>
              ) : (
                articles.map((article) => (
                  <tr className="align-top transition-colors duration-150 hover:bg-surface-sunken/40" key={article.id}>
                    <td className="py-4 pr-4">
                      <div className="flex gap-3">
                        {article.coverImage ? (
                          <img
                            alt={article.title}
                            className="size-14 shrink-0 rounded-lg object-cover"
                            referrerPolicy="no-referrer"
                            src={resolveMediaUrl(article.coverImage)}
                          />
                        ) : (
                          <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-surface-sunken text-subtle">
                            <FileText className="size-5" />
                          </div>
                        )}
                        <div className="min-w-0 space-y-1">
                          <p className="line-clamp-1 font-semibold text-foreground">{article.title}</p>
                          <p className="line-clamp-2 text-xs text-muted">
                            {article.excerpt ?? '暂无摘要'}
                          </p>
                          <p className="text-xs text-subtle">/{article.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 pr-4">
                      <Badge variant={article.status === 'published' ? 'published' : 'draft'}>
                        {article.status === 'published' ? '已发布' : '草稿'}
                      </Badge>
                    </td>
                    <td className="py-4 pr-4 text-muted">{article.category.name}</td>
                    <td className="py-4 pr-4 text-muted">{formatDate(article.updatedAt)}</td>
                    <td className="py-4 pr-4 text-muted">{formatNumber(article.viewCount)}</td>
                    <td className="py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          aria-label="在 C 端查看"
                          className="inline-flex size-9 items-center justify-center rounded-full text-muted hover:bg-surface-sunken hover:text-foreground"
                          target="_blank"
                          to={`/articles/${article.slug}`}
                        >
                          <ExternalLink className="size-4" />
                        </Link>
                        <Link
                          aria-label="编辑"
                          className="inline-flex size-9 items-center justify-center rounded-full text-muted hover:bg-surface-sunken hover:text-foreground"
                          to={`/admin/posts/${article.id}/edit`}
                        >
                          <Pencil className="size-4" />
                        </Link>
                        <button
                          aria-label="删除"
                          className="inline-flex size-9 items-center justify-center rounded-full text-muted hover:bg-error/10 hover:text-error disabled:opacity-50"
                          disabled={deletingId === article.id}
                          onClick={() => void handleDelete(article)}
                          type="button"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 pt-2 text-sm md:flex-row md:items-center md:justify-between">
          <p className="text-muted">
            共 {formatNumber(total)} 篇 · 第 {page} / {totalPages} 页
          </p>
          <div className="flex items-center gap-2">
            <Button
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              size="sm"
              variant="secondary"
            >
              上一页
            </Button>
            <Button
              disabled={page >= totalPages || isLoading}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              size="sm"
              variant="secondary"
            >
              下一页
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
