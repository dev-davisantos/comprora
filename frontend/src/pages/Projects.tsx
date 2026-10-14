import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2, FolderKanban } from 'lucide-react';

import { projectsApi, type CreateProjectDto } from '@/api/endpoints/projects';
import { segmentsApi } from '@/api/endpoints/segments';
import type { Project, ProjectStatus } from '@/api/types';
import { ApiError } from '@/api/client';
import { useToast } from '@/components/Toast';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { StatusBadge } from '@/components/StatusBadge';
import { BudgetProgressBar } from '@/components/BudgetProgressBar';
import { MoneyInput } from '@/components/MoneyInput';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { formatDate } from '@/utils/format';
import { projectStatusLabels } from '@/utils/labels';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const projectSchema = z
  .object({
    name: z.string().min(1, 'Nome do projeto é obrigatório'),
    segmentId: z.coerce.number().min(1, 'Selecione um segmento'),
    startDate: z.string().min(1, 'Data de início é obrigatória'),
    forecastEndDate: z.string().min(1, 'Previsão de término é obrigatória'),
    realEndDate: z.string().optional().nullable(),
    budget: z
      .string()
      .min(1, 'Budget é obrigatório')
      .refine(
        (val) => !isNaN(Number(val)) && Number(val) >= 0,
        'Valor do budget deve ser válido e positivo',
      ),
    status: z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED'] as const),
  })
  .refine(
    (data) => {
      if (data.startDate && data.forecastEndDate) {
        return data.startDate <= data.forecastEndDate;
      }
      return true;
    },
    {
      message: 'Previsão de término deve ser igual ou posterior à data de início',
      path: ['forecastEndDate'],
    },
  );

type ProjectFormData = z.infer<typeof projectSchema>;

function toDateInput(iso?: string | null): string {
  if (!iso) return '';
  return iso.slice(0, 10);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Projects() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Dialog State
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);

  // Queries
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.list,
  });

  const { data: segments = [] } = useQuery({
    queryKey: ['segments'],
    queryFn: segmentsApi.list,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateProjectDto) => projectsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast('Projeto criado com sucesso');
      closeForm();
    },
    onError: (err) => {
      toast(
        err instanceof ApiError ? err.message : 'Erro ao criar projeto',
        'destructive',
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateProjectDto> }) =>
      projectsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast('Projeto atualizado com sucesso');
      closeForm();
    },
    onError: (err) => {
      toast(
        err instanceof ApiError ? err.message : 'Erro ao atualizar projeto',
        'destructive',
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => projectsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast('Projeto removido');
      setDeleteTarget(null);
    },
    onError: (err) => {
      toast(
        err instanceof ApiError ? err.message : 'Erro ao remover projeto',
        'destructive',
      );
    },
  });

  // Form Setup
  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      segmentId: 0,
      startDate: '',
      forecastEndDate: '',
      realEndDate: '',
      budget: '0.00',
      status: 'ACTIVE',
    },
  });

  function openCreate() {
    form.reset({
      name: '',
      segmentId: segments[0]?.id || 0,
      startDate: new Date().toISOString().slice(0, 10),
      forecastEndDate: '',
      realEndDate: '',
      budget: '0.00',
      status: 'ACTIVE',
    });
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(project: Project) {
    form.reset({
      name: project.name,
      segmentId: project.segment.id,
      startDate: toDateInput(project.startDate),
      forecastEndDate: toDateInput(project.forecastEndDate),
      realEndDate: toDateInput(project.realEndDate),
      budget: project.budget,
      status: project.status,
    });
    setEditing(project);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
    form.reset();
  }

  function onSubmit(data: ProjectFormData) {
    const payload: CreateProjectDto = {
      name: data.name,
      segmentId: Number(data.segmentId),
      startDate: data.startDate,
      forecastEndDate: data.forecastEndDate,
      realEndDate: data.realEndDate ? data.realEndDate : null,
      budget: data.budget,
      status: data.status,
    };

    if (editing) {
      updateMutation.mutate({ id: editing.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projetos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acompanhe o orçamento e o custo realizado de cada projeto.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Novo Projeto
        </Button>
      </div>

      {/* Projects Table */}
      {isLoadingProjects ? (
        <p className="text-sm text-muted-foreground">Carregando projetos…</p>
      ) : projects.length === 0 ? (
        <div className="rounded-lg border border-border bg-background p-8 text-center">
          <FolderKanban className="mx-auto h-8 w-8 text-muted-foreground opacity-50" />
          <p className="mt-2 text-muted-foreground">
            Nenhum projeto cadastrado no momento.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={openCreate}
            className="mt-4"
          >
            Cadastrar primeiro projeto
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Projeto</TableHead>
                <TableHead>Segmento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Cronograma</TableHead>
                <TableHead className="w-64">Orçamento vs Custo Real</TableHead>
                <TableHead className="w-24 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-semibold text-foreground">
                    {project.name}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {project.segment.name}
                  </TableCell>
                  <TableCell>
                    <StatusBadge type="project" value={project.status} />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <div className="flex flex-col gap-0.5">
                      <span>Início: {formatDate(project.startDate)}</span>
                      <span>Fim previsto: {formatDate(project.forecastEndDate)}</span>
                      {project.realEndDate && (
                        <span className="font-medium text-foreground">
                          Fim real: {formatDate(project.realEndDate)}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <BudgetProgressBar
                      budget={project.budget}
                      realCost={project.realCost}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(project)}
                        title="Editar projeto"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget(project)}
                        title="Excluir projeto"
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

      {/* Create / Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={(o) => !o && closeForm()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Editar Projeto' : 'Novo Projeto'}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? 'Atualize os dados e previsões do projeto.'
                : 'Defina os detalhes, segmento e orçamento do projeto.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Nome */}
            <div className="space-y-1.5">
              <Label htmlFor="projectName">Nome do Projeto</Label>
              <Input
                id="projectName"
                {...form.register('name')}
                placeholder="Ex: Reforma do Galpão, Migração Cloud…"
              />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            {/* Segmento */}
            <div className="space-y-1.5">
              <Label htmlFor="projectSegment">Segmento</Label>
              <Controller
                control={form.control}
                name="segmentId"
                render={({ field }) => (
                  <Select
                    value={field.value ? String(field.value) : ''}
                    onValueChange={(val) => field.onChange(Number(val))}
                  >
                    <SelectTrigger id="projectSegment">
                      <SelectValue placeholder="Selecione o segmento" />
                    </SelectTrigger>
                    <SelectContent>
                      {segments.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.name} ({s.type === 'PROJECT' ? 'Projeto' : 'Padrão'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.segmentId && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.segmentId.message}
                </p>
              )}
            </div>

            {/* Budget */}
            <div className="space-y-1.5">
              <Label htmlFor="projectBudget">Budget Previsto</Label>
              <Controller
                control={form.control}
                name="budget"
                render={({ field }) => (
                  <MoneyInput
                    id="projectBudget"
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              {form.formState.errors.budget && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.budget.message}
                </p>
              )}
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <Label htmlFor="projectStatus">Status</Label>
              <Controller
                control={form.control}
                name="status"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(val) => field.onChange(val as ProjectStatus)}
                  >
                    <SelectTrigger id="projectStatus">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">
                        {projectStatusLabels.ACTIVE}
                      </SelectItem>
                      <SelectItem value="COMPLETED">
                        {projectStatusLabels.COMPLETED}
                      </SelectItem>
                      <SelectItem value="CANCELLED">
                        {projectStatusLabels.CANCELLED}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Dates Row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="startDate">Data de Início</Label>
                <div className="relative">
                  <Input
                    id="startDate"
                    type="date"
                    {...form.register('startDate')}
                  />
                </div>
                {form.formState.errors.startDate && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.startDate.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="forecastEndDate">Previsão de Término</Label>
                <Input
                  id="forecastEndDate"
                  type="date"
                  {...form.register('forecastEndDate')}
                />
                {form.formState.errors.forecastEndDate && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.forecastEndDate.message}
                  </p>
                )}
              </div>
            </div>

            {/* Real End Date (optional) */}
            <div className="space-y-1.5">
              <Label htmlFor="realEndDate">
                Data Real de Término <span className="text-muted-foreground text-xs">(opcional)</span>
              </Label>
              <Input
                id="realEndDate"
                type="date"
                {...form.register('realEndDate')}
              />
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
                {isSaving ? 'Salvando…' : editing ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Excluir Projeto"
        description={`Tem certeza que deseja excluir o projeto "${deleteTarget?.name}"?`}
        confirmLabel="Excluir"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
      />
    </div>
  );
}
