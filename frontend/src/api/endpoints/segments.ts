import { api } from '../client';
import type { Segment, SegmentType } from '../types';

export interface CreateSegmentDto {
  name: string;
  type: SegmentType;
}

export interface UpdateSegmentDto {
  name?: string;
  type?: SegmentType;
}

export const segmentsApi = {
  list: () => api.get<Segment[]>('/segments'),

  getById: (id: number) => api.get<Segment>(`/segments/${id}`),

  create: (data: CreateSegmentDto) =>
    api.post<Segment>('/segments', data),

  update: (id: number, data: UpdateSegmentDto) =>
    api.patch<Segment>(`/segments/${id}`, data),

  remove: (id: number) => api.delete(`/segments/${id}`),
};

