import { ArrowRight, Compass, Search } from 'lucide-react';
import { motion } from 'motion/react';
import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import ArticleCard from '@/components/ui/ArticleCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useArticles } from '@/hooks/useArticles';
import { useCategories } from '@/hooks/useCategories';
import { cn } from '@/lib/utils';

const heroImages = [
  'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=1200&q=80',
];

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategory = searchParams.get('category') ?? '';
  const { categories } = useCategories();
  const {
    articles,
    error,
    hasMore,
    isLoading,
    isLoadingMore,
    loadMore,
    pagination,
  } = useArticles({
    category: selectedCategory || undefined,
    limit: 7,
  });

  const featuredArticle = articles[0] ?? null;
  const remainingArticles = useMemo(() => articles.slice(1), [articles]);

  const handleCategoryChange = (slug: string) => {
    const next = new URLSearchParams(searchParams);

    if (slug) {
      next.set('category', slug);
    } else {
      next.delete('category');
    }

    setSearchParams(next);
  };

  return (
    <div className="bg-surface">
      <section className="border-b border-border/60 bg-surface">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 md:px-8 md:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(300px,420px)] lg:px-16 lg:py-20">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="flex flex-col justify-between gap-8"
          >
            <div className="space-y-6">
              <Badge className="w-fit" variant="category">
                Tech-Outdoor Journal
              </Badge>
              <div className="space-y-4">
                <h1 className="max-w-3xl text-5xl font-heading font-bold leading-none tracking-tight text-foreground md:text-6xl lg:text-7xl">
                  Developer by day, <br />
                  adventurer by night
                </h1>
                <p className="max-w-xl text-base leading-relaxed text-muted md:text-lg">
                  记录工程现场、营地清晨和装备实战，把技术的秩序感带进山野。
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <a
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-primary-light"
                href="#latest-dispatch"
              >
                浏览最新文章
                <ArrowRight className="size-4" />
              </a>
              <Link
                className="inline-flex items-center justify-center gap-2 rounded-full bg-surface-sunken px-6 py-2.5 text-sm font-medium text-foreground transition-colors duration-150 hover:bg-border"
                to="/topics"
              >
                <Compass className="size-4" />
                查看专题
              </Link>
            </div>
          </motion.div>

          <motion.div
            animate={{ opacity: 1, x: 0 }}
            initial={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.35, ease: 'easeOut', delay: 0.08 }}
            className="grid gap-5"
          >
            <div className="overflow-hidden rounded-xl bg-surface-raised shadow-lg">
              <img
                alt="Mountain workspace"
                className="aspect-[4/4.6] w-full object-cover"
                loading="eager"
                referrerPolicy="no-referrer"
                src={heroImages[0]}
              />
            </div>
            <div className="hidden grid-cols-2 gap-5 md:grid">
              {heroImages.slice(1).map((image) => (
                <div className="overflow-hidden rounded-xl bg-surface-raised shadow-sm" key={image}>
                  <img
                    alt="Outdoor snapshot"
                    className="aspect-[16/10] w-full object-cover"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    src={image}
                  />
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-8 lg:px-16">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-subtle">Explorations</p>
            <h2 className="text-2xl font-heading font-bold text-foreground">按分类快速筛选</h2>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              className={cn(
                'rounded-full px-4 py-2 text-sm font-medium transition-colors duration-150',
                !selectedCategory
                  ? 'bg-primary text-white'
                  : 'bg-surface-raised text-muted hover:bg-surface-sunken hover:text-foreground',
              )}
              onClick={() => handleCategoryChange('')}
              type="button"
            >
              All Dispatches
            </button>
            {categories.map((category) => (
              <button
                className={cn(
                  'rounded-full px-4 py-2 text-sm font-medium transition-colors duration-150',
                  selectedCategory === category.slug
                    ? 'bg-secondary text-white'
                    : 'bg-surface-raised text-muted hover:bg-surface-sunken hover:text-foreground',
                )}
                key={category.id}
                onClick={() => handleCategoryChange(category.slug)}
                type="button"
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 md:px-8 lg:px-16 lg:pb-20" id="latest-dispatch">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-subtle">Latest Dispatch</p>
            <h2 className="text-2xl font-heading font-bold text-foreground">
              {selectedCategory
                ? `${categories.find((item) => item.slug === selectedCategory)?.name ?? '分类'}更新中`
                : '最新文章流'}
            </h2>
          </div>

          <Link
            className="hidden items-center gap-2 text-sm font-medium text-muted transition-colors duration-150 hover:text-foreground md:inline-flex"
            to="/search"
          >
            <Search className="size-4" />
            搜索文章
          </Link>
        </div>

        {error ? (
          <Card className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">文章暂时不可用</h3>
            <p className="text-sm text-muted">{error}</p>
          </Card>
        ) : null}

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:gap-8">
            <div className="h-[440px] animate-pulse rounded-xl bg-surface-raised" />
            <div className="grid gap-6 md:grid-cols-1">
              <div className="h-[210px] animate-pulse rounded-xl bg-surface-raised" />
              <div className="h-[210px] animate-pulse rounded-xl bg-surface-raised" />
            </div>
          </div>
        ) : null}

        {!isLoading && featuredArticle ? (
          <div className="space-y-8">
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <ArticleCard article={featuredArticle} variant="featured" />
            </motion.div>

            <motion.div
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8"
              initial={{ opacity: 0 }}
              transition={{ staggerChildren: 0.08 }}
            >
              {remainingArticles.map((article) => (
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  initial={{ opacity: 0, y: 16 }}
                  key={article.id}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                  <ArticleCard article={article} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        ) : null}

        {!isLoading && !featuredArticle && !error ? (
          <Card className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">还没有文章</h3>
            <p className="text-sm text-muted">当前分类下暂时没有可展示的内容。</p>
          </Card>
        ) : null}

        {featuredArticle && pagination ? (
          <div className="mt-10 flex items-center justify-center">
            {hasMore ? (
              <Button onClick={loadMore} variant="secondary">
                {isLoadingMore ? '正在加载更多' : '加载更多文章'}
              </Button>
            ) : (
              <span className="rounded-full bg-surface-raised px-5 py-2 text-sm text-muted shadow-sm">
                已展示全部 {pagination.total} 篇文章
              </span>
            )}
          </div>
        ) : null}
      </section>
    </div>
  );
}
