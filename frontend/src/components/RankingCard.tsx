import type { LucideIcon } from 'lucide-react';
import type { SpendEntry } from '@/api/types';
import { formatMoney } from '@/utils/format';
import { cn } from '@/lib/utils';

interface RankingCardProps {
  title: string;
  icon: LucideIcon;
  entries: SpendEntry[];
  emptyMessage?: string;
  className?: string;
  barColorClassName?: string;
}

export function RankingCard({
  title,
  icon: Icon,
  entries,
  emptyMessage = 'Nenhum gasto registrado.',
  className,
  barColorClassName = 'bg-primary',
}: RankingCardProps) {
  // Find maximum total to calculate proportional bar widths
  const maxSpend = entries.reduce((max, entry) => {
    const num = Number(entry.total) || 0;
    return num > max ? num : max;
  }, 0);

  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-background p-4 shadow-sm space-y-3',
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-border pb-2.5">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>

      {entries.length === 0 ? (
        <p className="py-6 text-center text-xs text-muted-foreground italic">
          {emptyMessage}
        </p>
      ) : (
        <div className="space-y-3 pt-1">
          {entries.map((entry, index) => {
            const num = Number(entry.total) || 0;
            const percentage =
              maxSpend > 0 ? Math.max(Math.round((num / maxSpend) * 100), 2) : 0;

            return (
              <div key={entry.id || `${entry.name}-${index}`} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 truncate max-w-[70%]">
                    <span className="font-mono text-[11px] font-semibold text-muted-foreground w-4 text-left">
                      {index + 1}º
                    </span>
                    <span
                      className="truncate font-medium text-foreground"
                      title={entry.name}
                    >
                      {entry.name}
                    </span>
                  </div>
                  <span className="font-semibold text-foreground whitespace-nowrap">
                    {formatMoney(entry.total)}
                  </span>
                </div>

                {/* CSS Bar */}
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      'h-full transition-all duration-300 rounded-full',
                      barColorClassName,
                    )}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

