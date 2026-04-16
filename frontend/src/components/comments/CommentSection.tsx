import { MessageCircle, Send, UserRound } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Input';
import {
  ApiError,
  listArticleComments,
  submitArticleComment,
  type PublicComment,
} from '@/lib/api';
import { cn } from '@/lib/utils';

interface CommentSectionProps {
  slug: string;
}

interface ToastState {
  type: 'success' | 'error' | 'info';
  message: string;
}

const NICKNAME_MAX = 40;
const CONTENT_MAX = 1000;

function gravatarUrl(hash: string, size = 80) {
  // 使用 identicon 作为后备头像
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon`;
}

function formatCommentTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const diff = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) {
    return '刚刚';
  }
  if (diff < hour) {
    return `${Math.floor(diff / minute)} 分钟前`;
  }
  if (diff < day) {
    return `${Math.floor(diff / hour)} 小时前`;
  }
  if (diff < 7 * day) {
    return `${Math.floor(diff / day)} 天前`;
  }
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export default function CommentSection({ slug }: CommentSectionProps) {
  const [comments, setComments] = useState<PublicComment[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const loadComments = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await listArticleComments(slug);
      setComments(result.items);
      setTotal(result.total);
      setLoadError(null);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : '评论加载失败';
      setLoadError(message);
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void loadComments();
  }, [loadComments]);

  // Toast 3 秒后自动关闭
  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = window.setTimeout(() => setToast(null), 3600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const canSubmit = useMemo(() => {
    return (
      nickname.trim().length > 0 &&
      email.trim().length > 0 &&
      content.trim().length > 0 &&
      !submitting
    );
  }, [nickname, email, content, submitting]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitArticleComment(slug, {
        nickname: nickname.trim(),
        email: email.trim(),
        content: content.trim(),
      });

      setNickname('');
      setEmail('');
      setContent('');

      if (result.status === 'approved') {
        setToast({ type: 'success', message: '评论已发布，感谢你的分享！' });
        await loadComments();
      } else {
        setToast({ type: 'info', message: '评论已提交，等待博主审核后显示。' });
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : '评论提交失败';
      setToast({ type: 'error', message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="space-y-6 border-t border-border/60 pt-10">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MessageCircle className="size-5" />
          </span>
          <div>
            <h2 className="font-heading text-xl font-bold text-foreground">评论区</h2>
            <p className="text-sm text-muted">
              {total > 0 ? `已有 ${total} 条评论` : '还没有评论，做第一个留言的人吧'}
            </p>
          </div>
        </div>
      </header>

      <Card className="space-y-4 bg-surface-raised">
        <p className="text-sm font-medium text-foreground">留下你的足迹</p>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-subtle" htmlFor="comment-nickname">
                昵称
              </label>
              <Input
                id="comment-nickname"
                maxLength={NICKNAME_MAX}
                onChange={(event) => setNickname(event.target.value)}
                placeholder="写个响亮的名字"
                required
                value={nickname}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-subtle" htmlFor="comment-email">
                邮箱（仅用于 Gravatar 头像，不会公开）
              </label>
              <Input
                id="comment-email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                type="email"
                value={email}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-subtle" htmlFor="comment-content">
              想说点什么
            </label>
            <Textarea
              id="comment-content"
              maxLength={CONTENT_MAX}
              onChange={(event) => setContent(event.target.value)}
              placeholder="分享你的想法、疑问或者共鸣。支持纯文本。"
              required
              rows={5}
              value={content}
            />
            <p className="text-right text-xs text-subtle">
              {content.length} / {CONTENT_MAX}
            </p>
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-subtle">提交后若开启审核会先进入审核队列。</p>
            <Button disabled={!canSubmit} type="submit">
              <Send className="size-4" />
              {submitting ? '提交中…' : '发布评论'}
            </Button>
          </div>
        </form>

        {toast ? (
          <div
            className={cn(
              'rounded-lg border px-4 py-3 text-sm transition-opacity duration-200',
              toast.type === 'success' && 'border-success/30 bg-success/5 text-success',
              toast.type === 'info' && 'border-accent/30 bg-accent/5 text-accent',
              toast.type === 'error' && 'border-error/30 bg-error/5 text-error',
            )}
            role="status"
          >
            {toast.message}
          </div>
        ) : null}
      </Card>

      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, index) => (
            <Card className="flex gap-4" key={`comment-skeleton-${index}`}>
              <div className="size-11 shrink-0 animate-pulse rounded-full bg-surface-sunken" />
              <div className="flex-1 space-y-3">
                <div className="h-4 w-32 animate-pulse rounded bg-surface-sunken" />
                <div className="h-4 w-full animate-pulse rounded bg-surface-sunken" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-surface-sunken" />
              </div>
            </Card>
          ))
        ) : loadError ? (
          <Card className="border border-error/30 bg-error/5 text-sm text-error">
            {loadError}
          </Card>
        ) : comments.length === 0 ? (
          <Card className="flex flex-col items-center gap-2 py-10 text-center">
            <MessageCircle className="size-8 text-subtle" />
            <p className="text-sm text-muted">这里还很安静，期待你的发声。</p>
          </Card>
        ) : (
          comments.map((comment) => (
            <Card className="flex gap-4" key={comment.id}>
              <img
                alt={comment.nickname}
                className="size-11 shrink-0 rounded-full object-cover"
                onError={(event) => {
                  event.currentTarget.style.display = 'none';
                }}
                referrerPolicy="no-referrer"
                src={gravatarUrl(comment.emailHash)}
              />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1 font-medium text-foreground">
                    <UserRound className="size-3.5 text-subtle" />
                    {comment.nickname}
                  </span>
                  <span className="text-xs text-subtle">{formatCommentTime(comment.createdAt)}</span>
                </div>
                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-muted">
                  {comment.content}
                </p>
              </div>
            </Card>
          ))
        )}
      </div>
    </section>
  );
}
