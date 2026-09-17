'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import {
  FolderKanban,
  Ticket as TicketIcon,
  PackageX,
  Receipt,
  AlertTriangle,
  Activity,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import NotificationBell from '@/components/NotificationBell';
import SearchBar from '@/components/SearchBar';
import { getDashboardSummary, DashboardSummary } from '@/lib/dashboard';

const STATUS_LABELS: Record<string, string> = {
  open: 'Ouvert',
  in_progress: 'En cours',
  resolved: 'Résolu',
  closed: 'Fermé',
};

const STATUS_COLORS: Record<string, string> = {
  open: '#f97316',
  in_progress: '#3b82f6',
  resolved: '#22c55e',
  closed: '#9ca3af',
};

const ACTION_LABELS: Record<string, string> = {
  create: 'a créé',
  update: 'a modifié',
  delete: 'a supprimé',
  login: "s'est connecté(e)",
  logout: "s'est déconnecté(e)",
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `il y a ${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  return `il y a ${diffDays} j`;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  const loadSummary = useCallback(async () => {
    try {
      const data = await getDashboardSummary();
      setSummary(data);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      loadSummary();
    }
  }, [isLoading, user, router, loadSummary]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-600">Chargement...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const chartData = summary
    ? Object.entries(summary.tickets_by_status)
        .filter(([, count]) => count > 0)
        .map(([status, count]) => ({
          name: STATUS_LABELS[status],
          value: count,
          color: STATUS_COLORS[status],
        }))
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">NEXUS</h1>
          <div className="flex items-center gap-4">
            <SearchBar />
            <NotificationBell />
            <button
              onClick={handleLogout}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Se déconnecter
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <h2 className="text-lg font-semibold text-gray-900">Bienvenue, {user.name}</h2>
        <p className="mt-1 text-sm text-gray-500">Voici un aperçu de votre organisation.</p>

        {/* Cartes chiffrées */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-white p-5 shadow">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-blue-50 p-2 text-blue-600">
                <FolderKanban size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {summaryLoading ? '—' : summary?.active_projects}
                </p>
                <p className="text-xs text-gray-500">Projets actifs</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-5 shadow">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-orange-50 p-2 text-orange-600">
                <TicketIcon size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {summaryLoading ? '—' : summary?.open_tickets}
                </p>
                <p className="text-xs text-gray-500">
                  Tickets ouverts
                  {!!summary?.overdue_tickets && (
                    <span className="ml-1 font-medium text-red-600">
                      ({summary.overdue_tickets} en retard)
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-5 shadow">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-red-50 p-2 text-red-600">
                <PackageX size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {summaryLoading ? '—' : summary?.low_stock_count}
                </p>
                <p className="text-xs text-gray-500">Produits en stock bas</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-5 shadow">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-purple-50 p-2 text-purple-600">
                <Receipt size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {summaryLoading ? '—' : `${formatCurrency(summary?.unpaid_total ?? 0)} €`}
                </p>
                <p className="text-xs text-gray-500">Factures impayées</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Graphique répartition tickets */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-sm font-semibold text-gray-900">Répartition des tickets</h3>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="mt-8 text-center text-sm text-gray-400">Aucun ticket pour l&apos;instant.</p>
            )}
          </div>

          {/* Alertes stock bas */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <AlertTriangle size={16} className="text-red-500" />
              Alertes stock bas
            </h3>
            <div className="mt-3 space-y-2">
              {summary?.low_stock_products.length ? (
                summary.low_stock_products.map((product) => (
                  <Link
                    key={product.id}
                    href={`/inventory/products/${product.id}`}
                    className="block rounded-md bg-red-50 px-3 py-2 text-sm hover:bg-red-100"
                  >
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-xs text-red-600">
                      {product.total_stock} / {product.threshold} unités
                    </p>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-gray-400">Aucune alerte pour l&apos;instant.</p>
              )}
            </div>
          </div>

          {/* Activité récente */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Activity size={16} className="text-gray-500" />
              Activité récente
            </h3>
            <div className="mt-3 space-y-3">
              {summary?.recent_activity.length ? (
                summary.recent_activity.map((activity) => (
                  <div key={activity.id} className="text-sm">
                    <p className="text-gray-700">
                      <span className="font-medium">{activity.user_name}</span>{' '}
                      {ACTION_LABELS[activity.action] ?? activity.action}{' '}
                      <span className="text-gray-500">{activity.auditable_type}</span>
                    </p>
                    <p className="text-xs text-gray-400">{formatRelativeDate(activity.created_at)}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400">Aucune activité récente.</p>
              )}
            </div>
          </div>
        </div>

        {/* Raccourcis modules */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/projects" className="rounded-lg bg-white p-6 shadow transition hover:shadow-md">
            <h3 className="font-semibold text-gray-900">Projets</h3>
            <p className="mt-1 text-sm text-gray-500">Gérer vos projets et tâches</p>
          </Link>

          <Link href="/tickets" className="rounded-lg bg-white p-6 shadow transition hover:shadow-md">
            <h3 className="font-semibold text-gray-900">Tickets</h3>
            <p className="mt-1 text-sm text-gray-500">Support et suivi des demandes</p>
          </Link>

          <Link href="/inventory/products" className="rounded-lg bg-white p-6 shadow transition hover:shadow-md">
            <h3 className="font-semibold text-gray-900">Inventaire</h3>
            <p className="mt-1 text-sm text-gray-500">Produits, fournisseurs et entrepôts</p>
          </Link>

          <Link href="/invoicing/clients" className="rounded-lg bg-white p-6 shadow transition hover:shadow-md">
            <h3 className="font-semibold text-gray-900">Facturation</h3>
            <p className="mt-1 text-sm text-gray-500">Clients, factures et paiements</p>
          </Link>

          <Link href="/settings/team" className="rounded-lg bg-white p-6 shadow transition hover:shadow-md">
            <h3 className="font-semibold text-gray-900">Équipe</h3>
            <p className="mt-1 text-sm text-gray-500">Gérer les membres et rôles</p>
          </Link>

          <Link href="/audit-logs" className="rounded-lg bg-white p-6 shadow transition hover:shadow-md">
            <h3 className="font-semibold text-gray-900">Audit</h3>
            <p className="mt-1 text-sm text-gray-500">Consulter les logs d&apos;activité</p>
          </Link>
        </div>
      </main>
    </div>
  );
}
