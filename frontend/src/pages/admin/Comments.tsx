import {
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  MessageSquare,
  Search,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useConfirm } from '@/hooks/useConfirm';
import { useToast } from '@/hooks/useToast';
import {
  ApiError,
  batchModerateComments,
  deleteAdminComment,
  listAdminComments,
  moderateComment,
  type AdminComment,
  type AdminCommentArticleRef,
  type AdminCommentListParams,
  type AdminCommentStats,
  type CommentModerateAction,
  type CommentStatus,
} from '@/lib/api';
import { cn, formatDate } from '@/lib/utils';

type StatusFilter = 'all' | CommentStatus;

const PAGE_SIZE = 20;

const statusTabs: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待审核' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已拒绝' },
];

const statusBadge: Record<CommentStatus, { variant: 'pending' | 'published' | 'neutral'; label: string }> = {
  pending: { variant: 'pending', label: '待审核' },
  approved: { variant: 'published', label: '已通过' },
  rejected: { variant: 'neutral', label: '已拒绝' },
};

function gravatarUrl(hash: string, size = 64) {
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon`;
}

export default function AdminComments() {
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<StatusFilter>('all');
  const [articleId, setArticleId] = useState<number | 'all'>('all');
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [pendingActionId, setPendingActionId] = useState<number | null>(null);
  const [batchWorking, setBatchWorking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [stats, setStats] = useState<AdminCommentStats | null>(null);
  const [articleRefs, setArticleRefs] = useState<AdminCommentArticleRef[]>([]);
  const toast = useToast();
  const confirm = useConfirm();

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    const params: AdminCommentListParams = {
      status,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
      search: searchQuery || undefined,
      articleId: articleId === 'all' ? undefined : articleId,
    };

    listAdminComments(params)
      .then((result) => {
        if (cancelled) {
          return;
        }
        setComments(result.items);
        setTotal(result.pagination.total);
        setStats(result.stats);
        setArticleRefs(result.articles);
        setSelectedIds((prev) => {
          const visible = new Set(result.items.map((item) => item.id));
          const next = new Set<number>();
          prev.forEach((id) => {
            if (visible.has(id)) {
              next.add(id);
            }
          });
          return next;
        });
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) {
          return;
        }
        const message = err instanceof ApiError ? err.message : '评论列表加载失败';
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
  }, [status, articleId, page, searchQuery, refreshKey]);

  // 搜索防抖
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchQuery(keyword.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [keyword]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const allVisibleSelected = useMemo(() => {
    return comments.length > 0 && comments.every((comment) => selectedIds.has(comment.id));
  }, [comments, selectedIds]);

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      if (allVisibleSelected) {
        const next = new Set(prev);
        comments.forEach((comment) => next.delete(comment.id));
        return next;
      }
      const next = new Set(prev);
      comments.forEach((comment) => next.add(comment.id));
      return next;
    });
  };

  const handleStatusChange = (next: StatusFilter) => {
    setStatus(next);
    setPage(1);
  };

  const handleArticleChange = (next: number | 'all') => {
    setArticleId(next);
    setPage(1);
  };

  const handleModerate = async (id: number, action: CommentModerateAction) => {
    if (pendingActionId) {
      return;
    }
    setPendingActionId(id);
    try {
      await moderateComment(id, action);
      setRefreshKey((prev) => prev + 1);
      toast.success(action === 'approve' ? '评论已通过' : '评论已拒绝');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : '操作失败';
      toast.error(message);
    } finally {
      setPendingActionId(null);
    }
  };

  const handleDelete = async (comment: AdminComment) => {
    if (pendingActionId) {
      return;
    }
    const confirmed = await confirm({
      title: '删除评论',
      description: `确定要删除 ${comment.nickname} 的评论吗？该操作不可撤销。`,
      confirmText: '删除',
      tone: 'danger',
    });
    if (!confirmed) {
      return;
    }
    setPendingActionId(comment.id);
    try {
      await deleteAdminComment(comment.id);
      setRefreshKey((prev) => prev + 1);
      toast.success('评论已删除');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : '删除失败';
      toast.error(message);
    } finally {
      setPendingActionId(null);
    }
  };

  const handleBatch = async (action: CommentModerateAction) => {
    if (batchWorking || selectedIds.size === 0) {
      return;
    }
    const ids = Array.from(selectedIds);
    setBatchWorking(true);
    try {
      await batchModerateComments(ids, action);
      setRefreshKey((prev) => prev + 1);
      toast.success(action === 'approve' ? `已通过 ${ids.length} 条评论` : `已拒绝 ${ids.length} 条评论`);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : '批量操作失败';
      toast.error(message);
    } finally {
      setBatchWorking(false);
    }
  };

  const statsCards = [
    {
      label: '全部评论',
      value: stats?.total ?? 0,
      icon: MessageSquare,
      accent: 'bg-primary/10 text-primary',
    },
    {
      label: '待审核',
      value: stats?.pending ?? 0,
      icon: Clock,
      accent: 'bg-accent/10 text-accent',
    },
    {
      label: '已通过',
      value: stats?.approved ?? 0,
      icon: CheckCircle2,
      accent: 'bg-success/10 text-success',
    },
    {
      label: '已拒绝',
      value: stats?.rejected ?? 0,
      icon: XCircle,
      accent: 'bg-error/10 text-error',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="space-y-6">
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-subtle">Engagement Hub</p>
            <h1 className="font-heading text-3xl font-bold text-foreground">评论管理</h1>
            <p className="text-sm text-muted">审核读者留下的每一条声音，维持营地的友善氛围。</p>
          </div>
        </header>

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

            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <select
                className="rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                onChange={(event) => {
                  const value = event.target.value;
                  handleArticleChange(value === 'all' ? 'all' : Number(value));
                }}
                value={articleId === 'all' ? 'all' : String(articleId)}
              >
                <option value="all">全部文章</option>
                {articleRefs.map((article) => (
                  <option key={article.id} value={article.id}>
                    {article.title}
                  </option>
                ))}
              </select>

              <div className="relative w-full md:w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
                <Input
                  className="pl-10"
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="搜索昵称、邮箱、内容..."
                  value={keyword}
                />
              </div>
            </div>
          </div>

          {selectedIds.size > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-primary/5 px-4 py-3 text-sm">
              <p className="text-foreground">已选 {selectedIds.size} 条评论</p>
              <div className="flex items-center gap-2">
                <Button
                  disabled={batchWorking}
                  onClick={() => void handleBatch('approve')}
                  size="sm"
                  variant="secondary"
                >
                  <Check className="size-4" />
                  批量通过
                </Button>
                <Button
                  disabled={batchWorking}
                  onClick={() => void handleBatch('reject')}
                  size="sm"
                  variant="ghost"
                >
                  <X className="size-4" />
                  批量拒绝
                </Button>
                <Button
                  disabled={batchWorking}
                  onClick={() => setSelectedIds(new Set())}
                  size="sm"
                  variant="ghost"
                >
                  清空选择
                </Button>
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
              {error}
            </div>
          ) : null}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-subtle">
                <tr>
                  <th className="w-10 pb-3">
                    <input
                      aria-label="全选"
                      checked={allVisibleSelected}
                      className="size-4 cursor-pointer rounded border-border"
                      onChange={toggleSelectAll}
                      type="checkbox"
                    />
                  </th>
                  <th className="pb-3 pr-4 font-medium">评论者</th>
                  <th className="pb-3 pr-4 font-medium">内容</th>
                  <th className="pb-3 pr-4 font-medium">文章</th>
                  <th className="pb-3 pr-4 font-medium">状态</th>
                  <th className="pb-3 pr-4 font-medium">时间</th>
                  <th className="pb-3 text-right font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, index) => (
                    <tr className="animate-pulse" key={`skeleton-${index}`}>
                      <td className="py-4">
                        <div className="size-4 rounded bg-surface-sunken" />
                      </td>
                      <td className="py-4 pr-4">
                        <div className="h-10 w-40 rounded bg-surface-sunken" />
                      </td>
                      <td className="py-4 pr-4">
                        <div className="h-4 w-60 rounded bg-surface-sunken" />
                      </td>
                      <td className="py-4 pr-4">
                        <div className="h-4 w-32 rounded bg-surface-sunken" />
                      </td>
                      <td className="py-4 pr-4">
                        <div className="h-4 w-16 rounded bg-surface-sunken" />
                      </td>
                      <td className="py-4 pr-4">
                        <div className="h-4 w-20 rounded bg-surface-sunken" />
                      </td>
                      <td className="py-4">
                        <div className="ml-auto h-8 w-24 rounded-full bg-surface-sunken" />
                      </td>
                    </tr>
                  ))
                ) : comments.length === 0 ? (
                  <tr>
                    <td className="py-10 text-center text-muted" colSpan={7}>
                      <MessageSquare className="mx-auto mb-3 size-8 text-subtle" />
                      {searchQuery ? '没有匹配的评论' : '该筛选下暂无评论'}
                    </td>
                  </tr>
                ) : (
                  comments.map((comment) => {
                    const isChecked = selectedIds.has(comment.id);
                    const badge = statusBadge[comment.status];

                    return (
                      <tr
                        className="align-top transition-colors duration-150 hover:bg-surface-sunken/40"
                        key={comment.id}
                      >
                        <td className="py-4">
                          <input
                            aria-label={`选择评论 ${comment.id}`}
                            checked={isChecked}
                            className="size-4 cursor-pointer rounded border-border"
                            onChange={() => toggleSelect(comment.id)}
                            type="checkbox"
                          />
                        </td>
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-3">
                            <img
                              alt={comment.nickname}
                              className="size-9 shrink-0 rounded-full object-cover"
                              referrerPolicy="no-referrer"
                              src={gravatarUrl(comment.emailHash)}
                            />
                            <div className="min-w-0 space-y-0.5">
                              <p className="truncate font-medium text-foreground">{comment.nickname}</p>
                              <p className="truncate text-xs text-subtle">{comment.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 pr-4">
                          <p className="line-clamp-3 whitespace-pre-wrap break-words text-sm text-foreground">
                            {comment.content}
                          </p>
                        </td>
                        <td className="py-4 pr-4">
                          <Link
                            className="line-clamp-2 text-sm text-muted transition-colors duration-150 hover:text-primary"
                            to={`/articles/${comment.article.slug}`}
                            target="_blank"
                          >
                            {comment.article.title}
                          </Link>
                        </td>
                        <td className="py-4 pr-4">
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                        </td>
                        <td className="py-4 pr-4 text-muted">{formatDate(comment.createdAt)}</td>
                        <td className="py-4">
                          <div className="flex items-center justify-end gap-1">
                            {comment.status !== 'approved' ? (
                              <button
                                aria-label="通过"
                                className="inline-flex size-9 items-center justify-center rounded-full text-muted hover:bg-success/10 hover:text-success disabled:opacity-50"
                                disabled={pendingActionId === comment.id}
                                onClick={() => void handleModerate(comment.id, 'approve')}
                                type="button"
                              >
                                <Check className="size-4" />
                              </button>
                            ) : null}
                            {comment.status !== 'rejected' ? (
                              <button
                                aria-label="拒绝"
                                className="inline-flex size-9 items-center justify-center rounded-full text-muted hover:bg-warning/10 hover:text-warning disabled:opacity-50"
                                disabled={pendingActionId === comment.id}
                                onClick={() => void handleModerate(comment.id, 'reject')}
                                type="button"
                              >
                                <X className="size-4" />
                              </button>
                            ) : null}
                            <Link
                              aria-label="在 C 端查看"
                              className="inline-flex size-9 items-center justify-center rounded-full text-muted hover:bg-surface-sunken hover:text-foreground"
                              target="_blank"
                              to={`/articles/${comment.article.slug}`}
                            >
                              <ExternalLink className="size-4" />
                            </Link>
                            <button
                              aria-label="删除"
                              className="inline-flex size-9 items-center justify-center rounded-full text-muted hover:bg-error/10 hover:text-error disabled:opacity-50"
                              disabled={pendingActionId === comment.id}
                              onClick={() => void handleDelete(comment)}
                              type="button"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 pt-2 text-sm md:flex-row md:items-center md:justify-between">
            <p className="text-muted">
              共 {total} 条 · 第 {page} / {totalPages} 页
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

      <aside className="space-y-4">
        <Card className="space-y-4">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-subtle">Engagement</p>
            <h2 className="font-heading text-lg font-bold text-foreground">评论概览</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {statsCards.map((card) => {
              const Icon = card.icon;
              return (
                <div className="space-y-2 rounded-xl bg-surface-sunken/60 p-4" key={card.label}>
                  <span className={cn('flex size-8 items-center justify-center rounded-lg', card.accent)}>
                    <Icon className="size-4" />
                  </span>
                  <p className="font-heading text-xl font-bold text-foreground">{card.value}</p>
                  <p className="text-xs text-subtle">{card.label}</p>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="space-y-3">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-subtle">Tips</p>
            <h2 className="font-heading text-base font-bold text-foreground">审核小贴士</h2>
          </div>
          <ul className="space-y-2 text-sm text-muted">
            <li>· 勾选多条评论后可批量通过或拒绝。</li>
            <li>· 被拒绝的评论仅后台可见，C 端不会展示。</li>
            <li>· 在系统设置里关闭审核，可让评论直接公开。</li>
          </ul>
        </Card>
      </aside>
    </div>
  );
}
