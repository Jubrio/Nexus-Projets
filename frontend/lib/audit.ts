import { api } from './api';

export interface AuditLog {
  id: number;
  action: string;
  auditable_type: string;
  auditable_id: number;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  user: { id: number; name: string } | null;
  created_at: string;
}

export interface AuditLogFilters {
  action?: string;
  auditable_type?: string;
  user_id?: number;
  date_from?: string;
  date_to?: string;
}

export async function getAuditLogs(filters?: AuditLogFilters): Promise<AuditLog[]> {
  const response = await api.get<AuditLog[]>('/audit-logs', { params: filters });
  return response.data;
}

export const ACTION_LABELS: Record<string, string> = {
  create: 'Création',
  update: 'Modification',
  delete: 'Suppression',
  login: 'Connexion',
  logout: 'Déconnexion',
};

export const ACTION_COLORS: Record<string, string> = {
  create: 'bg-green-100 text-green-700',
  update: 'bg-blue-100 text-blue-700',
  delete: 'bg-red-100 text-red-700',
  login: 'bg-gray-100 text-gray-700',
  logout: 'bg-gray-100 text-gray-700',
};
