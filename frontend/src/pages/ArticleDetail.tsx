import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Eye,
  List,
  UserRound,
} from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import CommentSection from '@/components/comments/CommentSection';
import MarkdownArticle from '@/components/markdown/MarkdownArticle';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import MobileTocDrawer from '@/components/ui/MobileTocDrawer';
import { useActiveHeading } from '@/hooks/useActiveHeading';
import { useArticle } from '@/hooks/useArticle';
import { useReadingProgress } from '@/hooks/useReadingProgress';
import { useTheme } from '@/hooks/useTheme';
import { extractTableOfContents } from '@/lib/markdown';
import { formatDate, formatNumber } from '@/lib/utils';
import { resolveMediaUrl } from '@/lib/api';

export default function ArticleDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { article, error, isLoading } = useArticle(slug);
  const { resolvedTheme } = useTheme();
  const articleRef = useRef<HTMLElement | null>(null);
  const progress = useReadingProgress(articleRef);
  const headings = useMemo(
    () => (article ? extractTableOfContents(article.content) : []),
    [article],
  );
  const activeHeading = useActiveHeading(headings);
  const [tocOpen, setTocOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8 lg:px-16">
        <div className="space-y-6">
          <div className="h-2 w-40 animate-pulse rounded-full bg-surface-raised" />
          <div className="h-16 w-full animate-pulse rounded-xl bg-surface-raised" />
          <div className="h-[420px] w-full animate-pulse rounded-xl bg-surface-raised" />
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="space-y-5">
              <div className="h-6 animate-pulse rounded bg-surface-raised" />
              <div className="h-6 animate-pulse rounded bg-surface-raised" />
              <div className="h-6 animate-pulse rounded bg-surface-raised" />
            </div>
            <div className="h-60 animate-pulse rounded-xl bg-surface-raised" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 md:px-8">
        <Card className="space-y-4">
          <h1 className="text-2xl font-heading font-bold text-foreground">文章暂时无法打开</h1>
          <p className="text-sm leading-relaxed text-muted">{error || '未找到对应文章。'}</p>
          <Link to="/">
            <Button variant="secondary">
              <ArrowLeft className="size-4" />
              返回首页
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-surface">
      <div
        className="fixed left-0 top-0 z-[60] h-0.5 bg-primary transition-all duration-150"
        style={{ width: `${progress}%` }}
      />

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 lg:px-16 lg:py-12">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Link
            className="inline-flex items-center gap-2 rounded-full bg-surface-raised px-4 py-2 text-sm font-medium text-muted shadow-sm transition-colors duration-150 hover:text-foreground"
            to="/"
          >
            <ArrowLeft className="size-4" />
            返回首页
          </Link>

          <div className="flex flex-wrap items-center gap-3 text-xs text-subtle">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-4" />
              {formatDate(article.publishedAt)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Eye className="size-4" />
              {formatNumber(article.viewCount)} 阅读
            </span>
            {headings.length > 0 ? (
              <Button
                aria-label="打开目录"
                className="lg:hidden"
                onClick={() => setTocOpen(true)}
                variant="icon"
              >
                <List className="size-4" />
              </Button>
            ) : null}
          </div>
        </div>

        <MobileTocDrawer
          activeHeading={activeHeading}
          headings={headings}
          isOpen={tocOpen}
          onClose={() => setTocOpen(false)}
        />

        <div className="space-y-10">
          <header className="space-y-8">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="category">{article.category.name}</Badge>
              {article.tags.map((tag) => (
                <Badge key={tag.id} variant="tech">
                  {tag.name}
                </Badge>
              ))}
            </div>

            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end">
              <div className="space-y-6">
                <h1 className="max-w-4xl text-3xl font-heading font-bold leading-tight text-foreground md:text-5xl">
                  {article.title}
                </h1>
                <p className="max-w-3xl text-base leading-relaxed text-muted md:text-lg">
                  {article.excerpt || '沿着这篇文章继续深入，查看完整内容与代码示例。'}
                </p>
              </div>

              <Card className="space-y-4 bg-surface-raised">
                <div className="flex items-center gap-4">
                  <img
                    alt={article.author.displayName}
                    className="size-14 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                    src={
                      resolveMediaUrl(article.author.avatar) ||
                      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80'
                    }
                  />
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">{article.author.displayName}</p>
                    <p className="text-sm text-muted">{article.author.role || '独立写作者'}</p>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-muted">
                  工程实践、营地记录和装备体验，持续更新在这里。
                </p>
              </Card>
            </div>

            <div className="overflow-hidden rounded-xl shadow-sm">
              <img
                alt={article.title}
                className="max-h-[540px] w-full object-cover"
                loading="lazy"
                referrerPolicy="no-referrer"
                src={resolveMediaUrl(article.coverImage)}
              />
            </div>
          </header>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
            <article
              className="space-y-6"
              ref={articleRef}
            >
              <MarkdownArticle content={article.content} theme={resolvedTheme} />

              <section className="space-y-6 border-t border-border/60 pt-10">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-medium text-muted">标签</span>
                  {article.tags.map((tag) => (
                    <Badge key={tag.id} variant="tech">
                      {tag.name}
                    </Badge>
                  ))}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {article.previousArticle ? (
                    <Link
                      className="rounded-xl bg-surface-raised p-5 shadow-sm transition-shadow duration-200 hover:shadow-md"
                      to={`/articles/${article.previousArticle.slug}`}
                    >
                      <p className="mb-3 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-subtle">
                        <ArrowLeft className="size-3.5" />
                        上一篇
                      </p>
                      <h3 className="text-lg font-semibold text-foreground">
                        {article.previousArticle.title}
                      </h3>
                    </Link>
                  ) : (
                    <Card className="bg-surface-raised">
                      <p className="text-sm text-muted">已经读到最早的一篇。</p>
                    </Card>
                  )}

                  {article.nextArticle ? (
                    <Link
                      className="rounded-xl bg-surface-raised p-5 shadow-sm transition-shadow duration-200 hover:shadow-md"
                      to={`/articles/${article.nextArticle.slug}`}
                    >
                      <p className="mb-3 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-subtle">
                        下一篇
                        <ArrowRight className="size-3.5" />
                      </p>
                      <h3 className="text-lg font-semibold text-foreground">
                        {article.nextArticle.title}
                      </h3>
                    </Link>
                  ) : (
                    <Card className="bg-surface-raised">
                      <p className="text-sm text-muted">这是目前最新的一篇。</p>
                    </Card>
                  )}
                </div>
              </section>

              {article.slug ? <CommentSection slug={article.slug} /> : null}
            </article>

            <aside className="hidden lg:block">
              <div className="sticky top-24 space-y-5">
                <Card className="space-y-4">
                  <p className="text-xs font-medium uppercase tracking-[0.24em] text-subtle">
                    About the Author
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-11 items-center justify-center rounded-full bg-surface-sunken text-muted">
                        <UserRound className="size-5" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{article.author.displayName}</p>
                        <p className="text-sm text-muted">{article.author.role || '独立写作者'}</p>
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed text-muted">
                      技术与户外并不冲突，它们都是探索未知的方式。
                    </p>
                  </div>
                </Card>

                {headings.length > 0 ? (
                  <Card className="space-y-4">
                    <p className="text-xs font-medium uppercase tracking-[0.24em] text-subtle">
                      Table of Contents
                    </p>
                    <nav className="space-y-1.5">
                      {headings.map((heading) => (
                        <a
                          className={`block rounded-lg px-3 py-2 text-sm transition-colors duration-150 ${
                            activeHeading === heading.id
                              ? 'bg-primary/10 text-primary'
                              : 'text-muted hover:bg-surface-sunken hover:text-foreground'
                          } ${heading.level === 3 ? 'ml-4' : ''}`}
                          href={`#${heading.id}`}
                          key={heading.id}
                        >
                          {heading.text}
                        </a>
                      ))}
                    </nav>
                  </Card>
                ) : null}

              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
