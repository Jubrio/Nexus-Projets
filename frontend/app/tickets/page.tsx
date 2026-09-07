'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getTickets, createTicket, Ticket } from '@/lib/tickets';

const STATUS_LABELS: Record<string, string> = {
  open: 'Ouvert',
  in_progress: 'En cours',
  resolved: 'Résolu',
  closed: 'Fermé',
};

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Basse',
  medium: 'Moyenne',
  high: 'Haute',
  urgent: 'Urgente',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

export default function TicketsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('medium');
  const [isCreating, setIsCreating] = useState(false);

  const loadTickets = useCallback(async () => {
    setIsLoading(true);
    const data = await getTickets(statusFilter ? { status: statusFilter } : undefined);
    setTickets(data);
    setIsLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      loadTickets();
    }
  }, [authLoading, user, router, loadTickets]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await createTicket({ title, priority });
      setTitle('');
      setShowForm(false);
      await loadTickets();
    } finally {
      setIsCreating(false);
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
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">NEXUS</h1>
          <Link href="/dashboard" className="text-sm font-medium text-gray-700 hover:underline">
            ← Retour au dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Tickets</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            + Nouveau ticket
          </button>
        </div>

        <div className="mb-4 flex gap-2">
          {['', 'open', 'in_progress', 'resolved', 'closed'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-md px-3 py-1.5 text-sm ${
                statusFilter === status
                  ? 'bg-black text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {status === '' ? 'Tous' : STATUS_LABELS[status]}
            </button>
          ))}
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="mb-6 rounded-lg bg-white p-6 shadow">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Titre</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Priorité</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="mt-1 block rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              >
                <option value="low">Basse</option>
                <option value="medium">Moyenne</option>
                <option value="high">Haute</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={isCreating}
              className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {isCreating ? 'Création...' : 'Créer le ticket'}
            </button>
          </form>
        )}

        <div className="overflow-hidden rounded-lg bg-white shadow">
          {tickets.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/tickets/${ticket.id}`}
              className="flex items-center justify-between border-b border-gray-100 px-6 py-4 last:border-b-0 hover:bg-gray-50"
            >
              <div>
                <p className="font-medium text-gray-900">{ticket.title}</p>
                <p className="text-xs text-gray-500">
                  {STATUS_LABELS[ticket.status]} · Assigné à{' '}
                  {ticket.assignee ? ticket.assignee.name : 'personne'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {ticket.is_overdue && (
                  <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                    En retard
                  </span>
                )}
                <span
                  className={`rounded px-2 py-0.5 text-xs ${PRIORITY_COLORS[ticket.priority]}`}
                >
                  {PRIORITY_LABELS[ticket.priority]}
                </span>
              </div>
            </Link>
          ))}

          {tickets.length === 0 && (
            <p className="px-6 py-8 text-center text-gray-500">Aucun ticket pour le moment.</p>
          )}
        </div>
      </main>
    </div>
  );
}
