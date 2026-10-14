import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2, Wallet, Calendar } from 'lucide-react';

import { budgetsApi, type CreateBudgetDto } from '@/api/endpoints/budgets';
import type { Budget } from '@/api/types';
import { ApiError } from '@/api/client';
import { useToast } from '@/components/Toast';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { MonthPicker } from '@/components/MonthPicker';
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

const budgetSchema = z.object({
  monthYear: z.string().min(1, 'Mês de referência é obrigatório'),
  week: z.coerce.number().min(1).max(5, 'Semana deve ser entre 1 e 5'),
  plannedValue: z
    .string()
    .min(1, 'Valor planejado é obrigatório')
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, 'Valor inválido'),
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

  // Current selected month: default to current month YYYY-MM
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  });

  // Dialog State
  const [formOpen, setFormOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Budget | null>(null);

  // ---- Queries ------------------------------------------------------------

  const { data: indicator, isLoading: isLoadingIndicator } = useQuery({
    queryKey: ['budgetIndicator', selectedMonth],
    queryFn: () => budgetsApi.getIndicator(selectedMonth),
    enabled: !!selectedMonth,
  });

  const { data: budgets = [], isLoading: isLoadingBudgets } = useQuery({
    queryKey: ['budgets', selectedMonth],
    queryFn: () => budgetsApi.list(selectedMonth),
  });

  // ---- Mutations ----------------------------------------------------------

  const createMutation = useMutation({
    mutationFn: (data: CreateBudgetDto) => budgetsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budgetIndicator'] });
      toast('Meta de budget criada com sucesso');
      closeForm();
    },
    onError: (err) => {
      toast(
        err instanceof ApiError ? err.message : 'Erro ao criar meta de budget',
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
      monthYear: selectedMonth,
      week: 1,
      plannedValue: '0.00',
    },
  });

  function openCreate() {
    form.reset({
      monthYear: selectedMonth,
      week: 1,
      plannedValue: '0.00',
    });
    setEditingBudget(null);
    setFormOpen(true);
  }

  function openEdit(b: Budget) {
    const monthPart = b.monthYear.slice(0, 7);
    form.reset({
      monthYear: monthPart,
      week: b.week,
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
    // Standardize to ISO date start of month
    const isoDate = `${data.monthYear}-01T00:00:00.000Z`;

    const payload: CreateBudgetDto = {
      monthYear: isoDate,
      week: Number(data.week),
      plannedValue: data.plannedValue,
    };

    if (editingBudget) {
      updateMutation.mutate({ id: editingBudget.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header with Month Selector & Create Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Orçamentos e Metas Semanais</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acompanhe o planejado versus realizado por semana de cada mês.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-48">
            <MonthPicker
              value={selectedMonth}
              onChange={(val) => setSelectedMonth(val || selectedMonth)}
            />
          </div>
          <Button onClick={openCreate} className="gap-1.5 whitespace-nowrap">
            <Plus className="h-4 w-4" />
            Nova Meta
          </Button>
        </div>
      </div>

      {/* Weekly Indicator Dashboard Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Calendar className="h-4 w-4 text-primary" />
          <span className="capitalize">
            Indicador de {formatMonthDisplay(selectedMonth)}
          </span>
        </div>

        {isLoadingIndicator ? (
          <p className="text-sm text-muted-foreground">
            Calculando indicador semanal…
          </p>
        ) : indicator ? (
          <BudgetWeeklyIndicator indicator={indicator} />
        ) : (
          <div className="rounded-lg border border-border bg-background p-6 text-center text-sm text-muted-foreground">
            Sem dados de indicador para o mês selecionado.
          </div>
        )}
      </div>

      {/* Registered Budgets Table */}
      <div className="space-y-3 pt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            Metas Semanais Cadastradas ({budgets.length})
          </h3>
        </div>

        {isLoadingBudgets ? (
          <p className="text-sm text-muted-foreground">Carregando metas…</p>
        ) : budgets.length === 0 ? (
          <div className="rounded-lg border border-border bg-background p-8 text-center">
            <Wallet className="mx-auto h-8 w-8 text-muted-foreground opacity-50" />
            <p className="mt-2 text-muted-foreground">
              Nenhuma meta cadastrada para {formatMonthDisplay(selectedMonth)}.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={openCreate}
              className="mt-4"
            >
              Cadastrar meta semanal
            </Button>
          </div>
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
              {editingBudget ? 'Editar Meta de Budget' : 'Nova Meta de Budget'}
            </DialogTitle>
            <DialogDescription>
              Defina o valor planejado para a semana do mês selecionado.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Mês de Referência */}
            <div className="space-y-1.5">
              <Label htmlFor="monthYear">Mês de Referência</Label>
              <Controller
                control={form.control}
                name="monthYear"
                render={({ field }) => (
                  <MonthPicker
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              {form.formState.errors.monthYear && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.monthYear.message}
                </p>
              )}
            </div>

            {/* Semana */}
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

            {/* Valor Planejado */}
            <div className="space-y-1.5">
              <Label htmlFor="plannedValue">Valor Planejado</Label>
              <Controller
                control={form.control}
                name="plannedValue"
                render={({ field }) => (
                  <MoneyInput
                    id="plannedValue"
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              {form.formState.errors.plannedValue && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.plannedValue.message}
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
                {isSaving ? 'Salvando…' : editingBudget ? 'Salvar' : 'Criar Meta'}
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
