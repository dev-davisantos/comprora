import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-border bg-background p-8 text-center',
        className,
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
        <Icon className="h-6 w-6" />
      </div>

      <h3 className="mt-4 text-sm font-semibold text-foreground">{title}</h3>

      {description && (
        <p className="mt-1 max-w-sm text-xs text-muted-foreground">
          {description}
        </p>
      )}

      {actionLabel && onAction && (
        <Button
          variant="outline"
          size="sm"
          onClick={onAction}
          className="mt-4 text-xs"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
