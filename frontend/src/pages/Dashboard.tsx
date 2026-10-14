import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  PiggyBank,
  Wallet,
  AlertTriangle,
  CheckCircle2,
  Layers,
  FolderKanban,
  Building2,
  Calendar,
} from 'lucide-react';

import { dashboardApi } from '@/api/endpoints/dashboard';
import { MonthPicker } from '@/components/MonthPicker';
import { BudgetWeeklyIndicator } from '@/components/BudgetWeeklyIndicator';
import { RankingCard } from '@/components/RankingCard';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { formatMoney } from '@/utils/format';
import { cn } from '@/lib/utils';

function formatMonthDisplay(isoOrMonth: string): string {
  if (!isoOrMonth) return '';
  const monthPart = isoOrMonth.slice(0, 7);
  const [year, month] = monthPart.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

export function Dashboard() {
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  });

  const {
    data: summary,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['dashboard', selectedMonth],
    queryFn: () => dashboardApi.getSummary(selectedMonth),
    enabled: !!selectedMonth,
  });

  const budget = summary?.budget;
  const isBudgetOver = budget ? Number(budget.totalRemaining) < 0 : false;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Visão geral de gastos, savings e controle de budget.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            Mês de Referência:
          </span>
          <div className="w-48">
            <MonthPicker
              value={selectedMonth}
              onChange={(val) => setSelectedMonth(val || selectedMonth)}
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <LoadingState message="Carregando indicadores do dashboard…" />
      ) : isError ? (
        <ErrorState
          error={error}
          fallbackMessage="Não foi possível carregar os indicadores do dashboard."
          onRetry={() => refetch()}
          isRetrying={isFetching}
        />
      ) : !summary ? (
        <EmptyState
          icon={Calendar}
          title="Sem dados para este mês"
          description="Não há indicadores disponíveis para o mês selecionado."
        />
      ) : (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Gasto Total */}
            <div className="rounded-lg border border-border bg-background p-4 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                <span>Gasto Total Realizado</span>
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div className="text-2xl font-bold text-foreground">
                {formatMoney(summary.totalSpend)}
              </div>
              <div className="text-xs text-muted-foreground capitalize">
                {formatMonthDisplay(selectedMonth)}
              </div>
            </div>

            {/* Total Savings */}
            <div className="rounded-lg border border-border bg-background p-4 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                <span>Economia (Savings)</span>
                <PiggyBank className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatMoney(summary.totalSavings)}
              </div>
              <div className="text-xs text-muted-foreground">
                Desconto entre valor inicial e final
              </div>
            </div>

            {/* Budget Planejado */}
            <div className="rounded-lg border border-border bg-background p-4 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                <span>Budget Planejado</span>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold text-foreground">
                {budget ? formatMoney(budget.totalPlanned) : '—'}
              </div>
              <div className="text-xs text-muted-foreground">
                {budget ? 'Metas cadastradas' : 'Sem metas no mês'}
              </div>
            </div>

            {/* Saldo Restante / Alerta */}
            <div
              className={cn(
                'rounded-lg border p-4 shadow-sm space-y-2',
                budget
                  ? isBudgetOver
                    ? 'border-destructive/30 bg-destructive/5'
                    : 'border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20'
                  : 'border-border bg-background',
              )}
            >
              <div className="flex items-center justify-between text-xs font-medium">
                <span
                  className={
                    budget
                      ? isBudgetOver
                        ? 'text-destructive'
                        : 'text-emerald-700 dark:text-emerald-400'
                      : 'text-muted-foreground'
                  }
                >
                  {budget
                    ? isBudgetOver
                      ? 'Budget Excedido'
                      : 'Saldo de Budget'
                    : 'Saldo de Budget'}
                </span>
                {budget ? (
                  isBudgetOver ? (
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  )
                ) : null}
              </div>
              <div
                className={cn(
                  'text-2xl font-bold',
                  budget
                    ? isBudgetOver
                      ? 'text-destructive'
                      : 'text-emerald-700 dark:text-emerald-400'
                    : 'text-foreground',
                )}
              >
                {budget ? formatMoney(budget.totalRemaining) : '—'}
              </div>
              <div className="text-xs text-muted-foreground">
                {budget
                  ? isBudgetOver
                    ? 'Acima do limite planejado'
                    : 'Dentro do limite planejado'
                  : 'Nenhum budget definido'}
              </div>
            </div>
          </div>

          {/* Weekly Budget Indicator */}
          {budget && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="capitalize">
                  Indicador Semanal de {formatMonthDisplay(selectedMonth)}
                </span>
              </div>
              <BudgetWeeklyIndicator indicator={budget} />
            </div>
          )}

          {/* Rankings Section (pure CSS bars) */}
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">
              Rankings de Gastos ({formatMonthDisplay(selectedMonth)})
            </h2>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {/* Gastos por Segmento */}
              <RankingCard
                title="Gastos por Segmento"
                icon={Layers}
                entries={summary.spendBySegment}
                emptyMessage="Nenhum gasto por segmento neste mês."
                barColorClassName="bg-blue-600"
              />

              {/* Gastos por Projeto */}
              <RankingCard
                title="Gastos por Projeto"
                icon={FolderKanban}
                entries={summary.spendByProject}
                emptyMessage="Nenhum gasto por projeto neste mês."
                barColorClassName="bg-purple-600"
              />

              {/* Gastos por Fornecedor */}
              <RankingCard
                title="Gastos por Fornecedor"
                icon={Building2}
                entries={summary.spendBySupplier}
                emptyMessage="Nenhum gasto por fornecedor neste mês."
                barColorClassName="bg-emerald-600"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
