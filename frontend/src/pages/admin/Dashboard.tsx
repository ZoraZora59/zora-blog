import {
  ArrowUpRight,
  Eye,
  FileText,
  Heart,
  MessageCircle,
  TrendingUp,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Input';
import {
  ApiError,
  createAdminArticle,
  getDashboard,
  type DashboardStats,
} from '@/lib/api';
import { formatDate, formatNumber } from '@/lib/utils';

interface StatCard {
  label: string;
  value: number;
  hint: string;
  icon: typeof FileText;
  accent: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [draftSaving, setDraftSaving] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const cancelRef = useRef(false);

  useEffect(() => {
    cancelRef.current = false;
    setIsLoading(true);

    getDashboard()
      .then((data) => {
        if (cancelRef.current) {
          return;
        }
        setStats(data);
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelRef.current) {
          return;
        }
        const message = err instanceof ApiError ? err.message : '数据加载失败';
        setError(message);
      })
      .finally(() => {
        if (!cancelRef.current) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelRef.current = true;
    };
  }, [refreshKey]);

  const statCards = useMemo<StatCard[]>(() => {
    const totals = stats?.totals;
    const weekly = stats?.weeklyGrowth;
    return [
      {
        label: '总文章数',
        value: totals?.articles ?? 0,
        hint: `本周新发 ${weekly?.articles ?? 0} 篇`,
        icon: FileText,
        accent: 'bg-primary/10 text-primary',
      },
      {
        label: '总阅读量',
        value: totals?.views ?? 0,
        hint: `本周 +${weekly?.views ?? 0}`,
        icon: Eye,
        accent: 'bg-accent/10 text-accent',
      },
      {
        label: '总评论',
        value: totals?.comments ?? 0,
        hint: `待审核 ${totals?.pendingComments ?? 0} 条`,
        icon: MessageCircle,
        accent: 'bg-secondary/10 text-secondary',
      },
      {
        label: '总点赞',
        value: totals?.likes ?? 0,
        hint: '来自 C 端读者',
        icon: Heart,
        accent: 'bg-error/10 text-error',
      },
    ];
  }, [stats]);

  const handleQuickDraft = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (draftSaving) {
      return;
    }

    const title = draftTitle.trim();
    if (!title) {
      setDraftError('标题不能为空');
      return;
    }

    setDraftSaving(true);
    setDraftError(null);

    try {
      const article = await createAdminArticle({
        title,
        content: draftContent,
        status: 'draft',
      });
      setDraftTitle('');
      setDraftContent('');
      setRefreshKey((prev) => prev + 1);
      navigate(`/admin/posts/${article.id}/edit`);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : '草稿保存失败';
      setDraftError(message);
    } finally {
      setDraftSaving(false);
    }
  };

  const maxViews = stats?.topArticles.reduce((max, item) => Math.max(max, item.viewCount), 0) ?? 0;

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-subtle">Admin Dashboard</p>
          <h1 className="font-heading text-3xl font-bold text-foreground">今天也来写一点吧</h1>
          <p className="text-sm text-muted">一目了然地看到你的博客最新状态，再决定下一步。</p>
        </div>

        <Button onClick={() => navigate('/admin/posts/new')} size="lg">
          写新文章
          <ArrowUpRight className="size-4" />
        </Button>
      </header>

      {error ? (
        <Card className="border border-error/30 bg-error/5 text-error">{error}</Card>
      ) : null}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 12 }}
              key={card.label}
              transition={{ duration: 0.3, ease: 'easeOut', delay: index * 0.05 }}
            >
              <Card className="flex flex-col gap-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted">{card.label}</span>
                  <span className={`flex size-9 items-center justify-center rounded-xl ${card.accent}`}>
                    <Icon className="size-4" />
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="font-heading text-3xl font-bold text-foreground">
                    {isLoading ? '—' : formatNumber(card.value)}
                  </p>
                  <p className="text-xs text-subtle">{card.hint}</p>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <Card className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-bold text-foreground">Quick Draft</h2>
            <span className="text-xs text-subtle">快速记下灵感，随后再慢慢打磨</span>
          </div>

          <form className="space-y-4" onSubmit={handleQuickDraft}>
            <Input
              onChange={(event) => setDraftTitle(event.target.value)}
              placeholder="给这篇文章起个名字"
              value={draftTitle}
            />
            <Textarea
              onChange={(event) => setDraftContent(event.target.value)}
              placeholder="此刻想写点什么？支持 Markdown"
              rows={5}
              value={draftContent}
            />
            {draftError ? <p className="text-xs text-error">{draftError}</p> : null}
            <div className="flex items-center justify-end gap-3">
              <Button
                onClick={() => {
                  setDraftTitle('');
                  setDraftContent('');
                  setDraftError(null);
                }}
                type="button"
                variant="ghost"
              >
                清空
              </Button>
              <Button disabled={draftSaving} type="submit">
                {draftSaving ? '保存中…' : '保存为草稿'}
              </Button>
            </div>
          </form>
        </Card>

        <Card className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-bold text-foreground">Reach Analysis</h2>
            <TrendingUp className="size-5 text-secondary" />
          </div>

          <div className="space-y-3">
            {stats?.topArticles.length ? (
              stats.topArticles.map((item) => {
                const widthPercent = maxViews > 0 ? Math.max(6, (item.viewCount / maxViews) * 100) : 6;

                return (
                  <div className="space-y-1" key={item.id}>
                    <div className="flex items-center justify-between text-sm">
                      <Link
                        className="truncate pr-2 font-medium text-foreground hover:text-primary"
                        to={`/articles/${item.slug}`}
                      >
                        {item.title}
                      </Link>
                      <span className="text-xs text-muted">{formatNumber(item.viewCount)} 阅读</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-sunken">
                      <div
                        className="h-full rounded-full bg-primary/70 transition-[width] duration-500"
                        style={{ width: `${widthPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
                暂无阅读数据。发布文章后这里会展示 Top 5 内容。
              </p>
            )}
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-bold text-foreground">Recent Feedback</h2>
            {stats?.totals.pendingComments ? (
              <Badge variant="draft">{stats.totals.pendingComments} 条待审核</Badge>
            ) : null}
          </div>

          {stats?.recentComments.length ? (
            <ul className="space-y-3">
              {stats.recentComments.map((comment) => (
                <li
                  className="rounded-lg border border-border/60 bg-surface-sunken/40 px-4 py-3"
                  key={comment.id}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 space-y-1">
                      <p className="truncate text-sm font-medium text-foreground">{comment.nickname}</p>
                      <p className="line-clamp-2 text-xs text-muted">{comment.content}</p>
                      <Link
                        className="text-xs text-subtle hover:text-primary"
                        to={`/articles/${comment.article.slug}`}
                      >
                        来自《{comment.article.title}》
                      </Link>
                    </div>
                    <Badge
                      variant={
                        comment.status === 'approved'
                          ? 'published'
                          : comment.status === 'pending'
                            ? 'draft'
                            : 'neutral'
                      }
                    >
                      {comment.status === 'approved' ? '已通过' : comment.status === 'pending' ? '待审核' : '已拒绝'}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="space-y-3 text-sm text-subtle">
              <li className="rounded-lg border border-dashed border-border px-4 py-3">暂无评论</li>
              <li className="rounded-lg border border-dashed border-border px-4 py-3">
                读者评论后会显示在这里
              </li>
            </ul>
          )}
        </Card>

        <Card className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-bold text-foreground">Last Published</h2>
            {stats?.lastPublished ? (
              <Link
                className="text-xs font-medium text-primary hover:text-primary-light"
                to={`/articles/${stats.lastPublished.slug}`}
                target="_blank"
              >
                查看文章
              </Link>
            ) : null}
          </div>

          {stats?.lastPublished ? (
            <div className="space-y-3">
              <Badge variant="category">{stats.lastPublished.category.name}</Badge>
              <h3 className="font-heading text-xl font-bold leading-tight text-foreground">
                {stats.lastPublished.title}
              </h3>
              {stats.lastPublished.excerpt ? (
                <p className="line-clamp-3 text-sm text-muted">{stats.lastPublished.excerpt}</p>
              ) : null}
              <div className="flex items-center gap-4 text-xs text-subtle">
                <span>{formatDate(stats.lastPublished.publishedAt)}</span>
                <span className="inline-flex items-center gap-1">
                  <Eye className="size-3.5" />
                  {formatNumber(stats.lastPublished.viewCount)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Heart className="size-3.5" />
                  {formatNumber(stats.lastPublished.likeCount)}
                </span>
              </div>
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
              还没有发布过文章。保存一份草稿后，在编辑器里发布吧。
            </p>
          )}
        </Card>
      </section>
    </div>
  );
}
