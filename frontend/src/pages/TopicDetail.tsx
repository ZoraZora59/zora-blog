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

  // 计算布局：根据文章数量决定混排方式
  const articles = topic.articles;
  const articleCount = articles.length;

  return (
    <div className="bg-surface">
      {/* Hero Section - 更强的视觉冲击力 */}
      <section className="relative overflow-hidden border-b border-border/60 bg-surface">
        {topic.coverImage ? (
          <div className="absolute inset-0">
            <img
              alt={topic.title}
              className="size-full object-cover opacity-30"
              loading="eager"
              referrerPolicy="no-referrer"
              src={resolveMediaUrl(topic.coverImage)}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-surface/60 via-surface/80 to-surface" />
          </div>
        ) : null}

        <div className="relative mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-24 lg:px-16 lg:py-32">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
            initial={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <Link
              className="inline-flex items-center gap-2 rounded-full bg-surface-raised/80 px-4 py-2 text-sm font-medium text-muted shadow-sm backdrop-blur-sm transition-colors duration-150 hover:text-foreground"
              to="/topics"
            >
              <ArrowLeft className="size-4" />
              返回专题列表
            </Link>

            <div className="flex flex-wrap items-center gap-4">
              <Badge className="gap-2 px-4 py-2 text-base" variant="category">
                <Sparkles className="size-4" />
                Topic
              </Badge>
              <span className="rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                {topic.articleCount} 篇文章
              </span>
            </div>

            <h1 className="max-w-4xl text-4xl font-heading font-bold leading-tight text-foreground md:text-5xl lg:text-6xl xl:text-7xl">
              {topic.title}
            </h1>

            {topic.description ? (
              <p className="max-w-3xl text-lg leading-relaxed text-muted md:text-xl lg:text-2xl">
                {topic.description}
              </p>
            ) : null}
          </motion.div>
        </div>
      </section>

      {/* Articles Grid - 不规则混排布局 */}
      <section className="mx-auto max-w-6xl px-4 py-12 md:px-8 lg:px-16 lg:py-20">
        {articleCount === 0 ? (
          <Card className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">暂无关联文章</h2>
            <p className="text-sm text-muted">该专题下还没有添加文章。</p>
          </Card>
        ) : articleCount === 1 ? (
          // 单篇文章：全宽大卡片
          <motion.div
            animate={{ opacity: 1 }}
            initial={{ opacity: 0 }}
          >
            <ArticleCard article={articles[0]} index={0} size="hero" />
          </motion.div>
        ) : articleCount === 2 ? (
          // 两篇文章：一大一小
          <motion.div
            animate={{ opacity: 1 }}
            className="grid gap-6 lg:grid-cols-2"
            initial={{ opacity: 0 }}
          >
            <ArticleCard article={articles[0]} index={0} size="large" />
            <ArticleCard article={articles[1]} index={1} size="medium" />
          </motion.div>
        ) : articleCount === 3 ? (
          // 三篇文章：左侧大卡片 + 右侧两个小卡片
          <motion.div
            animate={{ opacity: 1 }}
            className="grid gap-6 lg:grid-cols-2"
            initial={{ opacity: 0 }}
          >
            <ArticleCard article={articles[0]} index={0} size="large" />
            <div className="grid gap-6">
              <ArticleCard article={articles[1]} index={1} size="small" />
              <ArticleCard article={articles[2]} index={2} size="small" />
            </div>
          </motion.div>
        ) : articleCount === 4 ? (
          // 四篇文章：第一篇大卡片 + 三列网格
          <motion.div
            animate={{ opacity: 1 }}
            className="space-y-6"
            initial={{ opacity: 0 }}
          >
            <ArticleCard article={articles[0]} index={0} size="hero" />
            <div className="grid gap-6 md:grid-cols-3">
              {articles.slice(1).map((article, idx) => (
                <ArticleCard article={article} index={idx + 1} key={article.id} size="small" />
              ))}
            </div>
          </motion.div>
        ) : (
          // 五篇及以上：不规则混排
          <motion.div
            animate={{ opacity: 1 }}
            className="space-y-6"
            initial={{ opacity: 0 }}
          >
            {/* 第一行：大卡片 + 两个小卡片 */}
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <ArticleCard article={articles[0]} index={0} size="large" />
              </div>
              {articles[1] && <ArticleCard article={articles[1]} index={1} size="small" />}
            </div>
            {/* 第二行：三列网格 */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {articles.slice(2, 5).map((article, idx) => (
                <ArticleCard article={article} index={idx + 2} key={article.id} size="medium" />
              ))}
            </div>
            {/* 剩余文章：三列网格 */}
            {articles.length > 5 && (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {articles.slice(5).map((article, idx) => (
                  <ArticleCard article={article} index={idx + 5} key={article.id} size="small" />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </section>
    </div>
  );
}

// 文章卡片组件
interface ArticleCardProps {
  article: {
    id: number;
    title: string;
    slug: string;
    excerpt: string | null;
    coverImage: string | null;
    publishedAt: string | null;
    viewCount: number;
    category: { id: number; name: string; slug: string };
  };
  index: number;
  size: 'hero' | 'large' | 'medium' | 'small';
}

function ArticleCard({ article, index, size }: ArticleCardProps) {
  const sizeClasses = {
    hero: {
      wrapper: '',
      image: 'aspect-[21/9]',
      title: 'text-2xl md:text-3xl lg:text-4xl',
      excerpt: 'text-base md:text-lg line-clamp-3',
      padding: 'p-6 md:p-8',
    },
    large: {
      wrapper: '',
      image: 'aspect-[16/9]',
      title: 'text-xl md:text-2xl',
      excerpt: 'text-base line-clamp-2',
      padding: 'p-5 md:p-6',
    },
    medium: {
      wrapper: '',
      image: 'aspect-[16/10]',
      title: 'text-lg md:text-xl',
      excerpt: 'text-sm line-clamp-2',
      padding: 'p-5',
    },
    small: {
      wrapper: '',
      image: 'aspect-[4/3]',
      title: 'text-base md:text-lg',
      excerpt: 'text-sm line-clamp-2',
      padding: 'p-4',
    },
  };

  const classes = sizeClasses[size];

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3, delay: index * 0.1, ease: 'easeOut' }}
    >
      <Link
        className="group block h-full overflow-hidden rounded-xl bg-surface-raised shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-primary/5"
        to={`/articles/${article.slug}`}
      >
        {article.coverImage ? (
          <div className={classes.image}>
            <img
              alt={article.title}
              className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              referrerPolicy="no-referrer"
              src={resolveMediaUrl(article.coverImage)}
            />
          </div>
        ) : (
          <div className={`bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 ${classes.image}`} />
        )}
        <div className={classes.padding}>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge variant="category">{article.category.name}</Badge>
            <span className="inline-flex items-center gap-1 text-xs text-subtle">
              <Eye className="size-3.5" />
              {formatNumber(article.viewCount)}
            </span>
          </div>
          <h2 className={`font-semibold text-foreground transition-colors group-hover:text-primary ${classes.title}`}>
            {article.title}
          </h2>
          {article.excerpt ? (
            <p className={`mt-2 leading-relaxed text-muted ${classes.excerpt}`}>
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
}