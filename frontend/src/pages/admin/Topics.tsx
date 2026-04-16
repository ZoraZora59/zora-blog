import {
  ExternalLink,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import {
  ApiError,
  deleteAdminTopic,
  listAdminTopics,
  resolveMediaUrl,
  type TopicSummary,
} from '@/lib/api';
import { formatDate, formatNumber } from '@/lib/utils';

export default function AdminTopicsPage() {
  const navigate = useNavigate();
  const [topics, setTopics] = useState<TopicSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    listAdminTopics()
      .then((items) => {
        if (cancelled) {
          return;
        }
        setTopics(items);
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) {
          return;
        }
        const message = err instanceof ApiError ? err.message : '专题列表加载失败';
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
  }, [refreshKey]);

  const handleDelete = async (topic: TopicSummary) => {
    if (deletingId) {
      return;
    }
    const confirmed = window.confirm(`确定要删除《${topic.title}》吗？该操作不可撤销。`);
    if (!confirmed) {
      return;
    }

    setDeletingId(topic.id);

    try {
      await deleteAdminTopic(topic.id);
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : '删除失败';
      window.alert(message);
    } finally {
      setDeletingId(null);
    }
  };

  const totalArticles = topics.reduce((sum, t) => sum + t.articleCount, 0);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-subtle">Topic Manager</p>
          <h1 className="font-heading text-3xl font-bold text-foreground">专题管理</h1>
          <p className="text-sm text-muted">创建专题并关联文章，组织更完整的阅读路径。</p>
        </div>

        <Button onClick={() => navigate('/admin/topics/new')}>
          <Plus className="size-4" />
          新建专题
        </Button>
      </header>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <Card className="space-y-1">
          <p className="text-xs text-subtle">专题总数</p>
          <p className="font-heading text-2xl font-bold text-foreground">{formatNumber(topics.length)}</p>
        </Card>
        <Card className="space-y-1">
          <p className="text-xs text-subtle">关联文章</p>
          <p className="font-heading text-2xl font-bold text-foreground">{formatNumber(totalArticles)}</p>
        </Card>
        <Card className="space-y-1">
          <p className="text-xs text-subtle">平均文章数</p>
          <p className="font-heading text-2xl font-bold text-foreground">
            {topics.length > 0 ? (totalArticles / topics.length).toFixed(1) : '0'}
          </p>
        </Card>
      </section>

      <Card className="space-y-4">
        {error ? (
          <div className="rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
            {error}
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-subtle">
              <tr>
                <th className="pb-3 pr-4 font-medium">专题</th>
                <th className="pb-3 pr-4 font-medium">文章数</th>
                <th className="pb-3 pr-4 font-medium">Slug</th>
                <th className="pb-3 pr-4 font-medium">创建时间</th>
                <th className="pb-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <tr className="animate-pulse" key={`skeleton-${index}`}>
                    <td className="py-4 pr-4">
                      <div className="h-4 w-48 rounded bg-surface-sunken" />
                    </td>
                    <td className="py-4 pr-4">
                      <div className="h-4 w-12 rounded bg-surface-sunken" />
                    </td>
                    <td className="py-4 pr-4">
                      <div className="h-4 w-24 rounded bg-surface-sunken" />
                    </td>
                    <td className="py-4 pr-4">
                      <div className="h-4 w-20 rounded bg-surface-sunken" />
                    </td>
                    <td className="py-4">
                      <div className="ml-auto h-8 w-24 rounded-full bg-surface-sunken" />
                    </td>
                  </tr>
                ))
              ) : topics.length === 0 ? (
                <tr>
                  <td className="py-10 text-center text-muted" colSpan={5}>
                    <Sparkles className="mx-auto mb-3 size-8 text-subtle" />
                    还没有创建专题
                  </td>
                </tr>
              ) : (
                topics.map((topic) => (
                  <tr className="align-top transition-colors duration-150 hover:bg-surface-sunken/40" key={topic.id}>
                    <td className="py-4 pr-4">
                      <div className="flex gap-3">
                        {topic.coverImage ? (
                          <img
                            alt={topic.title}
                            className="size-14 shrink-0 rounded-lg object-cover"
                            referrerPolicy="no-referrer"
                            src={resolveMediaUrl(topic.coverImage)}
                          />
                        ) : (
                          <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-surface-sunken text-subtle">
                            <Sparkles className="size-5" />
                          </div>
                        )}
                        <div className="min-w-0 space-y-1">
                          <p className="line-clamp-1 font-semibold text-foreground">{topic.title}</p>
                          {topic.description ? (
                            <p className="line-clamp-2 text-xs text-muted">{topic.description}</p>
                          ) : (
                            <p className="text-xs text-subtle">暂无描述</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 pr-4 text-muted">{topic.articleCount} 篇</td>
                    <td className="py-4 pr-4 text-muted">/{topic.slug}</td>
                    <td className="py-4 pr-4 text-muted">{formatDate(topic.createdAt)}</td>
                    <td className="py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          aria-label="在 C 端查看"
                          className="inline-flex size-9 items-center justify-center rounded-full text-muted hover:bg-surface-sunken hover:text-foreground"
                          target="_blank"
                          to={`/topics/${topic.slug}`}
                        >
                          <ExternalLink className="size-4" />
                        </Link>
                        <Link
                          aria-label="编辑"
                          className="inline-flex size-9 items-center justify-center rounded-full text-muted hover:bg-surface-sunken hover:text-foreground"
                          to={`/admin/topics/${topic.id}/edit`}
                        >
                          <Pencil className="size-4" />
                        </Link>
                        <button
                          aria-label="删除"
                          className="inline-flex size-9 items-center justify-center rounded-full text-muted hover:bg-error/10 hover:text-error disabled:opacity-50"
                          disabled={deletingId === topic.id}
                          onClick={() => void handleDelete(topic)}
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
      </Card>
    </div>
  );
}