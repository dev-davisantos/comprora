import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getFriendlyErrorMessage } from '@/utils/errors';

interface ErrorStateProps {
  error?: unknown;
  fallbackMessage?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  className?: string;
}

export function ErrorState({
  error,
  fallbackMessage = 'Não foi possível carregar os dados.',
  onRetry,
  isRetrying = false,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-destructive/30 bg-background p-8 text-center',
        className,
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-foreground">
        Ocorreu um problema
      </h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        {getFriendlyErrorMessage(error, fallbackMessage)}
      </p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          disabled={isRetrying}
          className="mt-4"
        >
          {isRetrying ? 'Tentando novamente…' : 'Tentar novamente'}
        </Button>
      )}
    </div>
  );
}
