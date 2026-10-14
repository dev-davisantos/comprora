import type { BudgetIndicator } from '@/api/types';
import { formatMoney } from '@/utils/format';
import { cn } from '@/lib/utils';
import { Wallet, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface BudgetWeeklyIndicatorProps {
  indicator: BudgetIndicator;
  className?: string;
}

export function BudgetWeeklyIndicator({
  indicator,
  className,
}: BudgetWeeklyIndicatorProps) {
  const plannedNum = Number(indicator.totalPlanned) || 0;
  const realizedNum = Number(indicator.totalRealized) || 0;
  const remainingNum = Number(indicator.totalRemaining) || 0;

  const totalPercentage =
    plannedNum > 0 ? Math.round((realizedNum / plannedNum) * 100) : 0;
  const isOverBudget = remainingNum < 0 || totalPercentage > 100;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Top summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Total Planejado */}
        <div className="rounded-lg border border-border bg-background p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Planejado (Mês)</span>
            <Wallet className="h-4 w-4" />
          </div>
          <div className="mt-2 text-xl font-bold text-foreground">
            {formatMoney(indicator.totalPlanned)}
          </div>
        </div>

        {/* Total Realizado */}
        <div className="rounded-lg border border-border bg-background p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Realizado (Mês)</span>
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-2 text-xl font-bold text-foreground">
            {formatMoney(indicator.totalRealized)}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {totalPercentage}% do planejado
          </div>
        </div>

        {/* Total Restante */}
        <div
          className={cn(
            'rounded-lg border p-4 shadow-sm',
            isOverBudget
              ? 'border-destructive/30 bg-destructive/5'
              : 'border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20',
          )}
        >
          <div className="flex items-center justify-between text-xs font-medium">
            <span
              className={
                isOverBudget
                  ? 'text-destructive'
                  : 'text-emerald-700 dark:text-emerald-400'
              }
            >
              {isOverBudget ? 'Excedido (Estouro)' : 'Saldo Restante'}
            </span>
            {isOverBudget ? (
              <AlertTriangle className="h-4 w-4 text-destructive" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            )}
          </div>
          <div
            className={cn(
              'mt-2 text-xl font-bold',
              isOverBudget
                ? 'text-destructive'
                : 'text-emerald-700 dark:text-emerald-400',
            )}
          >
            {formatMoney(indicator.totalRemaining)}
          </div>
        </div>
      </div>

      {/* Weekly Breakdown Cards */}
      <div className="rounded-lg border border-border bg-background p-4 shadow-sm space-y-3">
        <h3 className="text-sm font-semibold text-foreground">
          Detalhamento Semanal
        </h3>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {indicator.weeks.map((w) => {
            const wPlanned = w.plannedValue ? Number(w.plannedValue) : null;
            const wRealized = Number(w.realizedValue) || 0;
            const wRemaining = w.remainingValue ? Number(w.remainingValue) : null;

            const wPercentage =
              wPlanned && wPlanned > 0
                ? Math.round((wRealized / wPlanned) * 100)
                : 0;
            const wClamped = Math.min(wPercentage, 100);
            const wOver = wRemaining !== null && wRemaining < 0;

            return (
              <div
                key={w.week}
                className={cn(
                  'flex flex-col justify-between rounded-md border p-3 space-y-2',
                  wOver
                    ? 'border-destructive/30 bg-destructive/5'
                    : 'border-border bg-muted/20',
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-foreground">
                    Semana {w.week}
                  </span>
                  {wPlanned !== null && (
                    <span
                      className={cn(
                        'text-[11px] font-medium',
                        wOver
                          ? 'text-destructive font-bold'
                          : 'text-muted-foreground',
                      )}
                    >
                      {wPercentage}%
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                {wPlanned !== null && wPlanned > 0 && (
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        'h-full transition-all duration-300 rounded-full',
                        wOver ? 'bg-destructive' : 'bg-emerald-500',
                      )}
                      style={{ width: `${wClamped}%` }}
                    />
                  </div>
                )}

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Planejado:</span>
                    <span className="font-medium text-foreground">
                      {w.plannedValue ? formatMoney(w.plannedValue) : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Realizado:</span>
                    <span className="font-medium text-foreground">
                      {formatMoney(w.realizedValue)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-border/50 pt-1">
                    <span className="text-muted-foreground">Saldo:</span>
                    <span
                      className={cn(
                        'font-bold',
                        wOver
                          ? 'text-destructive'
                          : wRemaining !== null
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-muted-foreground',
                      )}
                    >
                      {w.remainingValue ? formatMoney(w.remainingValue) : '—'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

