import { api } from '../client';
import type { DecimalString, Project, ProjectStatus } from '../types';

export interface CreateProjectDto {
  name: string;
  segmentId: number;
  startDate: string;
  forecastEndDate: string;
  realEndDate?: string | null;
  budget: DecimalString;
  status?: ProjectStatus;
}

export interface UpdateProjectDto {
  name?: string;
  segmentId?: number;
  startDate?: string;
  forecastEndDate?: string;
  realEndDate?: string | null;
  budget?: DecimalString;
  status?: ProjectStatus;
}

export const projectsApi = {
  list: () => api.get<Project[]>('/projects'),

  getById: (id: number) => api.get<Project>(`/projects/${id}`),

  create: (data: CreateProjectDto) =>
    api.post<Project>('/projects', data),

  update: (id: number, data: UpdateProjectDto) =>
    api.patch<Project>(`/projects/${id}`, data),

  remove: (id: number) => api.delete(`/projects/${id}`),
};
