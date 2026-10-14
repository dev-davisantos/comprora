import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({
  message = 'Carregando dados…',
  className,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center text-muted-foreground',
        className,
      )}
    >
      <Loader2 className="h-6 w-6 animate-spin text-primary opacity-80" />
      {message && <p className="mt-2 text-xs">{message}</p>}
    </div>
  );
}
