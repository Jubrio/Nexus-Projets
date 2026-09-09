'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getInvoices, deleteInvoice, Invoice, STATUS_LABELS, STATUS_COLORS } from '@/lib/invoicing';
import { Plus, Pencil, Trash2, Eye, FileText } from 'lucide-react';

export default function InvoicesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadInvoices = useCallback(async () => {
    try {
      const data = await getInvoices(statusFilter ? { status: statusFilter } : undefined);
      setInvoices(data);
    } catch {
      setLoadError("Vous n'avez pas accès à cette page.");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      loadInvoices();
    }
  }, [authLoading, user, router, loadInvoices]);

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette facture ?')) return;
    setDeletingId(id);
    try {
      await deleteInvoice(id);
      await loadInvoices();
    } catch {
      alert('Erreur lors de la suppression.');
    } finally {
      setDeletingId(null);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-600">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">NEXUS</h1>
          <Link href="/dashboard" className="text-sm font-medium text-gray-700 hover:underline">
            Retour au dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Factures</h2>
            <p className="text-sm text-gray-500">Gestion des factures et paiements</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/invoicing/clients"
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Clients
            </Link>
            <Link
              href="/invoicing/invoices/new"
              className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              <Plus size={16} className="inline mr-1" />
              Nouvelle facture
            </Link>
          </div>
        </div>

        {loadError && (
          <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">{loadError}</div>
        )}

        <div className="mb-4 flex flex-wrap gap-2">
          {['', 'draft', 'sent', 'paid', 'overdue', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-md px-3 py-1.5 text-sm ${
                statusFilter === status
                  ? 'bg-black text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {status === '' ? 'Tous' : STATUS_LABELS[status] || status}
            </button>
          ))}
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  N°
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Statut
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {invoice.invoice_number}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {invoice.client?.name || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(invoice.issue_date).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {invoice.total} €
                  </td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[invoice.status]}`}>
                      {STATUS_LABELS[invoice.status] || invoice.status}
                    </span>
                    {invoice.is_overdue && (
                      <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                        En retard
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/invoicing/invoices/${invoice.id}`}
                      className="inline-block rounded p-1 text-gray-400 hover:text-gray-600"
                    >
                      <Eye size={16} />
                    </Link>
                    <button
                      onClick={() => handleDelete(invoice.id)}
                      disabled={deletingId === invoice.id}
                      className="inline-block rounded p-1 text-gray-400 hover:text-red-600 disabled:opacity-50"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {invoices.length === 0 && !loadError && (
            <p className="px-6 py-8 text-center text-gray-500">Aucune facture.</p>
          )}
        </div>
      </main>
    </div>
  );
}
