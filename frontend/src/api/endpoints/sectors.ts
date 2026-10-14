import { api } from '../client';
import type { Sector } from '../types';

export interface CreateSectorDto {
  name: string;
  segmentId: number;
}

export interface UpdateSectorDto {
  name?: string;
  segmentId?: number;
}

export const sectorsApi = {
  list: (segmentId?: number) =>
    api.get<Sector[]>(
      `/sectors${segmentId !== undefined ? `?segmentId=${segmentId}` : ''}`,
    ),

  getById: (id: number) => api.get<Sector>(`/sectors/${id}`),

  create: (data: CreateSectorDto) =>
    api.post<Sector>('/sectors', data),

  update: (id: number, data: UpdateSectorDto) =>
    api.patch<Sector>(`/sectors/${id}`, data),

  remove: (id: number) => api.delete(`/sectors/${id}`),
};
