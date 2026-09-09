'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getClients, createInvoice, Client } from '@/lib/invoicing';
import { ArrowLeft, Plus, X } from 'lucide-react';

interface Line {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    client_id: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    tax_rate: 20,
    notes: '',
  });

  const [lines, setLines] = useState<Line[]>([
    { id: crypto.randomUUID(), description: '', quantity: 1, unit_price: 0 },
  ]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      getClients()
        .then(setClients)
        .catch(() => setError('Impossible de charger les clients'))
        .finally(() => setIsLoading(false));
    }
  }, [authLoading, user, router]);

  const addLine = () => {
    setLines([...lines, { id: crypto.randomUUID(), description: '', quantity: 1, unit_price: 0 }]);
  };

  const removeLine = (id: string) => {
    if (lines.length <= 1) return;
    setLines(lines.filter((l) => l.id !== id));
  };

  const updateLine = (id: string, field: keyof Line, value: string | number) => {
    setLines(lines.map((l) => (l.id === id ? { ...l, [field]: value } : l)));
  };

  const calculateLineTotal = (line: Line) => {
    return line.quantity * line.unit_price;
  };

  const calculateSubtotal = () => {
    return lines.reduce((sum, l) => sum + calculateLineTotal(l), 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * (formData.tax_rate / 100);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const validLines = lines.filter((l) => l.description.trim() && l.quantity > 0 && l.unit_price > 0);
      if (validLines.length === 0) {
        throw new Error('Ajoutez au moins une ligne valide.');
      }

      await createInvoice({
        client_id: Number(formData.client_id),
        issue_date: formData.issue_date,
        due_date: formData.due_date,
        tax_rate: formData.tax_rate,
        notes: formData.notes || undefined,
        lines: validLines.map((l) => ({
          description: l.description,
          quantity: l.quantity,
          unit_price: l.unit_price,
        })),
      });

      router.push('/invoicing/invoices?created=true');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Une erreur est survenue.');
    } finally {
      setIsSubmitting(false);
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
        <div className="mb-4">
          <Link href="/invoicing/invoices" className="text-sm text-gray-500 hover:underline">
            <ArrowLeft size={16} className="inline mr-1" />
            Retour aux factures
          </Link>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-gray-900">Nouvelle facture</h2>

          {error && (
            <div className="mt-4 rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Client *</label>
                <select
                  required
                  value={formData.client_id}
                  onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                >
                  <option value="">Sélectionner un client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.company ? `(${c.company})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">TVA (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.tax_rate}
                  onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date d&apos;émission *</label>
                <input
                  type="date"
                  required
                  value={formData.issue_date}
                  onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date d&apos;échéance *</label>
                <input
                  type="date"
                  required
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900">Lignes de facture</h3>
                <button
                  type="button"
                  onClick={addLine}
                  className="text-sm text-blue-600 hover:underline"
                >
                  <Plus size={16} className="inline mr-1" />
                  Ajouter une ligne
                </button>
              </div>

              <div className="mt-3 space-y-2">
                {lines.map((line) => (
                  <div key={line.id} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Description"
                      value={line.description}
                      onChange={(e) => updateLine(line.id, 'description', e.target.value)}
                      className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                    />
                    <input
                      type="number"
                      placeholder="Qté"
                      min="1"
                      value={line.quantity}
                      onChange={(e) => updateLine(line.id, 'quantity', parseInt(e.target.value) || 0)}
                      className="w-20 rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                    />
                    <input
                      type="number"
                      placeholder="Prix"
                      min="0"
                      step="0.01"
                      value={line.unit_price}
                      onChange={(e) => updateLine(line.id, 'unit_price', parseFloat(e.target.value) || 0)}
                      className="w-28 rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                    />
                    <span className="flex items-center text-sm text-gray-500">
                      {calculateLineTotal(line).toFixed(2)} €
                    </span>
                    <button
                      type="button"
                      onClick={() => removeLine(line.id)}
                      className="rounded p-1 text-gray-400 hover:text-red-600"
                    >
                      <X size={20} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <div className="ml-auto max-w-xs space-y-1 text-right">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Sous-total</span>
                  <span className="font-medium text-gray-900">{calculateSubtotal().toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">TVA ({formData.tax_rate}%)</span>
                  <span className="font-medium text-gray-900">{calculateTax().toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{calculateTotal().toFixed(2)} €</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-md bg-black px-4 py-2 text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {isSubmitting ? 'Création...' : 'Créer la facture'}
              </button>
              <Link
                href="/invoicing/invoices"
                className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
