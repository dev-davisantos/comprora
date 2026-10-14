import { useState, useEffect } from 'react';
import type { OrderStatus, PurchaseOrder } from '@/api/types';
import { orderStatusLabels } from '@/utils/labels';
import { formatMoney } from '@/utils/format';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface StatusTransitionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: PurchaseOrder | null;
  onConfirm: (orderId: number, newStatus: OrderStatus) => void;
  isLoading?: boolean;
}

const allStatuses: OrderStatus[] = [
  'PENDING',
  'AUTHORIZED',
  'DELIVERED',
  'INVOICED',
  'CANCELLED',
];

export function StatusTransitionDialog({
  open,
  onOpenChange,
  order,
  onConfirm,
  isLoading = false,
}: StatusTransitionDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>('AUTHORIZED');

  useEffect(() => {
    if (order) {
      // Suggest the next natural status
      const nextSuggested: Record<OrderStatus, OrderStatus> = {
        PENDING: 'AUTHORIZED',
        AUTHORIZED: 'DELIVERED',
        DELIVERED: 'INVOICED',
        INVOICED: 'CANCELLED',
        CANCELLED: 'PENDING',
      };
      setSelectedStatus(nextSuggested[order.status] || 'AUTHORIZED');
    }
  }, [order]);

  if (!order) return null;

  const isCancelling = selectedStatus === 'CANCELLED';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStatus && selectedStatus !== order.status) {
      onConfirm(order.id, selectedStatus);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Alterar Status do Pedido #{order.orderNumber}</DialogTitle>
          <DialogDescription>
            {order.supplier.displayName} •{' '}
            {formatMoney(order.finalValue || order.initialValue)}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-md border border-border bg-muted/40 p-3 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status Atual:</span>
              <StatusBadge type="order" value={order.status} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium leading-none">
              Novo Status
            </label>
            <Select
              value={selectedStatus}
              onValueChange={(val) => setSelectedStatus(val as OrderStatus)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o novo status" />
              </SelectTrigger>
              <SelectContent>
                {allStatuses
                  .filter((st) => st !== order.status)
                  .map((st) => (
                    <SelectItem key={st} value={st}>
                      {orderStatusLabels[st]}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {isCancelling && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
              <strong>Atenção:</strong> Cancelar este pedido impedirá novas
              operações e pode impactar o cálculo de gastos realizados.
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Voltar
            </Button>
            <Button
              type="submit"
              variant={isCancelling ? 'destructive' : 'default'}
              disabled={isLoading || selectedStatus === order.status}
            >
              {isLoading ? 'Atualizando…' : 'Confirmar Alteração'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
