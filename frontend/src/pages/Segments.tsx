import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  FolderTree,
  Building,
} from 'lucide-react';

import { segmentsApi } from '@/api/endpoints/segments';
import { sectorsApi } from '@/api/endpoints/sectors';
import type { Segment, Sector, SegmentType } from '@/api/types';
import { ApiError } from '@/api/client';
import { useToast } from '@/components/Toast';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { StatusBadge } from '@/components/StatusBadge';
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
import { segmentTypeLabels } from '@/utils/labels';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const segmentSchema = z.object({
  name: z.string().min(1, 'Nome do segmento é obrigatório'),
  type: z.enum(['PROJECT', 'STANDARD'] as const, {
    required_error: 'Selecione o tipo do segmento',
  }),
});

type SegmentFormData = z.infer<typeof segmentSchema>;

const sectorSchema = z.object({
  name: z.string().min(1, 'Nome do setor é obrigatório'),
  segmentId: z.number({ required_error: 'Segmento é obrigatório' }),
});

type SectorFormData = z.infer<typeof sectorSchema>;

// ---------------------------------------------------------------------------
// Subcomponent: Nested Sectors for a Segment
// ---------------------------------------------------------------------------

interface SectorListProps {
  segment: Segment;
  onEditSector: (sector: Sector) => void;
  onDeleteSector: (sector: Sector) => void;
  onAddSector: (segment: Segment) => void;
}

function SectorList({
  segment,
  onEditSector,
  onDeleteSector,
  onAddSector,
}: SectorListProps) {
  const { data: sectors = [], isLoading } = useQuery({
    queryKey: ['sectors', segment.id],
    queryFn: () => sectorsApi.list(segment.id),
  });

  return (
    <div className="border-t border-border bg-muted/30 px-6 py-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Building className="h-3.5 w-3.5" />
          Setores vinculados ({sectors.length})
        </h4>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onAddSector(segment)}
          className="h-7 text-xs"
        >
          <Plus className="mr-1 h-3.5 w-3.5" />
          Novo Setor
        </Button>
      </div>

      {isLoading ? (
        <p className="py-2 text-xs text-muted-foreground">Carregando setores…</p>
      ) : sectors.length === 0 ? (
        <p className="py-2 text-xs italic text-muted-foreground">
          Nenhum setor cadastrado para este segmento.
        </p>
      ) : (
        <div className="divide-y divide-border rounded-md border border-border bg-background">
          {sectors.map((sector) => (
            <div
              key={sector.id}
              className="flex items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-muted/40"
            >
              <span className="font-medium">{sector.name}</span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onEditSector(sector)}
                  title="Editar setor"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onDeleteSector(sector)}
                  title="Excluir setor"
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function Segments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Accordion state: set of expanded segment IDs
  const [expandedSegments, setExpandedSegments] = useState<Set<number>>(
    new Set(),
  );

  // Segment Dialog State
  const [segmentFormOpen, setSegmentFormOpen] = useState(false);
  const [editingSegment, setEditingSegment] = useState<Segment | null>(null);
  const [deleteSegmentTarget, setDeleteSegmentTarget] =
    useState<Segment | null>(null);

  // Sector Dialog State
  const [sectorFormOpen, setSectorFormOpen] = useState(false);
  const [editingSector, setEditingSector] = useState<Sector | null>(null);
  const [targetSegmentForNewSector, setTargetSegmentForNewSector] =
    useState<Segment | null>(null);
  const [deleteSectorTarget, setDeleteSectorTarget] = useState<Sector | null>(
    null,
  );

  // ---- Queries & Mutations ------------------------------------------------

  const { data: segments = [], isLoading: isLoadingSegments } = useQuery({
    queryKey: ['segments'],
    queryFn: segmentsApi.list,
  });

  // Segment mutations
  const createSegmentMutation = useMutation({
    mutationFn: segmentsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['segments'] });
      toast('Segmento criado com sucesso');
      closeSegmentForm();
    },
    onError: (err) => {
      toast(
        err instanceof ApiError ? err.message : 'Erro ao criar segmento',
        'destructive',
      );
    },
  });

  const updateSegmentMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: SegmentFormData }) =>
      segmentsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['segments'] });
      toast('Segmento atualizado com sucesso');
      closeSegmentForm();
    },
    onError: (err) => {
      toast(
        err instanceof ApiError ? err.message : 'Erro ao atualizar segmento',
        'destructive',
      );
    },
  });

  const deleteSegmentMutation = useMutation({
    mutationFn: (id: number) => segmentsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['segments'] });
      queryClient.invalidateQueries({ queryKey: ['sectors'] });
      toast('Segmento removido');
      setDeleteSegmentTarget(null);
    },
    onError: (err) => {
      toast(
        err instanceof ApiError ? err.message : 'Erro ao remover segmento',
        'destructive',
      );
    },
  });

  // Sector mutations
  const createSectorMutation = useMutation({
    mutationFn: sectorsApi.create,
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['sectors', vars.segmentId] });
      toast('Setor criado com sucesso');
      closeSectorForm();
    },
    onError: (err) => {
      toast(
        err instanceof ApiError ? err.message : 'Erro ao criar setor',
        'destructive',
      );
    },
  });

  const updateSectorMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: SectorFormData }) =>
      sectorsApi.update(id, data),
    onSuccess: (updatedSector) => {
      queryClient.invalidateQueries({
        queryKey: ['sectors', updatedSector.segment?.id],
      });
      queryClient.invalidateQueries({ queryKey: ['sectors'] });
      toast('Setor atualizado com sucesso');
      closeSectorForm();
    },
    onError: (err) => {
      toast(
        err instanceof ApiError ? err.message : 'Erro ao atualizar setor',
        'destructive',
      );
    },
  });

  const deleteSectorMutation = useMutation({
    mutationFn: (sector: Sector) => sectorsApi.remove(sector.id),
    onSuccess: () => {
      if (deleteSectorTarget?.segment?.id) {
        queryClient.invalidateQueries({
          queryKey: ['sectors', deleteSectorTarget.segment.id],
        });
      }
      queryClient.invalidateQueries({ queryKey: ['sectors'] });
      toast('Setor removido');
      setDeleteSectorTarget(null);
    },
    onError: (err) => {
      toast(
        err instanceof ApiError ? err.message : 'Erro ao remover setor',
        'destructive',
      );
    },
  });

  // ---- Segment Form -------------------------------------------------------

  const segmentForm = useForm<SegmentFormData>({
    resolver: zodResolver(segmentSchema),
    defaultValues: { name: '', type: 'STANDARD' },
  });

  function openCreateSegment() {
    segmentForm.reset({ name: '', type: 'STANDARD' });
    setEditingSegment(null);
    setSegmentFormOpen(true);
  }

  function openEditSegment(seg: Segment) {
    segmentForm.reset({ name: seg.name, type: seg.type });
    setEditingSegment(seg);
    setSegmentFormOpen(true);
  }

  function closeSegmentForm() {
    setSegmentFormOpen(false);
    setEditingSegment(null);
    segmentForm.reset();
  }

  function onSubmitSegment(data: SegmentFormData) {
    if (editingSegment) {
      updateSegmentMutation.mutate({ id: editingSegment.id, data });
    } else {
      createSegmentMutation.mutate(data);
    }
  }

  // ---- Sector Form --------------------------------------------------------

  const sectorForm = useForm<SectorFormData>({
    resolver: zodResolver(sectorSchema),
    defaultValues: { name: '', segmentId: 0 },
  });

  function openCreateSector(segment: Segment) {
    setTargetSegmentForNewSector(segment);
    setEditingSector(null);
    sectorForm.reset({ name: '', segmentId: segment.id });
    setSectorFormOpen(true);
  }

  function openEditSector(sec: Sector) {
    setTargetSegmentForNewSector(sec.segment);
    setEditingSector(sec);
    sectorForm.reset({ name: sec.name, segmentId: sec.segment.id });
    setSectorFormOpen(true);
  }

  function closeSectorForm() {
    setSectorFormOpen(false);
    setEditingSector(null);
    setTargetSegmentForNewSector(null);
    sectorForm.reset();
  }

  function onSubmitSector(data: SectorFormData) {
    if (editingSector) {
      updateSectorMutation.mutate({ id: editingSector.id, data });
    } else {
      createSectorMutation.mutate(data);
    }
  }

  // ---- Toggle Accordion ---------------------------------------------------

  function toggleExpand(segmentId: number) {
    setExpandedSegments((prev) => {
      const next = new Set(prev);
      if (next.has(segmentId)) {
        next.delete(segmentId);
      } else {
        next.add(segmentId);
      }
      return next;
    });
  }

  const isSavingSegment =
    createSegmentMutation.isPending || updateSegmentMutation.isPending;
  const isSavingSector =
    createSectorMutation.isPending || updateSectorMutation.isPending;

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Segmentos e Setores</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie os segmentos organizacionais e seus setores associados.
          </p>
        </div>
        <Button onClick={openCreateSegment}>
          <Plus className="h-4 w-4" />
          Novo Segmento
        </Button>
      </div>

      {/* Segments List */}
      {isLoadingSegments ? (
        <p className="text-sm text-muted-foreground">Carregando segmentos…</p>
      ) : segments.length === 0 ? (
        <div className="rounded-lg border border-border bg-background p-8 text-center">
          <FolderTree className="mx-auto h-8 w-8 text-muted-foreground opacity-50" />
          <p className="mt-2 text-muted-foreground">
            Nenhum segmento cadastrado ainda.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={openCreateSegment}
            className="mt-4"
          >
            Cadastrar primeiro segmento
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {segments.map((segment) => {
            const isExpanded = expandedSegments.has(segment.id);

            return (
              <div
                key={segment.id}
                className="overflow-hidden rounded-lg border border-border bg-background transition-shadow hover:shadow-sm"
              >
                {/* Segment Bar */}
                <div className="flex items-center justify-between p-4">
                  <div
                    className="flex cursor-pointer items-center gap-3"
                    onClick={() => toggleExpand(segment.id)}
                  >
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">
                          {segment.name}
                        </span>
                        <StatusBadge type="segment" value={segment.type} />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openCreateSector(segment)}
                      className="text-xs"
                      title="Adicionar setor a este segmento"
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" />
                      Setor
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditSegment(segment)}
                      title="Editar segmento"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteSegmentTarget(segment)}
                      title="Excluir segmento"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                {/* Nested Sectors */}
                {isExpanded && (
                  <SectorList
                    segment={segment}
                    onEditSector={openEditSector}
                    onDeleteSector={(sector) => setDeleteSectorTarget(sector)}
                    onAddSector={openCreateSector}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Segment Dialog (Create / Edit) */}
      <Dialog
        open={segmentFormOpen}
        onOpenChange={(o) => !o && closeSegmentForm()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSegment ? 'Editar Segmento' : 'Novo Segmento'}
            </DialogTitle>
            <DialogDescription>
              {editingSegment
                ? 'Atualize as informações do segmento.'
                : 'Preencha os dados do novo segmento.'}
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={segmentForm.handleSubmit(onSubmitSegment)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="segmentName">Nome do Segmento</Label>
              <Input
                id="segmentName"
                {...segmentForm.register('name')}
                placeholder="Ex: Engenharia, Operações, Comercial…"
              />
              {segmentForm.formState.errors.name && (
                <p className="text-xs text-destructive">
                  {segmentForm.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="segmentType">Tipo de Segmento</Label>
              <Controller
                control={segmentForm.control}
                name="type"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(val) => field.onChange(val as SegmentType)}
                  >
                    <SelectTrigger id="segmentType">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STANDARD">
                        {segmentTypeLabels.STANDARD}
                      </SelectItem>
                      <SelectItem value="PROJECT">
                        {segmentTypeLabels.PROJECT}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {segmentForm.formState.errors.type && (
                <p className="text-xs text-destructive">
                  {segmentForm.formState.errors.type.message}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeSegmentForm}
                disabled={isSavingSegment}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSavingSegment}>
                {isSavingSegment
                  ? 'Salvando…'
                  : editingSegment
                    ? 'Salvar'
                    : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Sector Dialog (Create / Edit) */}
      <Dialog
        open={sectorFormOpen}
        onOpenChange={(o) => !o && closeSectorForm()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSector ? 'Editar Setor' : 'Novo Setor'}
            </DialogTitle>
            <DialogDescription>
              {targetSegmentForNewSector
                ? `Vinculado ao segmento "${targetSegmentForNewSector.name}".`
                : 'Defina o setor.'}
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={sectorForm.handleSubmit(onSubmitSector)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="sectorName">Nome do Setor</Label>
              <Input
                id="sectorName"
                {...sectorForm.register('name')}
                placeholder="Ex: TI, Manutenção, Facilities…"
              />
              {sectorForm.formState.errors.name && (
                <p className="text-xs text-destructive">
                  {sectorForm.formState.errors.name.message}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeSectorForm}
                disabled={isSavingSector}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSavingSector}>
                {isSavingSector
                  ? 'Salvando…'
                  : editingSector
                    ? 'Salvar'
                    : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Segment Confirmation */}
      <ConfirmDialog
        open={!!deleteSegmentTarget}
        onOpenChange={(o) => !o && setDeleteSegmentTarget(null)}
        title="Excluir Segmento"
        description={`Tem certeza que deseja excluir o segmento "${deleteSegmentTarget?.name}"? Esta ação removerá também os setores e vínculos associados.`}
        confirmLabel="Excluir"
        loading={deleteSegmentMutation.isPending}
        onConfirm={() =>
          deleteSegmentTarget &&
          deleteSegmentMutation.mutate(deleteSegmentTarget.id)
        }
      />

      {/* Delete Sector Confirmation */}
      <ConfirmDialog
        open={!!deleteSectorTarget}
        onOpenChange={(o) => !o && setDeleteSectorTarget(null)}
        title="Excluir Setor"
        description={`Tem certeza que deseja excluir o setor "${deleteSectorTarget?.name}"?`}
        confirmLabel="Excluir"
        loading={deleteSectorMutation.isPending}
        onConfirm={() =>
          deleteSectorTarget && deleteSectorMutation.mutate(deleteSectorTarget)
        }
      />
    </div>
  );
}
