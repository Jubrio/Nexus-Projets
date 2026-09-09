'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { search, SearchResult } from '@/lib/search';
import { ArrowLeft, Search } from 'lucide-react';

function SearchResults() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const { user, isLoading: authLoading } = useAuth();
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user && query.length >= 2) {
      search(query)
        .then(setResults)
        .catch(() => setError('Erreur lors de la recherche'))
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [query, user, authLoading, router]);

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-600">Chargement...</p>
      </div>
    );
  }

  const totalResults = results?.results
    ? Object.values(results.results).reduce((acc, arr) => acc + (arr?.length || 0), 0)
    : 0;

  const labels: Record<string, { label: string; route: string; fields: string[] }> = {
    projects: { label: 'Projets', route: 'projects', fields: ['name', 'description'] },
    tickets: { label: 'Tickets', route: 'tickets', fields: ['title', 'description'] },
    clients: { label: 'Clients', route: 'invoicing/clients', fields: ['name', 'company', 'email'] },
    invoices: { label: 'Factures', route: 'invoicing/invoices', fields: ['invoice_number'] },
    products: { label: 'Produits', route: 'inventory/products', fields: ['name', 'sku'] },
  };

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
        <div className="mb-4 flex items-center gap-2">
          <Link href="/dashboard" className="text-sm text-gray-500 hover:underline">
            <ArrowLeft size={16} className="inline mr-1" />
            Retour
          </Link>
        </div>

        <div className="mb-6 flex items-center gap-3">
          <Search size={24} className="text-gray-400" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Résultats pour "{query}"</h2>
            <p className="text-sm text-gray-500">{totalResults} résultat{totalResults !== 1 ? 's' : ''} trouvé{totalResults !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>
        )}

        {totalResults === 0 && !error && (
          <div className="rounded-lg bg-white p-8 text-center shadow">
            <p className="text-gray-500">Aucun résultat trouvé pour "{query}"</p>
            <p className="mt-2 text-sm text-gray-400">Essayez avec d'autres mots-clés</p>
          </div>
        )}

        <div className="space-y-6">
          {results && Object.entries(results.results).map(([type, items]) => {
            if (!items || items.length === 0) return null;
            const config = labels[type];
            if (!config) return null;

            return (
              <div key={type} className="rounded-lg bg-white shadow">
                <div className="border-b border-gray-100 px-6 py-3">
                  <h3 className="text-sm font-semibold text-gray-900">{config.label}</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {items.map((item: any) => (
                    <Link
                      key={item.id}
                      href={`/${config.route}/${item.id}`}
                      className="block px-6 py-3 hover:bg-gray-50"
                    >
                      <div className="font-medium text-gray-900">
                        {item.name || item.title || item.invoice_number || item.company}
                      </div>
                      <div className="mt-1 text-sm text-gray-500">
                        {config.fields.map((field) => {
                          if (field === 'invoice_number' && item.client) {
                            return `Client: ${item.client.name}`;
                          }
                          if (field === 'sku' && item.sku) {
                            return `SKU: ${item.sku}`;
                          }
                          if (item[field]) {
                            return `${field}: ${item[field]}`;
                          }
                          return null;
                        }).filter(Boolean).join(' · ')}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-gray-50"><p className="text-gray-600">Chargement...</p></div>}>
      <SearchResults />
    </Suspense>
  );
}
