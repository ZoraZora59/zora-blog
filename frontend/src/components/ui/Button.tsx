import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'icon';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-white hover:bg-primary-light focus-visible:ring-primary/20',
  secondary:
    'bg-surface-sunken text-foreground hover:bg-border focus-visible:ring-primary/20',
  ghost:
    'bg-transparent text-muted hover:bg-surface-sunken hover:text-foreground focus-visible:ring-primary/20',
  danger:
    'bg-error text-white hover:opacity-90 focus-visible:ring-error/20',
  icon:
    'bg-transparent text-muted hover:bg-surface-sunken hover:text-foreground focus-visible:ring-primary/20',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-4 py-1.5 text-xs',
  md: 'px-6 py-2.5 text-sm',
  lg: 'px-8 py-3 text-base',
};

export default function Button({
  className,
  variant = 'primary',
  size = 'md',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60',
        variantClasses[variant],
        variant === 'icon' ? 'size-10 p-0' : sizeClasses[size],
        className,
      )}
      type={type}
      {...props}
    />
  );
}
