import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant =
  | 'category'
  | 'tech'
  | 'published'
  | 'draft'
  | 'pending'
  | 'neutral';

const variantClasses: Record<BadgeVariant, string> = {
  category: 'bg-secondary/10 text-secondary',
  tech: 'bg-primary/10 text-primary',
  published: 'bg-success/10 text-success',
  draft: 'bg-warning/10 text-warning',
  pending: 'bg-accent/10 text-accent',
  neutral: 'bg-surface-sunken text-muted',
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export default function Badge({
  className,
  variant = 'neutral',
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium',
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
