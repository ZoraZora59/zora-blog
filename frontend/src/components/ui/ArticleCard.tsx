import { CalendarDays, Eye } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Badge from '@/components/ui/Badge';
import type { ArticleSummary } from '@/lib/api';
import { resolveMediaThumbnail } from '@/lib/api';
import { cn, formatDate, formatNumber } from '@/lib/utils';

interface ArticleCardProps {
  article: ArticleSummary;
  variant?: 'featured' | 'standard';
}

export default function ArticleCard({
  article,
  variant = 'standard',
}: ArticleCardProps) {
  const featured = variant === 'featured';
  const [coverRatio, setCoverRatio] = useState<number | null>(null);

  // featured 卡片的封面更大（右侧列 16:10），standard 卡片固定 16:9。
  // 宽度用一个合理上限估算，CDN 会按 DPR 返回合适的缩略图。
  const thumbSrc = featured
    ? resolveMediaThumbnail(article.coverImage, { width: 720, height: 450, quality: 82 })
    : resolveMediaThumbnail(article.coverImage, { width: 640, height: 360, quality: 80 });

  // 根据封面宽高比调节 featured 卡片左侧图片列宽：
  // - 竖图：图片列更窄，给文案更多空间
  // - 横图：图片列更宽，充分利用横向信息
  // 同时设置最小/最大边界，避免版式失衡。
  const featuredMediaWidth = useMemo(() => {
    if (!featured || !coverRatio) {
      return 0.56;
    }

    // 0.65(偏竖) -> 0.42，1.35(偏横) -> 0.62
    const minRatio = 0.65;
    const maxRatio = 1.35;
    const minWidth = 0.42;
    const maxWidth = 0.62;
    const normalized = (coverRatio - minRatio) / (maxRatio - minRatio);

    return minWidth + Math.min(1, Math.max(0, normalized)) * (maxWidth - minWidth);
  }, [coverRatio, featured]);

  const shouldContainExtremeCover =
    featured && coverRatio !== null && (coverRatio < 0.65 || coverRatio > 1.35);

  return (
    <Link
      className={cn(
        'group flex w-full flex-col overflow-hidden rounded-xl bg-surface-raised shadow-sm transition-shadow duration-200 hover:shadow-md',
        featured ? 'h-full lg:grid' : 'h-full',
      )}
      style={
        featured
          ? {
              gridTemplateColumns: `minmax(0, ${featuredMediaWidth}fr) minmax(280px, ${1 - featuredMediaWidth}fr)`,
            }
          : undefined
      }
      to={`/articles/${article.slug}`}
    >
      {/* 封面：容器强制纵横比，图片 absolute 填满 + object-cover，彻底避免被原图比例撑开 */}
      <div
        className={cn(
          'relative w-full shrink-0 overflow-hidden bg-surface-sunken',
          featured
            ? 'aspect-[16/9] lg:aspect-auto lg:h-full lg:min-h-[280px]'
            : 'aspect-[16/9]',
        )}
      >
        {thumbSrc ? (
          <img
            alt={article.title}
            className={cn(
              'absolute inset-0 h-full w-full transition-transform duration-300 group-hover:scale-[1.03]',
              shouldContainExtremeCover ? 'object-contain p-2' : 'object-cover',
            )}
            decoding="async"
            loading="lazy"
            onLoad={(event) => {
              const { naturalWidth, naturalHeight } = event.currentTarget;

              if (naturalWidth > 0 && naturalHeight > 0) {
                setCoverRatio(naturalWidth / naturalHeight);
              }
            }}
            referrerPolicy="no-referrer"
            src={thumbSrc}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-surface-sunken to-surface-raised text-xs text-subtle">
            暂无封面
          </div>
        )}
      </div>

      {/* 正文：flex 占满剩余高度，标题/摘要 line-clamp，保证卡片整体高度一致 */}
      <div
        className={cn(
          'flex min-w-0 flex-1 flex-col gap-4 p-6',
          featured ? 'justify-between' : '',
        )}
      >
        <div className="space-y-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2 overflow-hidden">
            <Badge variant="category">{article.category.name}</Badge>
            {article.tags.slice(0, featured ? 2 : 1).map((tag) => (
              <Badge key={tag.id} variant="tech">
                {tag.name}
              </Badge>
            ))}
          </div>

          <h3
            className={cn(
              'text-foreground transition-colors duration-150 group-hover:text-primary',
              featured
                ? 'line-clamp-2 text-2xl font-heading font-bold leading-snug'
                : 'line-clamp-2 text-lg font-semibold leading-snug',
            )}
          >
            {article.title}
          </h3>
          <p
            className={cn(
              'text-sm leading-relaxed text-muted',
              featured ? 'line-clamp-3' : 'line-clamp-2',
            )}
          >
            {article.excerpt || '继续阅读完整内容。'}
          </p>
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
