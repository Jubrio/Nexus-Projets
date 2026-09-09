'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { search, SearchResult } from '@/lib/search';

export default function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (query.length >= 2) {
        setIsLoading(true);
        try {
          const data = await search(query);
          setResults(data);
          setIsOpen(true);
        } catch {
          setResults(null);
        } finally {
          setIsLoading(false);
        }
      } else {
        setResults(null);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.length >= 2) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
      setIsOpen(false);
    }
  };

  const totalResults = results?.results
    ? Object.values(results.results).reduce((acc, arr) => acc + (arr?.length || 0), 0)
    : 0;

  return (
    <div ref={wrapperRef} className="relative w-64">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Rechercher..."
          className="w-full rounded-md border border-gray-200 bg-gray-50 py-1.5 pl-9 pr-8 text-sm text-gray-900 placeholder-gray-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setIsOpen(false); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {isOpen && results && totalResults > 0 && (
        <div className="absolute right-0 z-50 mt-2 w-96 rounded-md border border-gray-200 bg-white shadow-lg">
          <div className="max-h-80 overflow-y-auto p-2">
            {Object.entries(results.results).map(([type, items]) => {
              if (!items || items.length === 0) return null;
              const labels: Record<string, string> = {
                projects: 'Projets',
                tickets: 'Tickets',
                clients: 'Clients',
                invoices: 'Factures',
                products: 'Produits',
              };
              return (
                <div key={type} className="mb-2">
                  <div className="px-3 py-1 text-xs font-medium uppercase text-gray-400">
                    {labels[type] || type}
                  </div>
                  {items.map((item: any) => (
                    <Link
                      key={item.id}
                      href={`/${type}/${item.id}`}
                      className="block rounded-md px-3 py-2 text-sm hover:bg-gray-50"
                      onClick={() => setIsOpen(false)}
                    >
                      <span className="font-medium text-gray-900">
                        {item.name || item.title || item.invoice_number || item.company}
                      </span>
                      <span className="ml-2 text-xs text-gray-400">
                        {item.status && `(${item.status})`}
                      </span>
                    </Link>
                  ))}
                </div>
              );
            })}
          </div>
          <div className="border-t border-gray-100 px-3 py-2 text-xs text-gray-400">
            {totalResults} résultat{totalResults > 1 ? 's' : ''} · Appuyez sur Entrée pour voir tout
          </div>
        </div>
      )}
    </div>
  );
}
