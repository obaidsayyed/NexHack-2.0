import { DashboardStats } from '../types/clinical';
import { apiFetch } from './client';

export async function fetchDashboardStats(): Promise<DashboardStats> {
  return apiFetch<DashboardStats>('/dashboard/stats');
}
