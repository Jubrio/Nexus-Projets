import { api } from './api';

// ---- Types ----
export interface Client {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  company: string | null;
  tax_id: string | null;
  invoices_count?: number;
}

export interface InvoiceLine {
  id?: number;
  description: string;
  quantity: number;
  unit_price: number;
  discount?: number;
  total?: number;
}

export interface Invoice {
  id: number;
  client_id: number;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  subtotal: string;
  tax_rate: string;
  tax_amount: string;
  total: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  notes: string | null;
  client?: Client;
  lines?: InvoiceLine[];
  payments?: Payment[];
  is_overdue?: boolean;
  paid_amount?: number;
  remaining_amount?: number;
}

export interface Payment {
  id: number;
  invoice_id: number;
  client_id: number;
  amount: string;
  payment_date: string;
  method: 'cash' | 'bank_transfer' | 'credit_card' | 'check';
  reference: string | null;
  client?: Client;
  invoice?: Invoice;
}

// ---- Clients ----
export async function getClients(): Promise<Client[]> {
  const response = await api.get<Client[]>('/clients');
  return response.data;
}

export async function getClient(id: number): Promise<Client> {
  const response = await api.get<Client>(`/clients/${id}`);
  return response.data;
}

export async function createClient(data: Partial<Client>): Promise<Client> {
  const response = await api.post<Client>('/clients', data);
  return response.data;
}

export async function updateClient(id: number, data: Partial<Client>): Promise<Client> {
  const response = await api.put<Client>(`/clients/${id}`, data);
  return response.data;
}

export async function deleteClient(id: number): Promise<void> {
  await api.delete(`/clients/${id}`);
}

// ---- Factures ----
export async function getInvoices(filters?: { status?: string; client_id?: number }): Promise<Invoice[]> {
  const response = await api.get<Invoice[]>('/invoices', { params: filters });
  return response.data;
}

export async function getInvoice(id: number): Promise<Invoice> {
  const response = await api.get<Invoice>(`/invoices/${id}`);
  return response.data;
}

export async function createInvoice(data: {
  client_id: number;
  issue_date: string;
  due_date: string;
  tax_rate?: number;
  notes?: string;
  lines: Omit<InvoiceLine, 'id' | 'total'>[];
}): Promise<Invoice> {
  const response = await api.post<Invoice>('/invoices', data);
  return response.data;
}

export async function updateInvoice(id: number, data: Partial<Invoice>): Promise<Invoice> {
  const response = await api.put<Invoice>(`/invoices/${id}`, data);
  return response.data;
}

export async function deleteInvoice(id: number): Promise<void> {
  await api.delete(`/invoices/${id}`);
}

// ---- Paiements ----
export async function getPayments(filters?: { client_id?: number; invoice_id?: number }): Promise<Payment[]> {
  const response = await api.get<Payment[]>('/payments', { params: filters });
  return response.data;
}

export async function createPayment(data: {
  invoice_id: number;
  amount: number;
  payment_date: string;
  method?: string;
  reference?: string;
}): Promise<Payment> {
  const response = await api.post<Payment>('/payments', data);
  return response.data;
}

export async function deletePayment(id: number): Promise<void> {
  await api.delete(`/payments/${id}`);
}

// ---- Utilitaires ----
export const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  sent: 'Envoyée',
  paid: 'Payée',
  overdue: 'En retard',
  cancelled: 'Annulée',
};

export const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
  cancelled: 'bg-red-100 text-red-700',
};

export const METHOD_LABELS: Record<string, string> = {
  cash: 'Espèces',
  bank_transfer: 'Virement bancaire',
  credit_card: 'Carte de crédit',
  check: 'Chèque',
};
