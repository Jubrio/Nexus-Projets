'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  getInvoice,
  updateInvoice,
  createPayment,
  deletePayment,
  Invoice,
  Payment,
  STATUS_LABELS,
  STATUS_COLORS,
  METHOD_LABELS,
} from '@/lib/invoicing';
import { ArrowLeft, Plus, Trash2, CheckCircle } from 'lucide-react';

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = Number(params.id);
  const { user, isLoading: authLoading } = useAuth();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [paymentReference, setPaymentReference] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadInvoice = useCallback(async () => {
    try {
      const data = await getInvoice(invoiceId);
      setInvoice(data);
    } catch {
      setLoadError("Cette facture n'existe pas ou vous n'y avez pas accès.");
    } finally {
      setIsLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      loadInvoice();
    }
  }, [authLoading, user, router, loadInvoice]);

  const handleStatusChange = async (status: string) => {
    try {
      await updateInvoice(invoiceId, { status });
      await loadInvoice();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur');
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await createPayment({
        invoice_id: invoiceId,
        amount: parseFloat(paymentAmount),
        payment_date: paymentDate,
        method: paymentMethod,
        reference: paymentReference || undefined,
      });
      setShowPaymentForm(false);
      setPaymentAmount('');
      setPaymentReference('');
      await loadInvoice();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Une erreur est survenue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePayment = async (paymentId: number) => {
    if (!confirm('Supprimer ce paiement ?')) return;
    try {
      await deletePayment(paymentId);
      await loadInvoice();
    } catch {
      alert('Erreur lors de la suppression.');
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-600">Chargement...</p>
      </div>
    );
  }

  if (loadError || !invoice) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-md bg-red-50 p-4 text-sm text-red-700">
          {loadError}
        </div>
      </div>
    );
  }

  const remaining = invoice.remaining_amount ?? 0;
  const isPaid = invoice.status === 'paid' || remaining <= 0;

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

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Informations de la facture */}
          <div className="lg:col-span-2">
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{invoice.invoice_number}</h2>
                  <p className="text-sm text-gray-500">
                    Client : {invoice.client?.name}
                    {invoice.client?.company && ` (${invoice.client.company})`}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-sm font-medium ${STATUS_COLORS[invoice.status]}`}>
                  {STATUS_LABELS[invoice.status] || invoice.status}
                </span>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500">Émission</p>
                  <p className="text-sm text-gray-900">{new Date(invoice.issue_date).toLocaleDateString('fr-FR')}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">Échéance</p>
                  <p className="text-sm text-gray-900">{new Date(invoice.due_date).toLocaleDateString('fr-FR')}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">Total</p>
                  <p className="text-lg font-bold text-gray-900">{invoice.total} €</p>
                </div>
              </div>

              {invoice.notes && (
                <div className="mt-4 rounded-md bg-gray-50 p-3">
                  <p className="text-sm text-gray-600">{invoice.notes}</p>
                </div>
              )}

              {/* Lignes de facture */}
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-700">Détail</h4>
                <table className="mt-2 w-full text-sm">
                  <thead className="border-b border-gray-200">
                    <tr>
                      <th className="py-2 text-left font-medium text-gray-500">Description</th>
                      <th className="py-2 text-right font-medium text-gray-500">Qté</th>
                      <th className="py-2 text-right font-medium text-gray-500">Prix</th>
                      <th className="py-2 text-right font-medium text-gray-500">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.lines?.map((line) => (
                      <tr key={line.id} className="border-b border-gray-100">
                        <td className="py-2 text-gray-900">{line.description}</td>
                        <td className="py-2 text-right text-gray-600">{line.quantity}</td>
                        <td className="py-2 text-right text-gray-600">{line.unit_price} €</td>
                        <td className="py-2 text-right font-medium text-gray-900">{line.total} €</td>
                      </tr>
                    ))}
                    <tr className="border-t border-gray-200 font-medium">
                      <td colSpan={3} className="py-2 text-right">Sous-total</td>
                      <td className="py-2 text-right">{invoice.subtotal} €</td>
                    </tr>
                    <tr className="text-sm">
                      <td colSpan={3} className="py-2 text-right text-gray-600">TVA ({invoice.tax_rate}%)</td>
                      <td className="py-2 text-right text-gray-600">{invoice.tax_amount} €</td>
                    </tr>
                    <tr className="border-t border-gray-200 font-bold">
                      <td colSpan={3} className="py-2 text-right">Total</td>
                      <td className="py-2 text-right">{invoice.total} €</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Paiements */}
          <div>
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="text-sm font-medium text-gray-900">Paiements</h3>

              <div className="mt-4 space-y-2">
                {invoice.payments?.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between rounded-md border border-gray-100 p-3">
                    <div>
                      <p className="font-medium text-gray-900">{payment.amount} €</p>
                      <p className="text-xs text-gray-500">
                        {new Date(payment.payment_date).toLocaleDateString('fr-FR')}
                        <br />
                        {METHOD_LABELS[payment.method] || payment.method}
                        {payment.reference && ` (${payment.reference})`}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeletePayment(payment.id)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {(!invoice.payments || invoice.payments.length === 0) && (
                  <p className="text-sm text-gray-400">Aucun paiement enregistré</p>
                )}
              </div>

              <div className="mt-4 border-t border-gray-200 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Payé</span>
                  <span className="font-medium text-gray-900">{invoice.paid_amount ?? 0} €</span>
                </div>
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-gray-600">Restant</span>
                  <span className={remaining > 0 ? 'text-red-600' : 'text-green-600'}>
                    {remaining.toFixed(2)} €
                  </span>
                </div>
              </div>

              {!isPaid && (
                <>
                  {!showPaymentForm ? (
                    <button
                      onClick={() => setShowPaymentForm(true)}
                      className="mt-4 w-full rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                    >
                      <Plus size={16} className="inline mr-1" />
                      Enregistrer un paiement
                    </button>
                  ) : (
                    <form onSubmit={handlePaymentSubmit} className="mt-4 space-y-3">
                      {error && (
                        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
                      )}
                      <div>
                        <label className="block text-xs font-medium text-gray-500">Montant</label>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          required
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500">Date</label>
                        <input
                          type="date"
                          required
                          value={paymentDate}
                          onChange={(e) => setPaymentDate(e.target.value)}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500">Méthode</label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                        >
                          <option value="cash">Espèces</option>
                          <option value="bank_transfer">Virement bancaire</option>
                          <option value="credit_card">Carte de crédit</option>
                          <option value="check">Chèque</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500">Référence</label>
                        <input
                          type="text"
                          value={paymentReference}
                          onChange={(e) => setPaymentReference(e.target.value)}
                          placeholder="Optionnel"
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="flex-1 rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                        >
                          {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowPaymentForm(false)}
                          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Annuler
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}

              {/* Actions sur la facture */}
              <div className="mt-4 border-t border-gray-200 pt-4">
                <label className="block text-xs font-medium text-gray-500">Changer le statut</label>
                <select
                  value={invoice.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                >
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
