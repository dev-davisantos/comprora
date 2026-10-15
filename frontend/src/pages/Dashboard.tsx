import { useState } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  PiggyBank,
  Layers,
  FolderKanban,
  Building2,
  Calendar,
  X,
} from 'lucide-react';

import { dashboardApi } from '@/api/endpoints/dashboard';
import { budgetsApi } from '@/api/endpoints/budgets';
import { purchaseOrdersApi } from '@/api/endpoints/purchaseOrders';
import { segmentsApi } from '@/api/endpoints/segments';
import type { Budget, PurchaseOrder, SpendEntry } from '@/api/types';
import { MonthYearPicker } from '@/components/MonthYearPicker';
import { BudgetWeeklyIndicator } from '@/components/BudgetWeeklyIndicator';
import { RankingCard } from '@/components/RankingCard';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatMoney } from '@/utils/format';
import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  type TooltipContentProps,
  XAxis,
  YAxis,
} from 'recharts';

interface MonthlyBudgetUsageEntry {
  month: string;
  monthKey: string;
  percentage: number | null;
  spendCents: number;
  budgetCents: number | null;
  budgetReferenceMonth: string | null;
}

const monthLabels = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

const compactCurrencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
});

function nonCancelledOrders(orders: PurchaseOrder[]): PurchaseOrder[] {
  return orders.filter((order) => order.status !== 'CANCELLED');
}

function sumOrderValue(
  orders: PurchaseOrder[],
  selectValue: (order: PurchaseOrder) => string,
): string {
  const totalCents = nonCancelledOrders(orders).reduce(
    (total, order) => total + Math.round(Number(selectValue(order)) * 100),
    0,
  );
  return (totalCents / 100).toFixed(2);
}

function sumOrderSavingsCents(orders: PurchaseOrder[]): number {
  return nonCancelledOrders(orders).reduce(
    (total, order) =>
      total +
      Math.round(Number(order.initialValue) * 100) -
      Math.round(Number(order.finalValue) * 100),
    0,
  );
}

function groupOrderSpend(
  orders: PurchaseOrder[],
  getEntries: (order: PurchaseOrder) => Array<{ id: number; name: string }>,
): SpendEntry[] {
  const totals = new Map<number, { id: number; name: string; cents: number }>();

  for (const order of nonCancelledOrders(orders)) {
    const cents = Math.round(Number(order.finalValue) * 100);
    for (const entry of getEntries(order)) {
      const current = totals.get(entry.id);
      totals.set(entry.id, {
        ...entry,
        cents: (current?.cents ?? 0) + cents,
      });
    }
  }

  return [...totals.values()]
    .map(({ id, name, cents }) => ({ id, name, total: (cents / 100).toFixed(2) }))
    .sort((left, right) => Number(right.total) - Number(left.total));
}

function groupMonthlyBudgets(budgets: Budget[]): Map<string, number> {
  const totals = new Map<string, number>();

  for (const budget of budgets) {
    const month = budget.monthYear.slice(0, 7);
    const cents =
      (totals.get(month) ?? 0) + Math.round(Number(budget.plannedValue) * 100);
    totals.set(month, cents);
  }

  return totals;
}

function isMonthlyBudgetUsageEntry(
  value: unknown,
): value is MonthlyBudgetUsageEntry {
  return (
    typeof value === 'object' &&
    value !== null &&
    'month' in value &&
    typeof value.month === 'string' &&
    'monthKey' in value &&
    typeof value.monthKey === 'string' &&
    'percentage' in value &&
    (typeof value.percentage === 'number' || value.percentage === null) &&
    'spendCents' in value &&
    typeof value.spendCents === 'number' &&
    'budgetCents' in value &&
    (typeof value.budgetCents === 'number' || value.budgetCents === null) &&
    'budgetReferenceMonth' in value &&
    (typeof value.budgetReferenceMonth === 'string' ||
      value.budgetReferenceMonth === null)
  );
}

function BudgetUsageTooltip({
  active,
  payload,
}: TooltipContentProps) {
  const entry = payload[0]?.payload;
  if (!active || !isMonthlyBudgetUsageEntry(entry)) return null;

  return (
    <div className="rounded-md border border-border bg-background p-3 text-xs shadow-md">
      <p className="mb-2 font-medium">
        {formatMonthDisplay(entry.monthKey)}
      </p>
      <p>{`Gasto: ${formatMoney((entry.spendCents / 100).toFixed(2))}`}</p>
      {entry.budgetCents === null ? (
        <p className="mt-1 text-muted-foreground">
          Sem budget de referência
        </p>
      ) : (
        <>
          <p>{`Budget: ${formatMoney((entry.budgetCents / 100).toFixed(2))}`}</p>
          {entry.budgetReferenceMonth !== entry.monthKey && (
            <p className="text-muted-foreground">
              {`Referência de ${formatMonthDisplay(entry.budgetReferenceMonth ?? '')}`}
            </p>
          )}
          <p className="mt-1 font-medium">
            {`Consumo: ${entry.percentage?.toFixed(1)}%`}
          </p>
        </>
      )}
    </div>
  );
}

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
  const [selectedSegment, setSelectedSegment] = useState('ALL');

  const selectedYear = selectedMonth.slice(0, 4);
  const yearMonths = Array.from({ length: 12 }, (_, index) => {
    return `${selectedYear}-${String(index + 1).padStart(2, '0')}`;
  });
  const monthlyQueries = useQueries({
    queries: yearMonths.map((month) => ({
      queryKey: ['purchaseOrders', { month }],
      queryFn: () => purchaseOrdersApi.list({ month }),
    })),
  });
  const {
    data: dashboardSummary,
    isPending: isBudgetLoading,
    isError: isBudgetError,
    error: budgetError,
    refetch: refetchBudget,
    isFetching: isBudgetFetching,
  } = useQuery({
    queryKey: ['dashboard', selectedMonth],
    queryFn: () => dashboardApi.getSummary(selectedMonth),
  });
  const {
    data: budgetHistory = [],
    isPending: isBudgetHistoryLoading,
    isError: isBudgetHistoryError,
    error: budgetHistoryError,
    refetch: refetchBudgetHistory,
    isFetching: isBudgetHistoryFetching,
  } = useQuery({
    queryKey: ['budgets', 'all-history'],
    queryFn: () => budgetsApi.list(),
  });
  const {
    data: segments = [],
    isLoading: isLoadingSegments,
    isError: isSegmentsError,
    error: segmentsError,
    refetch: refetchSegments,
    isFetching: isFetchingSegments,
  } = useQuery({
    queryKey: ['segments'],
    queryFn: segmentsApi.list,
  });

  const selectedMonthIndex = Number(selectedMonth.slice(5, 7)) - 1;
  const selectedMonthOrders =
    monthlyQueries[selectedMonthIndex]?.data ?? [];
  const isLoading =
    isBudgetLoading || monthlyQueries.some((query) => query.isPending);
  const isError =
    isBudgetError || monthlyQueries.some((query) => query.isError);
  const error =
    budgetError ??
    monthlyQueries.find((query) => query.isError)?.error;
  const isFetching =
    isBudgetFetching || monthlyQueries.some((query) => query.isFetching);
  const refetch = () => {
    void Promise.all([
      refetchBudget(),
      refetchBudgetHistory(),
      ...monthlyQueries.map((query) => query.refetch()),
    ]);
  };
  const annualOrders = monthlyQueries.flatMap((query) => query.data ?? []);
  const annualSpend = sumOrderValue(annualOrders, (order) => order.finalValue);
  const annualSavings = sumOrderSavingsCents(annualOrders);
  const monthlySpend = sumOrderValue(
    selectedMonthOrders,
    (order) => order.finalValue,
  );
  const monthlySavings = sumOrderSavingsCents(selectedMonthOrders);
  const monthlySpendData = monthlyQueries.map((query, index) => {
    const monthOrders = query.data ?? [];
    const filteredOrders =
      selectedSegment === 'ALL'
        ? monthOrders
        : monthOrders.filter(
            (order) => String(order.segment.id) === selectedSegment,
          );

    return {
      month: monthLabels[index],
      spend: Number(
        sumOrderValue(filteredOrders, (order) => order.finalValue),
      ),
    };
  });
  const monthlySavingsData = monthlyQueries.map((query, index) => ({
    month: monthLabels[index],
    savings: sumOrderSavingsCents(query.data ?? []) / 100,
  }));
  const monthlyBudgetTotals = groupMonthlyBudgets(budgetHistory);
  const firstYearMonth = yearMonths[0];
  const previousYearBudgets = [...monthlyBudgetTotals.entries()]
    .filter(([month, cents]) => month < firstYearMonth && cents > 0)
    .sort(([left], [right]) => left.localeCompare(right));
  let lastKnownBudgetCents = previousYearBudgets.at(-1)?.[1];
  let lastKnownBudgetMonth = previousYearBudgets.at(-1)?.[0] ?? null;
  const monthlyBudgetUsageData = monthlyQueries.map((query, index) => {
    const month = yearMonths[index];
    const monthBudgetCents = monthlyBudgetTotals.get(month);
    if (monthBudgetCents && monthBudgetCents > 0) {
      lastKnownBudgetCents = monthBudgetCents;
      lastKnownBudgetMonth = month;
    }

    const budgetCents =
      monthBudgetCents && monthBudgetCents > 0
        ? monthBudgetCents
        : lastKnownBudgetCents;
    const spendCents = Math.round(
      Number(
        sumOrderValue(query.data ?? [], (order) => order.finalValue),
      ) * 100,
    );

    return {
      month: monthLabels[index],
      monthKey: month,
      percentage:
        budgetCents && budgetCents > 0
          ? (spendCents / budgetCents) * 100
          : null,
      spendCents,
      budgetCents: budgetCents ?? null,
      budgetReferenceMonth: budgetCents ? lastKnownBudgetMonth : null,
    };
  });
  const budget = dashboardSummary?.budget;
  const monthlySpendBySegment = groupOrderSpend(selectedMonthOrders, (order) => [
    { id: order.segment.id, name: order.segment.name },
  ]);
  const monthlySpendBySupplier = groupOrderSpend(selectedMonthOrders, (order) => [
    { id: order.supplier.id, name: order.supplier.displayName },
  ]);

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
          <div className="w-64">
            <MonthYearPicker
              value={selectedMonth}
              onChange={setSelectedMonth}
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
      ) : !dashboardSummary ? (
        <EmptyState
          icon={Calendar}
          title="Sem dados para este mês"
          description="Não há indicadores disponíveis para o mês selecionado."
        />
      ) : (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Annual spend */}
            <div className="rounded-lg border border-border bg-background p-4 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                <span>Gasto total no ano</span>
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div className="text-2xl font-bold text-foreground">
                {formatMoney(annualSpend)}
              </div>
              <div className="text-xs text-muted-foreground capitalize">
                Ano {selectedYear}
              </div>
            </div>

            {/* Annual savings */}
            <div className="rounded-lg border border-border bg-background p-4 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                <span>Economia total no ano</span>
                <PiggyBank className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatMoney((annualSavings / 100).toFixed(2))}
              </div>
              <div className="text-xs text-muted-foreground">
                Desconto acumulado em {selectedYear}
              </div>
            </div>

            {/* Selected month spend */}
            <div className="rounded-lg border border-border bg-background p-4 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                <span>Gasto total no mês</span>
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div className="text-2xl font-bold text-foreground">
                {formatMoney(monthlySpend)}
              </div>
              <div className="text-xs text-muted-foreground capitalize">
                {formatMonthDisplay(selectedMonth)}
              </div>
            </div>

            {/* Selected month savings */}
            <div className="rounded-lg border border-border bg-background p-4 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                <span>Economia total no mês</span>
                <PiggyBank className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatMoney((monthlySavings / 100).toFixed(2))}
              </div>
              <div className="text-xs text-muted-foreground">
                Desconto entre valor inicial e final
              </div>
            </div>
          </div>

          {/* Annual monthly spend chart */}
          <section className="space-y-4 rounded-lg border border-border bg-background p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Gastos mensais — {selectedYear}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Evolução do valor gasto ao longo do ano.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Select
                  value={selectedSegment}
                  onValueChange={setSelectedSegment}
                  disabled={isLoadingSegments || isSegmentsError}
                >
                  <SelectTrigger
                    className="w-56"
                    aria-label="Filtrar gastos por segmento"
                  >
                    <SelectValue placeholder="Todos os segmentos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos os segmentos</SelectItem>
                    {segments.map((segment) => (
                      <SelectItem key={segment.id} value={String(segment.id)}>
                        {segment.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Remover filtro de segmento"
                  title="Remover filtro de segmento"
                  disabled={selectedSegment === 'ALL'}
                  onClick={() => setSelectedSegment('ALL')}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {isSegmentsError && (
              <ErrorState
                error={segmentsError}
                fallbackMessage="Não foi possível carregar os segmentos para o filtro."
                onRetry={() => void refetchSegments()}
                isRetrying={isFetchingSegments}
                className="p-4"
              />
            )}

            <div className="h-[18rem] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={monthlySpendData}
                  margin={{ top: 8, right: 16, left: 8, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" interval={0} />
                  <YAxis
                    width={76}
                    tickFormatter={(value: number) =>
                      compactCurrencyFormatter.format(value)
                    }
                  />
                  <Tooltip
                    formatter={(value) => [
                      formatMoney(String(Number(value ?? 0))),
                      'Gasto',
                    ]}
                    labelFormatter={(label) => `Mês: ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="spend"
                    name="Gasto"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Annual monthly savings chart */}
            <section className="space-y-4 rounded-lg border border-border bg-background p-4 shadow-sm">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Economia mensal — {selectedYear}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Evolução da economia entre o valor inicial e o valor final dos
                  pedidos.
                </p>
              </div>

              <div className="h-[12rem] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={monthlySavingsData}
                    margin={{ top: 8, right: 16, left: 8, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis
                      width={76}
                      tickFormatter={(value: number) =>
                        compactCurrencyFormatter.format(value)
                      }
                    />
                    <Tooltip
                      formatter={(value) => [
                        formatMoney(String(Number(value ?? 0))),
                        'Economia',
                      ]}
                      labelFormatter={(label) => `Mês: ${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="savings"
                      name="Economia"
                      stroke="#059669"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Monthly budget usage chart */}
            <section className="space-y-4 rounded-lg border border-border bg-background p-4 shadow-sm">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Budget mensal consumido — {selectedYear}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Percentual gasto do budget mensal. Meses sem budget próprio
                  usam a referência anterior mais recente.
                </p>
              </div>

              {isBudgetHistoryError ? (
                <ErrorState
                  error={budgetHistoryError}
                  fallbackMessage="Não foi possível carregar os budgets para o gráfico."
                  onRetry={() => void refetchBudgetHistory()}
                  isRetrying={isBudgetHistoryFetching}
                  className="p-4"
                />
              ) : isBudgetHistoryLoading ? (
                <LoadingState
                  message="Carregando histórico de budgets…"
                  className="h-[12rem]"
                />
              ) : (
                <>
                  <div className="h-[12rem] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={monthlyBudgetUsageData}
                        margin={{ top: 12, right: 8, left: 0, bottom: 8 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="month"
                          interval={0}
                          angle={-35}
                          textAnchor="end"
                          height={40}
                        />
                        <YAxis
                          width={48}
                          domain={[
                            0,
                            (dataMax: number) => Math.max(dataMax, 110),
                          ]}
                          tickFormatter={(value: number) => `${value}%`}
                        />
                        <ReferenceLine
                          y={100}
                          stroke="#64748b"
                          strokeDasharray="4 4"
                          label={{ value: '100%', position: 'insideTopRight' }}
                        />
                        <Tooltip
                          content={(props) => <BudgetUsageTooltip {...props} />}
                        />
                        <Bar dataKey="percentage" name="Budget consumido">
                          <LabelList
                            dataKey="percentage"
                            position="top"
                            formatter={(value) =>
                              value == null
                                ? ''
                                : `${Number(value).toFixed(1)}%`
                            }
                          />
                          {monthlyBudgetUsageData.map((entry) => (
                            <Cell
                              key={entry.month}
                              fill={
                                entry.percentage !== null &&
                                entry.percentage > 100
                                  ? '#dc2626'
                                  : '#059669'
                              }
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}
            </section>
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
                entries={monthlySpendBySegment}
                emptyMessage="Nenhum gasto por segmento neste mês."
                barColorClassName="bg-blue-600"
              />

              {/* Gastos por Projeto */}
              <RankingCard
                title="Gastos por Projeto"
                icon={FolderKanban}
                entries={dashboardSummary.spendByProject}
                emptyMessage="Nenhum gasto por projeto neste mês."
                barColorClassName="bg-purple-600"
              />

              {/* Gastos por Fornecedor */}
              <RankingCard
                title="Gastos por Fornecedor"
                icon={Building2}
                entries={monthlySpendBySupplier}
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
