import { api } from '../client';
import type {
  DecimalString,
  OrderStatus,
  PaymentCondition,
  PurchaseOrder,
  ServiceType,
} from '../types';

export interface PurchaseOrderFilters {
  status?: OrderStatus;
  supplierId?: number;
  segmentId?: number;
  projectId?: number;
  month?: string; // "YYYY-MM"
}

export interface CreatePurchaseOrderDto {
  orderNumber: number;
  issueDate: string;
  segmentId: number;
  sectorId?: number | null;
  resource?: string | null;
  description: string;
  supplierId: number;
  requester: string;
  serviceType: ServiceType;
  initialValue: DecimalString;
  finalValue?: DecimalString;
  deliveryDeadline: number;
  paymentCondition?: PaymentCondition | null;
  projectIds?: number[];
}

export interface UpdatePurchaseOrderDto {
  orderNumber?: number;
  issueDate?: string;
  segmentId?: number;
  sectorId?: number | null;
  resource?: string | null;
  description?: string;
  supplierId?: number;
  requester?: string;
  serviceType?: ServiceType;
  initialValue?: DecimalString;
  finalValue?: DecimalString;
  deliveryDeadline?: number;
  paymentCondition?: PaymentCondition | null;
}

export const purchaseOrdersApi = {
  list: (filters?: PurchaseOrderFilters) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.supplierId) params.append('supplierId', String(filters.supplierId));
    if (filters?.segmentId) params.append('segmentId', String(filters.segmentId));
    if (filters?.projectId) params.append('projectId', String(filters.projectId));
    if (filters?.month) params.append('month', filters.month);

    const query = params.toString();
    return api.get<PurchaseOrder[]>(`/purchase-orders${query ? `?${query}` : ''}`);
  },

  getById: (id: number) => api.get<PurchaseOrder>(`/purchase-orders/${id}`),

  create: (data: CreatePurchaseOrderDto) =>
    api.post<PurchaseOrder>('/purchase-orders', data),

  update: (id: number, data: UpdatePurchaseOrderDto) =>
    api.patch<PurchaseOrder>(`/purchase-orders/${id}`, data),

  remove: (id: number) => api.delete(`/purchase-orders/${id}`),

  approve: (id: number, authorizationDate: string) =>
    api.post<PurchaseOrder>(`/purchase-orders/${id}/approve`, {
      authorizationDate,
    }),

  updateStatus: (
    id: number,
    status: OrderStatus,
    authorizationDate?: string,
  ) =>
    api.patch<PurchaseOrder>(`/purchase-orders/${id}/status`, {
      status,
      ...(authorizationDate ? { authorizationDate } : {}),
    }),

  updateProjects: (id: number, projectIds: number[]) =>
    api.put<PurchaseOrder>(`/purchase-orders/${id}/projects`, { projectIds }),
};
