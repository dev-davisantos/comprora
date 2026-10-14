import { api } from '../client';
import type { DashboardSummary, MonthString } from '../types';

export const dashboardApi = {
  getSummary: (month?: MonthString) => {
    const query = month ? `?month=${encodeURIComponent(month)}` : '';
    return api.get<DashboardSummary>(`/dashboard${query}`);
  },
};
