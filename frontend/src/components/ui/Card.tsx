import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export default function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-xl bg-surface-raised p-6 shadow-sm transition-shadow duration-200',
        className,
      )}
      {...props}
    />
  );
}
