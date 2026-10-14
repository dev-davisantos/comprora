import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Filter,
  RotateCcw,
  ShoppingCart,
  Calendar,
  Clock,
  Plus,
  Pencil,
  Trash2,
  FolderKanban,
  CheckCircle2,
  ArrowRightLeft,
} from 'lucide-react';

import {
  purchaseOrdersApi,
  type CreatePurchaseOrderDto,
  type PurchaseOrderFilters,
  type UpdatePurchaseOrderDto,
} from '@/api/endpoints/purchaseOrders';
import { suppliersApi } from '@/api/endpoints/suppliers';
import { segmentsApi } from '@/api/endpoints/segments';
import { sectorsApi } from '@/api/endpoints/sectors';
import { projectsApi } from '@/api/endpoints/projects';
import type {
  OrderStatus,
  PaymentCondition,
  PurchaseOrder,
  ServiceType,
} from '@/api/types';
import { ApiError } from '@/api/client';
import { useToast } from '@/components/Toast';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { StatusBadge } from '@/components/StatusBadge';
import { StatusTransitionDialog } from '@/components/StatusTransitionDialog';
import { MonthPicker } from '@/components/MonthPicker';
import { MoneyInput } from '@/components/MoneyInput';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { formatDate, formatMoney } from '@/utils/format';
import {
  orderStatusLabels,
  paymentConditionLabels,
  serviceTypeLabels,
} from '@/utils/labels';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const orderFormSchema = z.object({
  issueDate: z.string().min(1, 'Data de emissão é obrigatória'),
  supplierId: z.coerce.number().min(1, 'Selecione um fornecedor'),
  requester: z.string().min(1, 'Solicitante é obrigatório'),
  serviceType: z.enum(['PURCHASE', 'SERVICE'] as const),
  segmentId: z.coerce.number().min(1, 'Selecione um segmento'),
  sectorId: z.coerce.number().optional().nullable(),
  resource: z.string().optional().nullable(),
  projectIds: z.array(z.number()),
  description: z.string().min(1, 'Descrição é obrigatória'),
  initialValue: z
    .string()
    .min(1, 'Valor inicial é obrigatório')
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, 'Valor inválido'),
  finalValue: z.string().optional().nullable(),
  deliveryDeadline: z.coerce
    .number()
    .min(0, 'Prazo de entrega não pode ser negativo'),
  paymentCondition: z
    .enum(['ANTECIPATED', 'DD15', 'DD30', 'DD45', 'DD60'] as const)
    .optional()
    .nullable(),
});

type OrderFormData = z.infer<typeof orderFormSchema>;

function toDateInput(iso?: string | null): string {
  if (!iso) return '';
  return iso.slice(0, 10);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PurchaseOrders() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Filters State
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [supplierFilter, setSupplierFilter] = useState<string>('ALL');
  const [segmentFilter, setSegmentFilter] = useState<string>('ALL');
  const [projectFilter, setProjectFilter] = useState<string>('ALL');
  const [monthFilter, setMonthFilter] = useState<string>('');

  // Dialog State
  const [formOpen, setFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PurchaseOrder | null>(null);
  const [approvingOrder, setApprovingOrder] = useState<PurchaseOrder | null>(null);
  const [statusOrder, setStatusOrder] = useState<PurchaseOrder | null>(null);

  // Active filters object for API query
  const activeFilters: PurchaseOrderFilters = {
    status: statusFilter !== 'ALL' ? (statusFilter as OrderStatus) : undefined,
    supplierId: supplierFilter !== 'ALL' ? Number(supplierFilter) : undefined,
    segmentId: segmentFilter !== 'ALL' ? Number(segmentFilter) : undefined,
    projectId: projectFilter !== 'ALL' ? Number(projectFilter) : undefined,
    month: monthFilter || undefined,
  };

  const hasActiveFilters =
    statusFilter !== 'ALL' ||
    supplierFilter !== 'ALL' ||
    segmentFilter !== 'ALL' ||
    projectFilter !== 'ALL' ||
    !!monthFilter;

  function clearFilters() {
    setStatusFilter('ALL');
    setSupplierFilter('ALL');
    setSegmentFilter('ALL');
    setProjectFilter('ALL');
    setMonthFilter('');
  }

  // ---- Queries ------------------------------------------------------------

  const {
    data: purchaseOrders = [],
    isLoading: isLoadingOrders,
    isError: isOrdersError,
    error: ordersError,
    refetch: refetchOrders,
    isFetching: isFetchingOrders,
  } = useQuery({
    queryKey: ['purchaseOrders', activeFilters],
    queryFn: () => purchaseOrdersApi.list(activeFilters),
  });

  const {
    data: suppliers = [],
    isError: isSuppliersError,
    error: suppliersError,
    refetch: refetchSuppliers,
    isFetching: isFetchingSuppliers,
  } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => suppliersApi.list(),
  });

  const {
    data: segments = [],
    isError: isSegmentsError,
    error: segmentsError,
    refetch: refetchSegments,
    isFetching: isFetchingSegments,
  } = useQuery({
    queryKey: ['segments'],
    queryFn: segmentsApi.list,
  });

  const {
    data: projects = [],
    isError: isProjectsError,
    error: projectsError,
    refetch: refetchProjects,
    isFetching: isFetchingProjects,
  } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.list,
  });

  // ---- Form Setup ---------------------------------------------------------

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      issueDate: '',
      supplierId: 0,
      requester: '',
      serviceType: 'PURCHASE',
      segmentId: 0,
      sectorId: null,
      resource: '',
      projectIds: [],
      description: '',
      initialValue: '0.00',
      finalValue: '',
      deliveryDeadline: 0,
      paymentCondition: null,
    },
  });

  const watchSegmentId = form.watch('segmentId');
  const selectedSegment = segments.find(
    (s) => s.id === Number(watchSegmentId),
  );
  const isProjectSegment = selectedSegment?.type === 'PROJECT';

  // Fetch sectors for the selected segment when STANDARD
  const {
    data: segmentSectors = [],
    isError: isSectorsError,
    error: sectorsError,
    refetch: refetchSectors,
    isFetching: isFetchingSectors,
  } = useQuery({
    queryKey: ['sectors', selectedSegment?.id],
    queryFn: () =>
      selectedSegment ? sectorsApi.list(selectedSegment.id) : [],
    enabled: !!selectedSegment && !isProjectSegment,
  });

  // ---- Mutations ----------------------------------------------------------

  const createMutation = useMutation({
    mutationFn: async (data: OrderFormData) => {
      const payload: CreatePurchaseOrderDto = {
        issueDate: data.issueDate,
        supplierId: Number(data.supplierId),
        requester: data.requester,
        serviceType: data.serviceType,
        segmentId: Number(data.segmentId),
        sectorId: isProjectSegment ? null : data.sectorId ? Number(data.sectorId) : null,
        resource: isProjectSegment ? null : data.resource || null,
        description: data.description,
        initialValue: data.initialValue,
        finalValue: data.finalValue || data.initialValue,
        deliveryDeadline: Number(data.deliveryDeadline),
        paymentCondition: data.paymentCondition || null,
      };

      const newOrder = await purchaseOrdersApi.create(payload);

      // Link projects if PROJECT segment
      if (isProjectSegment && data.projectIds && data.projectIds.length > 0) {
        await purchaseOrdersApi.updateProjects(newOrder.id, data.projectIds);
      }

      return newOrder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast('Pedido criado com sucesso');
      closeForm();
    },
    onError: (err) => {
      toast(
        err instanceof ApiError ? err.message : 'Erro ao criar pedido',
        'destructive',
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: OrderFormData }) => {
      const payload: UpdatePurchaseOrderDto = {
        issueDate: data.issueDate,
        supplierId: Number(data.supplierId),
        requester: data.requester,
        serviceType: data.serviceType,
        segmentId: Number(data.segmentId),
        sectorId: isProjectSegment ? null : data.sectorId ? Number(data.sectorId) : null,
        resource: isProjectSegment ? null : data.resource || null,
        description: data.description,
        initialValue: data.initialValue,
        finalValue: data.finalValue || data.initialValue,
        deliveryDeadline: Number(data.deliveryDeadline),
        paymentCondition: data.paymentCondition || null,
      };

      const updated = await purchaseOrdersApi.update(id, payload);

      // Update project links
      if (isProjectSegment) {
        await purchaseOrdersApi.updateProjects(id, data.projectIds || []);
      }

      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast('Pedido atualizado com sucesso');
      closeForm();
    },
    onError: (err) => {
      toast(
        err instanceof ApiError ? err.message : 'Erro ao atualizar pedido',
        'destructive',
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => purchaseOrdersApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast('Pedido removido');
      setDeleteTarget(null);
    },
    onError: (err) => {
      toast(
        err instanceof ApiError ? err.message : 'Erro ao remover pedido',
        'destructive',
      );
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => purchaseOrdersApi.approve(id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast(`Pedido #${updated.orderNumber} aprovado com sucesso!`);
      setApprovingOrder(null);
    },
    onError: (err) => {
      toast(
        err instanceof ApiError ? err.message : 'Erro ao aprovar pedido',
        'destructive',
      );
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: OrderStatus }) =>
      purchaseOrdersApi.updateStatus(id, status),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast(
        `Status do pedido #${updated.orderNumber} alterado para ${orderStatusLabels[updated.status]}`,
      );
      setStatusOrder(null);
    },
    onError: (err) => {
      toast(
        err instanceof ApiError ? err.message : 'Erro ao alterar status',
        'destructive',
      );
    },
  });

  // ---- Form Handlers ------------------------------------------------------

  function openCreate() {
    form.reset({
      issueDate: new Date().toISOString().slice(0, 10),
      supplierId: suppliers[0]?.id || 0,
      requester: '',
      serviceType: 'PURCHASE',
      segmentId: segments[0]?.id || 0,
      sectorId: null,
      resource: '',
      projectIds: [],
      description: '',
      initialValue: '0.00',
      finalValue: '',
      deliveryDeadline: 7,
      paymentCondition: 'DD30',
    });
    setEditingOrder(null);
    setFormOpen(true);
  }

  function openEdit(order: PurchaseOrder) {
    const linkedProjectIds = order.orderProjects?.map((op) => op.project.id) || [];

    form.reset({
      issueDate: toDateInput(order.issueDate),
      supplierId: order.supplier.id,
      requester: order.requester,
      serviceType: order.serviceType,
      segmentId: order.segment.id,
      sectorId: order.sector?.id || null,
      resource: order.resource || '',
      projectIds: linkedProjectIds,
      description: order.description,
      initialValue: order.initialValue,
      finalValue: order.finalValue,
      deliveryDeadline: order.deliveryDeadline,
      paymentCondition: order.paymentCondition,
    });
    setEditingOrder(order);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingOrder(null);
    form.reset();
  }

  function onSubmit(data: OrderFormData) {
    if (editingOrder) {
      updateMutation.mutate({ id: editingOrder.id, data });
    } else {
      createMutation.mutate(data);
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pedidos de Compra</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acompanhe pedidos de compra e serviço com controle de status e aprovações.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Novo Pedido
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="rounded-lg border border-border bg-background p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span>Filtros</span>
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Limpar filtros
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {/* Status Filter */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Status
            </label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os status</SelectItem>
                <SelectItem value="PENDING">{orderStatusLabels.PENDING}</SelectItem>
                <SelectItem value="AUTHORIZED">
                  {orderStatusLabels.AUTHORIZED}
                </SelectItem>
                <SelectItem value="DELIVERED">
                  {orderStatusLabels.DELIVERED}
                </SelectItem>
                <SelectItem value="INVOICED">
                  {orderStatusLabels.INVOICED}
                </SelectItem>
                <SelectItem value="CANCELLED">
                  {orderStatusLabels.CANCELLED}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Supplier Filter */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Fornecedor
            </label>
            <Select value={supplierFilter} onValueChange={setSupplierFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os fornecedores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os fornecedores</SelectItem>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Segment Filter */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Segmento
            </label>
            <Select value={segmentFilter} onValueChange={setSegmentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os segmentos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os segmentos</SelectItem>
                {segments.map((seg) => (
                  <SelectItem key={seg.id} value={String(seg.id)}>
                    {seg.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Project Filter */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Projeto
            </label>
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os projetos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os projetos</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Month Filter */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Mês de Emissão
            </label>
            <MonthPicker
              value={monthFilter}
              onChange={setMonthFilter}
              placeholder="Selecione o mês"
            />
          </div>
        </div>
      </div>

      {(isSuppliersError || isSegmentsError || isProjectsError) && (
        <ErrorState
          error={suppliersError || segmentsError || projectsError}
          fallbackMessage="Não foi possível carregar algumas opções dos pedidos. Tente novamente."
          onRetry={() => {
            if (isSuppliersError) void refetchSuppliers();
            if (isSegmentsError) void refetchSegments();
            if (isProjectsError) void refetchProjects();
          }}
          isRetrying={
            isFetchingSuppliers || isFetchingSegments || isFetchingProjects
          }
          className="p-4"
        />
      )}

      {/* Orders Table */}
      {isLoadingOrders ? (
        <LoadingState message="Carregando pedidos…" />
      ) : isOrdersError ? (
        <ErrorState
          error={ordersError}
          fallbackMessage="Não foi possível carregar os pedidos."
          onRetry={() => refetchOrders()}
          isRetrying={isFetchingOrders}
        />
      ) : purchaseOrders.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title={
            hasActiveFilters
              ? 'Nenhum pedido encontrado'
              : 'Nenhum pedido cadastrado'
          }
          description={
            hasActiveFilters
              ? 'Não há pedidos que correspondam aos filtros selecionados.'
              : 'Crie um pedido de compra para começar.'
          }
          actionLabel={hasActiveFilters ? 'Limpar filtros' : 'Criar pedido'}
          onAction={hasActiveFilters ? clearFilters : openCreate}
        />
      ) : (
        <div className="rounded-lg border border-border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Nº</TableHead>
                <TableHead>Emissão</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Segmento / Destino</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Valor Final</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Entrega</TableHead>
                <TableHead className="w-36 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchaseOrders.map((order) => (
                <TableRow key={order.id}>
                  {/* Número */}
                  <TableCell className="font-mono font-bold text-primary">
                    #{order.orderNumber}
                  </TableCell>

                  {/* Emissão */}
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{formatDate(order.issueDate)}</span>
                    </div>
                  </TableCell>

                  {/* Fornecedor */}
                  <TableCell>
                    <div className="font-medium text-foreground">
                      {order.supplier.displayName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {order.requester}
                    </div>
                  </TableCell>

                  {/* Segmento / Destino */}
                  <TableCell className="text-xs">
                    <div className="font-medium text-foreground">
                      {order.segment.name}
                    </div>
                    {order.sector && (
                      <div className="text-muted-foreground">
                        Setor: {order.sector.name}
                      </div>
                    )}
                    {order.orderProjects && order.orderProjects.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {order.orderProjects.map((op) => (
                          <Badge
                            key={op.id}
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0"
                          >
                            {op.project.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </TableCell>

                  {/* Tipo */}
                  <TableCell className="text-xs whitespace-nowrap">
                    <Badge variant="outline">
                      {serviceTypeLabels[order.serviceType]}
                    </Badge>
                  </TableCell>

                  {/* Descrição */}
                  <TableCell className="max-w-xs text-xs text-muted-foreground">
                    <p className="line-clamp-2" title={order.description}>
                      {order.description}
                    </p>
                    {order.resource && (
                      <span className="text-[11px] text-muted-foreground/80">
                        Recurso: {order.resource}
                      </span>
                    )}
                  </TableCell>

                  {/* Valor Final */}
                  <TableCell className="text-right whitespace-nowrap">
                    <span className="font-semibold text-foreground">
                      {formatMoney(order.finalValue || order.initialValue)}
                    </span>
                    {order.finalValue &&
                      order.finalValue !== order.initialValue && (
                        <div className="text-[11px] text-muted-foreground line-through">
                          {formatMoney(order.initialValue)}
                        </div>
                      )}
                  </TableCell>

                  {/* Status */}
                  <TableCell className="whitespace-nowrap">
                    <StatusBadge type="order" value={order.status} />
                    {order.paymentCondition && (
                      <div className="mt-0.5 text-[11px] text-muted-foreground">
                        {paymentConditionLabels[order.paymentCondition]}
                      </div>
                    )}
                  </TableCell>

                  {/* Prazo / Data Entrega */}
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{order.deliveryDeadline} dias</span>
                    </div>
                    {order.deliveryDate && (
                      <div className="text-[11px]">
                        Entregue: {formatDate(order.deliveryDate)}
                      </div>
                    )}
                  </TableCell>

                  {/* Ações */}
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {/* Botão rápido de Aprovação quando PENDING */}
                      {order.status === 'PENDING' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                          onClick={() => setApprovingOrder(order)}
                          title="Aprovar pedido"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      )}

                      {/* Botão de Transição de Status */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => setStatusOrder(order)}
                        title="Alterar status"
                      >
                        <ArrowRightLeft className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(order)}
                        title="Editar pedido"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setDeleteTarget(order)}
                        title="Excluir pedido"
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingOrder
                ? `Editar Pedido #${editingOrder.orderNumber}`
                : 'Novo Pedido de Compra'}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados do pedido. Segmentos de Projeto permitem vincular projetos diretamente.
            </DialogDescription>
          </DialogHeader>

          {(isSuppliersError || isSegmentsError || isProjectsError) && (
            <ErrorState
              error={suppliersError || segmentsError || projectsError}
              fallbackMessage="Não foi possível carregar algumas opções do pedido."
              onRetry={() => {
                if (isSuppliersError) void refetchSuppliers();
                if (isSegmentsError) void refetchSegments();
                if (isProjectsError) void refetchProjects();
              }}
              isRetrying={
                isFetchingSuppliers || isFetchingSegments || isFetchingProjects
              }
              className="p-4"
            />
          )}

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Linha 1: Emissão e Fornecedor */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="issueDate">Data de Emissão</Label>
                <Input
                  id="issueDate"
                  type="date"
                  {...form.register('issueDate')}
                />
                {form.formState.errors.issueDate && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.issueDate.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="supplierId">Fornecedor</Label>
                <Controller
                  control={form.control}
                  name="supplierId"
                  render={({ field }) => (
                    <Select
                      value={field.value ? String(field.value) : ''}
                      onValueChange={(val) => field.onChange(Number(val))}
                    >
                      <SelectTrigger id="supplierId">
                        <SelectValue placeholder="Selecione o fornecedor" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map((s) => (
                          <SelectItem key={s.id} value={String(s.id)}>
                            {s.displayName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.supplierId && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.supplierId.message}
                  </p>
                )}
              </div>
            </div>

            {/* Linha 2: Solicitante e Tipo de Serviço */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="requester">Solicitante</Label>
                <Input
                  id="requester"
                  placeholder="Nome do colaborador solicitante"
                  {...form.register('requester')}
                />
                {form.formState.errors.requester && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.requester.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="serviceType">Tipo de Pedido</Label>
                <Controller
                  control={form.control}
                  name="serviceType"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(val) =>
                        field.onChange(val as ServiceType)
                      }
                    >
                      <SelectTrigger id="serviceType">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PURCHASE">
                          {serviceTypeLabels.PURCHASE}
                        </SelectItem>
                        <SelectItem value="SERVICE">
                          {serviceTypeLabels.SERVICE}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            {/* Linha 3: Segmento */}
            <div className="space-y-1.5">
              <Label htmlFor="segmentId">Segmento</Label>
              <Controller
                control={form.control}
                name="segmentId"
                render={({ field }) => (
                  <Select
                    value={field.value ? String(field.value) : ''}
                    onValueChange={(val) => {
                      field.onChange(Number(val));
                      // Limpar setor/projetos ao trocar segmento
                      form.setValue('sectorId', null);
                      form.setValue('resource', '');
                      form.setValue('projectIds', []);
                    }}
                  >
                    <SelectTrigger id="segmentId">
                      <SelectValue placeholder="Selecione o segmento" />
                    </SelectTrigger>
                    <SelectContent>
                      {segments.map((seg) => (
                        <SelectItem key={seg.id} value={String(seg.id)}>
                          {seg.name} ({seg.type === 'PROJECT' ? 'Projeto' : 'Padrão'})
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
              {isSectorsError && (
                <ErrorState
                  error={sectorsError}
                  fallbackMessage="Não foi possível carregar os setores deste segmento."
                  onRetry={() => refetchSectors()}
                  isRetrying={isFetchingSectors}
                  className="p-4"
                />
              )}
            </div>

            {/* Condicional: Se Segmento for PROJECT -> Seletor de Projetos */}
            {isProjectSegment && (
              <div className="rounded-md border border-border bg-muted/40 p-3 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <FolderKanban className="h-4 w-4 text-primary" />
                  <span>Vincular a Projetos (Segmento Projeto)</span>
                </div>
                {projects.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    Nenhum projeto cadastrado no sistema.
                  </p>
                ) : (
                  <Controller
                    control={form.control}
                    name="projectIds"
                    render={({ field }) => {
                      const currentIds = field.value || [];

                      const toggleProject = (projectId: number) => {
                        if (currentIds.includes(projectId)) {
                          field.onChange(currentIds.filter((id) => id !== projectId));
                        } else {
                          field.onChange([...currentIds, projectId]);
                        }
                      };

                      return (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {projects.map((proj) => {
                            const isChecked = currentIds.includes(proj.id);
                            return (
                              <label
                                key={proj.id}
                                className={`flex items-center gap-2 p-2 rounded-md border text-xs cursor-pointer transition-colors ${
                                  isChecked
                                    ? 'border-primary bg-primary/10 font-medium'
                                    : 'border-border bg-background hover:bg-muted'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleProject(proj.id)}
                                  className="h-3.5 w-3.5 rounded text-primary"
                                />
                                <span className="truncate">{proj.name}</span>
                              </label>
                            );
                          })}
                        </div>
                      );
                    }}
                  />
                )}
              </div>
            )}

            {/* Condicional: Se Segmento for STANDARD -> Setor + Recurso */}
            {!isProjectSegment && selectedSegment && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 rounded-md border border-border bg-muted/20 p-3">
                <div className="space-y-1.5">
                  <Label htmlFor="sectorId">Setor</Label>
                  <Controller
                    control={form.control}
                    name="sectorId"
                    render={({ field }) => (
                      <Select
                        value={field.value ? String(field.value) : ''}
                        onValueChange={(val) => field.onChange(Number(val))}
                      >
                        <SelectTrigger id="sectorId">
                          <SelectValue placeholder="Selecione o setor" />
                        </SelectTrigger>
                        <SelectContent>
                          {segmentSectors.map((sec) => (
                            <SelectItem key={sec.id} value={String(sec.id)}>
                              {sec.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="resource">Recurso / Finalidade</Label>
                  <Input
                    id="resource"
                    placeholder="Ex: Licença de software, Material…"
                    {...form.register('resource')}
                  />
                </div>
              </div>
            )}

            {/* Linha 4: Descrição */}
            <div className="space-y-1.5">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Detalhes sobre a compra ou prestação de serviço…"
                {...form.register('description')}
              />
              {form.formState.errors.description && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>

            {/* Linha 5: Valores (Inicial e Final) */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="initialValue">Valor Inicial</Label>
                <Controller
                  control={form.control}
                  name="initialValue"
                  render={({ field }) => (
                    <MoneyInput
                      id="initialValue"
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
                {form.formState.errors.initialValue && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.initialValue.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="finalValue">
                  Valor Final{' '}
                  <span className="text-xs text-muted-foreground">
                    (opcional)
                  </span>
                </Label>
                <Controller
                  control={form.control}
                  name="finalValue"
                  render={({ field }) => (
                    <MoneyInput
                      id="finalValue"
                      value={field.value || ''}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>
            </div>

            {/* Linha 6: Prazo e Condição de Pagamento */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="deliveryDeadline">Prazo de Entrega (dias)</Label>
                <Input
                  id="deliveryDeadline"
                  type="number"
                  min={0}
                  {...form.register('deliveryDeadline')}
                />
                {form.formState.errors.deliveryDeadline && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.deliveryDeadline.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="paymentCondition">Condição de Pagamento</Label>
                <Controller
                  control={form.control}
                  name="paymentCondition"
                  render={({ field }) => (
                    <Select
                      value={field.value || ''}
                      onValueChange={(val) =>
                        field.onChange(val as PaymentCondition)
                      }
                    >
                      <SelectTrigger id="paymentCondition">
                        <SelectValue placeholder="Selecione a condição" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ANTECIPATED">
                          {paymentConditionLabels.ANTECIPATED}
                        </SelectItem>
                        <SelectItem value="DD15">
                          {paymentConditionLabels.DD15}
                        </SelectItem>
                        <SelectItem value="DD30">
                          {paymentConditionLabels.DD30}
                        </SelectItem>
                        <SelectItem value="DD45">
                          {paymentConditionLabels.DD45}
                        </SelectItem>
                        <SelectItem value="DD60">
                          {paymentConditionLabels.DD60}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={closeForm}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving
                  ? 'Salvando…'
                  : editingOrder
                    ? 'Salvar Alterações'
                    : 'Criar Pedido'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Excluir Pedido de Compra"
        description={`Tem certeza que deseja excluir o pedido #${deleteTarget?.orderNumber}? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
      />

      {/* Approval Confirmation Dialog */}
      <ConfirmDialog
        open={!!approvingOrder}
        onOpenChange={(o) => !o && setApprovingOrder(null)}
        title={`Aprovar Pedido #${approvingOrder?.orderNumber}`}
        description={`Deseja aprovar o pedido de compra no valor de ${
          approvingOrder ? formatMoney(approvingOrder.finalValue || approvingOrder.initialValue) : ''
        } para o fornecedor "${approvingOrder?.supplier.displayName}"? O status passará para Autorizado.`}
        confirmLabel="Aprovar Pedido"
        variant="default"
        loading={approveMutation.isPending}
        onConfirm={() =>
          approvingOrder && approveMutation.mutate(approvingOrder.id)
        }
      />

      {/* Status Transition Dialog */}
      <StatusTransitionDialog
        open={!!statusOrder}
        onOpenChange={(o) => !o && setStatusOrder(null)}
        order={statusOrder}
        isLoading={statusMutation.isPending}
        onConfirm={(orderId, newStatus) =>
          statusMutation.mutate({ id: orderId, status: newStatus })
        }
      />
    </div>
  );
}
