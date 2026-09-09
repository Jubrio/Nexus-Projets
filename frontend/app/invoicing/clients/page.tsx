'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getClients, deleteClient, Client } from '@/lib/invoicing';
import { Plus, Pencil, Trash2, Building2 } from 'lucide-react';

export default function ClientsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadClients = useCallback(async () => {
    try {
      const data = await getClients();
      setClients(data);
    } catch {
      setLoadError("Vous n'avez pas accès à cette page.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      loadClients();
    }
  }, [authLoading, user, router, loadClients]);

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce client ?')) return;
    setDeletingId(id);
    try {
      await deleteClient(id);
      await loadClients();
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
            <h2 className="text-2xl font-bold text-gray-900">Clients</h2>
            <p className="text-sm text-gray-500">Gestion des clients et facturation</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/invoicing/invoices"
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Factures
            </Link>
            <Link
              href="/invoicing/clients/new"
              className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              <Plus size={16} className="inline mr-1" />
              Nouveau client
            </Link>
          </div>
        </div>

        {loadError && (
          <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">{loadError}</div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <div key={client.id} className="rounded-lg bg-white p-5 shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Building2 size={24} className="mt-1 text-gray-400" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{client.name}</h3>
                    {client.company && (
                      <p className="text-sm text-gray-500">{client.company}</p>
                    )}
                    {client.email && (
                      <p className="text-sm text-gray-500">{client.email}</p>
                    )}
                    {client.invoices_count !== undefined && (
                      <p className="mt-1 text-xs text-gray-400">
                        {client.invoices_count} facture{client.invoices_count !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Link
                    href={`/invoicing/clients/${client.id}`}
                    className="rounded p-1 text-gray-400 hover:text-gray-600"
                  >
                    <Pencil size={16} />
                  </Link>
                  <button
                    onClick={() => handleDelete(client.id)}
                    disabled={deletingId === client.id}
                    className="rounded p-1 text-gray-400 hover:text-red-600 disabled:opacity-50"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {clients.length === 0 && !loadError && (
            <p className="col-span-full text-center text-gray-500">
              Aucun client. Créez-en un pour commencer !
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
