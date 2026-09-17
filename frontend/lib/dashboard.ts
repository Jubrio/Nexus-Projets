import { api } from './api';

export interface LowStockProduct {
  id: number;
  name: string;
  sku: string | null;
  total_stock: number;
  threshold: number;
}

export interface ActivityItem {
  id: number;
  action: string;
  auditable_type: string;
  user_name: string;
  created_at: string;
}

export interface DashboardSummary {
  active_projects: number;
  open_tickets: number;
  overdue_tickets: number;
  tickets_by_status: {
    open: number;
    in_progress: number;
    resolved: number;
    closed: number;
  };
  low_stock_products: LowStockProduct[];
  low_stock_count: number;
  unpaid_total: number;
  recent_activity: ActivityItem[];
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const response = await api.get<DashboardSummary>('/dashboard/summary');
  return response.data;
}
