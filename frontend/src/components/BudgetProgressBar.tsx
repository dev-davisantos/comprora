import { formatMoney } from '@/utils/format';
import type { DecimalString } from '@/api/types';
import { cn } from '@/lib/utils';

interface BudgetProgressBarProps {
  budget: DecimalString;
  realCost: DecimalString;
  className?: string;
  showLabels?: boolean;
}

export function BudgetProgressBar({
  budget,
  realCost,
  className,
  showLabels = true,
}: BudgetProgressBarProps) {
  const budgetNum = Number(budget) || 0;
  const realCostNum = Number(realCost) || 0;

  const percentage =
    budgetNum > 0 ? Math.round((realCostNum / budgetNum) * 100) : 0;
  const clampedPercentage = Math.min(percentage, 100);

  const isOverBudget = percentage > 100;
  const isNearLimit = percentage >= 85 && percentage <= 100;

  return (
    <div className={cn('w-full space-y-1.5', className)}>
      {showLabels && (
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-foreground">
            {formatMoney(realCost)}
            <span className="font-normal text-muted-foreground">
              {' '}
              de {formatMoney(budget)}
            </span>
          </span>
          <span
            className={cn(
              'font-semibold',
              isOverBudget
                ? 'text-destructive'
                : isNearLimit
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-muted-foreground',
            )}
          >
            {percentage}%
          </span>
        </div>
      )}

      {/* Progress track */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            'h-full transition-all duration-300 rounded-full',
            isOverBudget
              ? 'bg-destructive'
              : isNearLimit
                ? 'bg-amber-500'
                : 'bg-emerald-500',
          )}
          style={{ width: `${clampedPercentage}%` }}
        />
      </div>
    </div>
  );
}
