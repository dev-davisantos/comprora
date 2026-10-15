import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2, Wallet, Calendar } from 'lucide-react';

import {
  budgetsApi,
  type CreateBudgetDto,
  type CreateMonthlyBudgetDto,
} from '@/api/endpoints/budgets';
import type { Budget } from '@/api/types';
import { ApiError } from '@/api/client';
import { useToast } from '@/components/Toast';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { MonthYearPicker } from '@/components/MonthYearPicker';
import { MoneyInput } from '@/components/MoneyInput';
import { BudgetWeeklyIndicator } from '@/components/BudgetWeeklyIndicator';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { formatMoney } from '@/utils/format';

// ---------------------------------------------------------------------------
// Schemas & Helpers
// ---------------------------------------------------------------------------

const budgetSchema = z
  .object({
    mode: z.enum(['MONTHLY', 'WEEKLY']),
    week: z.coerce.number().optional(),
    monthlyValue: z.string().optional(),
    plannedValue: z.string().optional(),
  })
  .superRefine((data, context) => {
    const amount =
      data.mode === 'MONTHLY' ? data.monthlyValue : data.plannedValue;
    if (!amount || !/^\d{1,10}(\.\d{1,2})?$/.test(amount) || Number(amount) < 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Informe um valor válido com até duas casas decimais',
        path: [data.mode === 'MONTHLY' ? 'monthlyValue' : 'plannedValue'],
      });
    }

    if (
      data.mode === 'WEEKLY' &&
      (!data.week || data.week < 1 || data.week > 5)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Semana deve ser entre 1 e 5',
        path: ['week'],
      });
    }
  });

type BudgetFormData = z.infer<typeof budgetSchema>;

function formatMonthDisplay(isoOrMonth: string): string {
  if (!isoOrMonth) return '';
  const monthPart = isoOrMonth.slice(0, 7); // "YYYY-MM"
  const [year, month] = monthPart.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Budgets() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [monthFilter, setMonthFilter] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  });

  // Dialog State
  const [formOpen, setFormOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Budget | null>(null);
  const weeksInSelectedMonth = Math.ceil(
    new Date(
      Number(monthFilter.slice(0, 4)),
      Number(monthFilter.slice(5, 7)),
      0,
    ).getDate() / 7,
  );

  // ---- Queries ------------------------------------------------------------

  const {
    data: indicator,
    isLoading: isLoadingIndicator,
    isError: isIndicatorError,
    error: indicatorError,
    refetch: refetchIndicator,
    isFetching: isFetchingIndicator,
  } = useQuery({
    queryKey: ['budgetIndicator', monthFilter],
    queryFn: () => budgetsApi.getIndicator(monthFilter),
  });

  const {
    data: budgets = [],
    isLoading: isLoadingBudgets,
    isError: isBudgetsError,
    error: budgetsError,
    refetch: refetchBudgets,
    isFetching: isFetchingBudgets,
  } = useQuery({
    queryKey: ['budgets', monthFilter],
    queryFn: () => budgetsApi.list(monthFilter),
  });

  // ---- Mutations ----------------------------------------------------------

  const createMutation = useMutation({
    mutationFn: (data: CreateMonthlyBudgetDto) =>
      budgetsApi.createMonthly(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budgetIndicator'] });
      toast('Budget mensal criado e distribuído entre as semanas');
      closeForm();
    },
    onError: (err) => {
      toast(
        err instanceof ApiError ? err.message : 'Erro ao criar budget mensal',
        'destructive',
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateBudgetDto> }) =>
      budgetsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budgetIndicator'] });
      toast('Meta de budget atualizada com sucesso');
      closeForm();
    },
    onError: (err) => {
      toast(
        err instanceof ApiError
          ? err.message
          : 'Erro ao atualizar meta de budget',
        'destructive',
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => budgetsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budgetIndicator'] });
      toast('Meta de budget removida');
      setDeleteTarget(null);
    },
    onError: (err) => {
      toast(
        err instanceof ApiError ? err.message : 'Erro ao remover meta',
        'destructive',
      );
    },
  });

  // ---- Form Handlers ------------------------------------------------------

  const form = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      mode: 'MONTHLY',
      week: undefined,
      monthlyValue: '0.00',
      plannedValue: '0.00',
    },
  });

  function openCreate() {
    form.reset({
      mode: 'MONTHLY',
      week: undefined,
      monthlyValue: '0.00',
      plannedValue: '0.00',
    });
    setEditingBudget(null);
    setFormOpen(true);
  }

  function openEdit(b: Budget) {
    form.reset({
      mode: 'WEEKLY',
      week: b.week,
      monthlyValue: undefined,
      plannedValue: b.plannedValue,
    });
    setEditingBudget(b);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingBudget(null);
    form.reset();
  }

  function onSubmit(data: BudgetFormData) {
    if (editingBudget) {
      updateMutation.mutate({
        id: editingBudget.id,
        data: {
          week: Number(data.week),
          plannedValue: data.plannedValue!,
        },
      });
    } else {
      createMutation.mutate({
        monthYear: `${monthFilter}-01T00:00:00.000Z`,
        monthlyValue: data.monthlyValue!,
      });
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header with Month Selector & Create Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Orçamentos e Metas Mensais</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Defina o valor mensal e acompanhe sua distribuição e realização semanal.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-64">
            <MonthYearPicker
              value={monthFilter}
              onChange={setMonthFilter}
            />
          </div>
          <Button onClick={openCreate} className="gap-1.5 whitespace-nowrap">
            <Plus className="h-4 w-4" />
            Novo Budget
          </Button>
        </div>
      </div>

      {/* Weekly Indicator Dashboard Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Calendar className="h-4 w-4 text-primary" />
          <span className="capitalize">
            Indicador de {formatMonthDisplay(monthFilter)}
          </span>
        </div>

        {isLoadingIndicator ? (
          <LoadingState message="Calculando indicador semanal…" className="p-4" />
        ) : isIndicatorError ? (
          <ErrorState
            error={indicatorError}
            fallbackMessage="Não foi possível carregar o indicador semanal."
            onRetry={() => refetchIndicator()}
            isRetrying={isFetchingIndicator}
            className="p-4"
          />
        ) : indicator ? (
          <BudgetWeeklyIndicator indicator={indicator} />
        ) : (
          <EmptyState
            icon={Calendar}
            title="Sem dados para este mês"
            description="Cadastre o valor mensal para acompanhar o planejado e o realizado por semana."
            className="p-6"
          />
        )}
      </div>

      {/* Registered Budgets Table */}
      <div className="space-y-3 pt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            Distribuição Semanal ({budgets.length} semanas)
          </h3>
        </div>

        {isLoadingBudgets ? (
          <LoadingState message="Carregando metas…" />
        ) : isBudgetsError ? (
          <ErrorState
            error={budgetsError}
            fallbackMessage="Não foi possível carregar as metas semanais."
            onRetry={() => refetchBudgets()}
            isRetrying={isFetchingBudgets}
          />
        ) : budgets.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="Nenhum budget cadastrado"
            description={`Informe o valor mensal de ${formatMonthDisplay(monthFilter)} para gerar as metas semanais.`}
            actionLabel="Cadastrar budget mensal"
            onAction={openCreate}
          />
        ) : (
          <div className="rounded-lg border border-border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mês / Ano</TableHead>
                  <TableHead>Semana</TableHead>
                  <TableHead className="text-right">Valor Planejado</TableHead>
                  <TableHead className="w-24 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {budgets.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="capitalize font-medium">
                      {formatMonthDisplay(b.monthYear)}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-md border border-border bg-muted/30 px-2 py-0.5 text-xs font-semibold">
                        Semana {b.week}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatMoney(b.plannedValue)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(b)}
                          title="Editar meta"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(b)}
                          title="Excluir meta"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={(o) => !o && closeForm()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingBudget ? 'Editar Meta Semanal' : 'Criar Budget Mensal'}
            </DialogTitle>
            <DialogDescription>
              {editingBudget
                ? 'Altere o valor planejado desta semana.'
                : `Informe o total mensal de ${formatMonthDisplay(monthFilter)}. O sistema dividirá o valor entre ${weeksInSelectedMonth} semanas.`}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Semana: only when editing a generated weekly budget */}
            {editingBudget && (
              <div className="space-y-1.5">
                <Label htmlFor="week">Semana do Mês</Label>
                <Controller
                  control={form.control}
                  name="week"
                  render={({ field }) => (
                    <Select
                      value={field.value ? String(field.value) : '1'}
                      onValueChange={(val) => field.onChange(Number(val))}
                    >
                      <SelectTrigger id="week">
                        <SelectValue placeholder="Selecione a semana" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Semana 1</SelectItem>
                        <SelectItem value="2">Semana 2</SelectItem>
                        <SelectItem value="3">Semana 3</SelectItem>
                        <SelectItem value="4">Semana 4</SelectItem>
                        <SelectItem value="5">Semana 5</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.week && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.week.message}
                  </p>
                )}
              </div>
            )}

            {/* Monthly total on creation, weekly allocation on edit */}
            <div className="space-y-1.5">
              <Label htmlFor={editingBudget ? 'plannedValue' : 'monthlyValue'}>
                {editingBudget ? 'Valor Planejado da Semana' : 'Valor total mensal'}
              </Label>
              {editingBudget ? (
                <Controller
                  control={form.control}
                  name="plannedValue"
                  render={({ field }) => (
                    <MoneyInput
                      id="plannedValue"
                      value={field.value ?? ''}
                      onChange={field.onChange}
                    />
                  )}
                />
              ) : (
                <Controller
                  control={form.control}
                  name="monthlyValue"
                  render={({ field }) => (
                    <MoneyInput
                      id="monthlyValue"
                      value={field.value ?? ''}
                      onChange={field.onChange}
                    />
                  )}
                />
              )}
              {(form.formState.errors.plannedValue ||
                form.formState.errors.monthlyValue) && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.plannedValue?.message ||
                    form.formState.errors.monthlyValue?.message}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeForm}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Salvando…' : editingBudget ? 'Salvar' : 'Criar Budget'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Excluir Meta de Budget"
        description={`Tem certeza que deseja excluir a meta da Semana ${deleteTarget?.week} de ${
          deleteTarget ? formatMonthDisplay(deleteTarget.monthYear) : ''
        }?`}
        confirmLabel="Excluir"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
      />
    </div>
  );
}
