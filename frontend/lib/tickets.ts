import { api } from './api';

export interface TicketUser {
  id: number;
  name: string;
  email: string;
}

export interface Ticket {
  id: number;
  title: string;
  description: string | null;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  sla_due_at: string | null;
  is_overdue?: boolean;
  assignee: TicketUser | null;
  creator: TicketUser;
}

export interface TicketComment {
  id: number;
  content: string;
  created_at: string;
  user: TicketUser;
}

export async function getTickets(filters?: { status?: string; priority?: string }): Promise<Ticket[]> {
  const response = await api.get<Ticket[]>('/tickets', { params: filters });
  return response.data;
}

export async function getTicket(id: number): Promise<Ticket> {
  const response = await api.get<Ticket>(`/tickets/${id}`);
  return response.data;
}

export async function createTicket(data: {
  title: string;
  description?: string;
  category?: string;
  priority?: string;
  assigned_to?: number;
}): Promise<Ticket> {
  const response = await api.post<Ticket>('/tickets', data);
  return response.data;
}

export async function updateTicket(
  id: number,
  data: Partial<{ status: string; priority: string; assigned_to: number | null }>
): Promise<Ticket> {
  const response = await api.put<Ticket>(`/tickets/${id}`, data);
  return response.data;
}

export async function getTicketComments(id: number): Promise<TicketComment[]> {
  const response = await api.get<TicketComment[]>(`/tickets/${id}/comments`);
  return response.data;
}

export async function addTicketComment(id: number, content: string): Promise<TicketComment> {
  const response = await api.post<TicketComment>(`/tickets/${id}/comments`, { content });
  return response.data;
}
