import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Filter,
  RotateCcw,
  ShoppingCart,
  Calendar,
  Clock,
} from 'lucide-react';

import {
  purchaseOrdersApi,
  type PurchaseOrderFilters,
} from '@/api/endpoints/purchaseOrders';
import { suppliersApi } from '@/api/endpoints/suppliers';
import { segmentsApi } from '@/api/endpoints/segments';
import { projectsApi } from '@/api/endpoints/projects';
import type { OrderStatus } from '@/api/types';
import { StatusBadge } from '@/components/StatusBadge';
import { MonthPicker } from '@/components/MonthPicker';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
// Component
// ---------------------------------------------------------------------------

export function PurchaseOrders() {
  // Filters State
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [supplierFilter, setSupplierFilter] = useState<string>('ALL');
  const [segmentFilter, setSegmentFilter] = useState<string>('ALL');
  const [projectFilter, setProjectFilter] = useState<string>('ALL');
  const [monthFilter, setMonthFilter] = useState<string>('');

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

  const { data: purchaseOrders = [], isLoading: isLoadingOrders } = useQuery({
    queryKey: ['purchaseOrders', activeFilters],
    queryFn: () => purchaseOrdersApi.list(activeFilters),
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => suppliersApi.list(),
  });

  const { data: segments = [] } = useQuery({
    queryKey: ['segments'],
    queryFn: segmentsApi.list,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.list,
  });

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

      {/* Orders Table */}
      {isLoadingOrders ? (
        <p className="text-sm text-muted-foreground">Carregando pedidos…</p>
      ) : purchaseOrders.length === 0 ? (
        <div className="rounded-lg border border-border bg-background p-8 text-center">
          <ShoppingCart className="mx-auto h-8 w-8 text-muted-foreground opacity-50" />
          <p className="mt-2 text-muted-foreground">
            {hasActiveFilters
              ? 'Nenhum pedido encontrado com os filtros selecionados.'
              : 'Nenhum pedido de compra cadastrado ainda.'}
          </p>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="mt-4"
            >
              Limpar filtros
            </Button>
          )}
        </div>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
