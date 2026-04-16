import { ArrowLeft, Eye, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { Link, useParams } from 'react-router-dom';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useTopic } from '@/hooks/useTopic';
import { formatDate, formatNumber } from '@/lib/utils';
import { resolveMediaUrl } from '@/lib/api';

export default function TopicDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { topic, error, isLoading } = useTopic(slug);

  if (isLoading) {
    return (
      <div className="bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-10 md:px-8 lg:px-16">
          <div className="space-y-8">
            <div className="h-[320px] w-full animate-pulse rounded-xl bg-surface-raised" />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="h-[280px] animate-pulse rounded-xl bg-surface-raised" />
              <div className="h-[280px] animate-pulse rounded-xl bg-surface-raised" />
              <div className="h-[280px] animate-pulse rounded-xl bg-surface-raised" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !topic) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 md:px-8">
        <Card className="space-y-4">
          <h1 className="text-2xl font-heading font-bold text-foreground">专题暂时无法打开</h1>
          <p className="text-sm leading-relaxed text-muted">{error || '未找到对应专题。'}</p>
          <Link to="/topics">
            <Button variant="secondary">
              <ArrowLeft className="size-4" />
              返回专题列表
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-surface">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border/60 bg-surface">
        {topic.coverImage ? (
          <div className="absolute inset-0">
            <img
              alt={topic.title}
              className="size-full object-cover opacity-20"
              referrerPolicy="no-referrer"
              src={resolveMediaUrl(topic.coverImage)}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-surface/80 via-surface/90 to-surface" />
          </div>
        ) : null}

        <div className="relative mx-auto max-w-6xl px-4 py-12 md:px-8 md:py-16 lg:px-16 lg:py-20">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <Link
              className="inline-flex items-center gap-2 rounded-full bg-surface-raised px-4 py-2 text-sm font-medium text-muted shadow-sm transition-colors duration-150 hover:text-foreground"
              to="/topics"
            >
              <ArrowLeft className="size-4" />
              返回专题列表
            </Link>

            <div className="flex flex-wrap items-center gap-4">
              <Badge className="gap-2" variant="category">
                <Sparkles className="size-3.5" />
                Topic
              </Badge>
              <span className="rounded-full bg-surface-sunken px-3 py-1.5 text-sm font-medium text-subtle">
                {topic.articleCount} 篇文章
              </span>
            </div>

            <h1 className="max-w-4xl text-4xl font-heading font-bold leading-tight text-foreground md:text-5xl lg:text-6xl">
              {topic.title}
            </h1>

            {topic.description ? (
              <p className="max-w-3xl text-lg leading-relaxed text-muted md:text-xl">
                {topic.description}
              </p>
            ) : null}
          </motion.div>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="mx-auto max-w-6xl px-4 py-10 md:px-8 lg:px-16 lg:py-16">
        {topic.articles.length === 0 ? (
          <Card className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">暂无关联文章</h2>
            <p className="text-sm text-muted">该专题下还没有添加文章。</p>
          </Card>
        ) : (
          <motion.div
            animate={{ opacity: 1 }}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            initial={{ opacity: 0 }}
          >
            {topic.articles.map((article, index) => {
              // Organic Brutalism: 第一篇文章占两列
              const isFirst = index === 0;
              const isLarge = isFirst && topic.articles.length >= 3;

              return (
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  className={isLarge ? 'md:col-span-2' : ''}
                  initial={{ opacity: 0, y: 16 }}
                  key={article.id}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                  <Link
                    className="group block h-full overflow-hidden rounded-xl bg-surface-raised shadow-sm transition-all duration-200 hover:shadow-md"
                    to={`/articles/${article.slug}`}
                  >
                    {article.coverImage ? (
                      <div className={isLarge ? 'aspect-[21/9]' : 'aspect-[16/10]'}>
                        <img
                          alt={article.title}
                          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                          src={resolveMediaUrl(article.coverImage)}
                        />
                      </div>
                    ) : (
                      <div className={`bg-gradient-to-br from-primary/5 to-secondary/5 ${isLarge ? 'aspect-[21/9]' : 'aspect-[16/10]'}`} />
                    )}
                    <div className="p-5">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <Badge variant="category">{article.category.name}</Badge>
                        <span className="inline-flex items-center gap-1 text-xs text-subtle">
                          <Eye className="size-3.5" />
                          {formatNumber(article.viewCount)}
                        </span>
                      </div>
                      <h2 className={`font-semibold text-foreground group-hover:text-primary ${isLarge ? 'text-xl md:text-2xl' : 'text-lg'}`}>
                        {article.title}
                      </h2>
                      {article.excerpt ? (
                        <p className={`mt-2 leading-relaxed text-muted ${isLarge ? 'text-base line-clamp-2' : 'text-sm line-clamp-2'}`}>
                          {article.excerpt}
                        </p>
                      ) : null}
                      <p className="mt-3 text-xs text-subtle">
                        {formatDate(article.publishedAt)}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </section>
    </div>
  );
}