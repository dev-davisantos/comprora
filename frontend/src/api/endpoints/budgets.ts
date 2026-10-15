import { api } from '../client';
import type {
  Budget,
  BudgetIndicator,
  DecimalString,
  MonthString,
} from '../types';

export interface CreateBudgetDto {
  monthYear: string; // ISO string or "YYYY-MM" depending on backend
  week: number;
  plannedValue: DecimalString;
}

export interface CreateMonthlyBudgetDto {
  monthYear: string;
  monthlyValue: DecimalString;
}

export interface UpdateBudgetDto {
  monthYear?: string;
  week?: number;
  plannedValue?: DecimalString;
}

export const budgetsApi = {
  list: (monthYear?: string) =>
    api.get<Budget[]>(
      `/budgets${monthYear ? `?month=${encodeURIComponent(monthYear)}` : ''}`,
    ),

  getById: (id: number) => api.get<Budget>(`/budgets/${id}`),

  create: (data: CreateBudgetDto) => api.post<Budget>('/budgets', data),

  createMonthly: (data: CreateMonthlyBudgetDto) =>
    api.post<Budget[]>('/budgets/monthly', data),

  update: (id: number, data: UpdateBudgetDto) =>
    api.patch<Budget>(`/budgets/${id}`, data),

  remove: (id: number) => api.delete(`/budgets/${id}`),

  getIndicator: (month: MonthString) =>
    api.get<BudgetIndicator>(
      `/budgets/indicator?month=${encodeURIComponent(month)}`,
    ),
};
