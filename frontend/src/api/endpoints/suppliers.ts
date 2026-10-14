import { api } from '../client';
import type { Supplier } from '../types';

export interface CreateSupplierDto {
  displayName: string;
  corporateName: string;
  cnpj: string;
}

export interface UpdateSupplierDto {
  displayName?: string;
  corporateName?: string;
  cnpj?: string;
}

export const suppliersApi = {
  list: (search?: string) =>
    api.get<Supplier[]>(
      `/suppliers${search ? `?search=${encodeURIComponent(search)}` : ''}`,
    ),

  getById: (id: number) => api.get<Supplier>(`/suppliers/${id}`),

  create: (data: CreateSupplierDto) =>
    api.post<Supplier>('/suppliers', data),

  update: (id: number, data: UpdateSupplierDto) =>
    api.patch<Supplier>(`/suppliers/${id}`, data),

  remove: (id: number) => api.delete(`/suppliers/${id}`),
};

