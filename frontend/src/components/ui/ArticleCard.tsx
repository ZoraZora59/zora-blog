import { CalendarDays, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import Badge from '@/components/ui/Badge';
import type { ArticleSummary } from '@/lib/api';
import { formatDate, formatNumber } from '@/lib/utils';
import { resolveMediaUrl } from '@/lib/api';
import { cn } from '@/lib/utils';

interface ArticleCardProps {
  article: ArticleSummary;
  variant?: 'featured' | 'standard';
}

export default function ArticleCard({
  article,
  variant = 'standard',
}: ArticleCardProps) {
  const featured = variant === 'featured';

  return (
    <Link
      className={cn(
        'group block overflow-hidden rounded-xl bg-surface-raised shadow-sm transition-shadow duration-200 hover:shadow-md',
        featured ? 'lg:grid lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.85fr)]' : '',
      )}
      to={`/articles/${article.slug}`}
    >
      <div className={cn('overflow-hidden', featured ? 'h-full' : '')}>
        <img
          alt={article.title}
          className={cn(
            'w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]',
            featured ? 'aspect-[16/9] h-full lg:aspect-auto' : 'aspect-[4/3]',
          )}
          loading="lazy"
          referrerPolicy="no-referrer"
          src={resolveMediaUrl(article.coverImage)}
        />
      </div>

      <div className={cn('space-y-4 p-6', featured ? 'flex flex-col justify-between' : '')}>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="category">{article.category.name}</Badge>
            {article.tags.slice(0, featured ? 2 : 1).map((tag) => (
              <Badge key={tag.id} variant="tech">
                {tag.name}
              </Badge>
            ))}
          </div>

          <div className="space-y-3">
            <h3
              className={cn(
                'text-foreground transition-colors duration-150 group-hover:text-primary',
                featured ? 'text-2xl font-heading font-bold' : 'text-lg font-semibold',
              )}
            >
              {article.title}
            </h3>
            <p className="text-sm leading-relaxed text-muted">
              {article.excerpt || '继续阅读完整内容。'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-subtle">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-4" />
            {formatDate(article.publishedAt)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Eye className="size-4" />
            {formatNumber(article.viewCount)} 阅读
          </span>
        </div>
      </div>
    </Link>
  );
}
