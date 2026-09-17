'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getAuditLogs, AuditLog, ACTION_LABELS, ACTION_COLORS } from '@/lib/audit';
import { getMembers, Member } from '@/lib/organization';

export default function AuditLogsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    action: '',
    user_id: '',
    date_from: '',
    date_to: '',
  });

  const loadData = useCallback(async () => {
    try {
      const filterParams = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== '')
      );
      const [logsData, membersData] = await Promise.all([
        getAuditLogs(filterParams),
        getMembers(),
      ]);
      // Si l'API retourne une structure paginée, extraire les données
      const logsArray = Array.isArray(logsData) ? logsData : ((logsData as { data?: import('@/lib/audit').AuditLog[] })?.data ?? []);
      setLogs(logsArray);
      setMembers(membersData);
    } catch {
      setLoadError("Vous n'avez pas accès à cette page.");
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      loadData();
    }
  }, [authLoading, user, router, loadData]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const resetFilters = () => {
    setFilters({ action: '', user_id: '', date_from: '', date_to: '' });
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-600">Chargement...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-md bg-red-50 p-4 text-sm text-red-700">
          {loadError}
        </div>
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
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Logs d&apos;audit</h2>
          <p className="text-sm text-gray-500">Historique des actions sur la plateforme</p>
        </div>

        {/* Filtres */}
        <div className="mb-6 grid grid-cols-1 gap-3 rounded-lg bg-white p-4 shadow sm:grid-cols-4">
          <div>
            <label className="block text-xs font-medium text-gray-500">Action</label>
            <select
              name="action"
              value={filters.action}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
            >
              <option value="">Toutes</option>
              {Object.entries(ACTION_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500">Utilisateur</label>
            <select
              name="user_id"
              value={filters.user_id}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
            >
              <option value="">Tous</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500">Du</label>
            <input
              type="date"
              name="date_from"
              value={filters.date_from}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500">Au</label>
            <input
              type="date"
              name="date_to"
              value={filters.date_to}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>

          <div className="col-span-full flex justify-end">
            <button
              onClick={resetFilters}
              className="text-sm text-gray-500 hover:underline"
            >
              Réinitialiser les filtres
            </button>
          </div>
        </div>

        {/* Liste des logs */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Utilisateur</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Entité</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Modifications</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Aucun log d&apos;audit trouvé.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const changes = [];
                  if (log.old_values && log.new_values) {
                    for (const key of Object.keys(log.new_values)) {
                      if (log.old_values[key] !== log.new_values[key]) {
                        changes.push({ key, old: log.old_values[key], new: log.new_values[key] });
                      }
                    }
                  }
                  return (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(log.created_at).toLocaleString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {log.user?.name || 'Système'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-700'}`}>
                          {ACTION_LABELS[log.action] || log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {log.auditable_type ? log.auditable_type.split('\\').pop() : '-'}
                        {log.auditable_id ? ` #${log.auditable_id}` : ''}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {changes.length > 0 ? (
                          <div className="space-y-1">
                            {changes.slice(0, 3).map((c) => (
                              <div key={c.key} className="text-xs">
                                <span className="font-medium">{c.key}</span>:
                                <span className="text-red-600 line-through ml-1">{String(c.old).substring(0, 30)}</span>
                                <span className="text-green-600 ml-1">→ {String(c.new).substring(0, 30)}</span>
                              </div>
                            ))}
                            {changes.length > 3 && <span className="text-xs text-gray-400">+{changes.length - 3} autres</span>}
                          </div>
                        ) : log.old_values && log.new_values ? (
                          <span className="text-xs text-gray-400">Aucune modification visible</span>
                        ) : log.action === 'create' ? (
                          <span className="text-xs text-gray-400">Création</span>
                        ) : log.action === 'delete' ? (
                          <span className="text-xs text-gray-400">Suppression</span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
