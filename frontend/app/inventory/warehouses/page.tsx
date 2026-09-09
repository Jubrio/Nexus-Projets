'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getWarehouses, createWarehouse, updateWarehouse, deleteWarehouse, Warehouse } from '@/lib/inventory';
import { Pencil, Trash2, Plus, X, Warehouse as WarehouseIcon } from 'lucide-react';

export default function WarehousesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formName, setFormName] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadWarehouses = useCallback(async () => {
    try {
      const data = await getWarehouses();
      setWarehouses(data);
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
      loadWarehouses();
    }
  }, [authLoading, user, router, loadWarehouses]);

  const resetForm = () => {
    setFormName('');
    setFormLocation('');
    setEditingId(null);
    setSubmitError(null);
    setShowForm(false);
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (warehouse: Warehouse) => {
    setFormName(warehouse.name);
    setFormLocation(warehouse.location || '');
    setEditingId(warehouse.id);
    setSubmitError(null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const data = { name: formName.trim(), location: formLocation || undefined };
      if (editingId) {
        await updateWarehouse(editingId, data);
      } else {
        await createWarehouse(data);
      }
      await loadWarehouses();
      resetForm();
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || 'Une erreur est survenue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cet entrepôt ?')) return;
    setDeletingId(id);
    try {
      await deleteWarehouse(id);
      await loadWarehouses();
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
            <h2 className="text-2xl font-bold text-gray-900">Entrepôts</h2>
            <p className="text-sm text-gray-500">Gestion des entrepôts de l&apos;organisation</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/inventory/products"
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Produits
            </Link>
            <Link
              href="/inventory/suppliers"
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Fournisseurs
            </Link>
            <button
              onClick={openCreate}
              className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              <Plus size={16} className="inline mr-1" />
              Nouvel entrepôt
            </button>
          </div>
        </div>

        {loadError && (
          <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">{loadError}</div>
        )}

        {/* Formulaire de création/édition */}
        {showForm && (
          <div className="mb-6 rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">
                {editingId ? 'Modifier l\'entrepôt' : 'Nouvel entrepôt'}
              </h3>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              {submitError && (
                <div className="md:col-span-2 rounded-md bg-red-50 p-3 text-sm text-red-700">{submitError}</div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-500">Nom *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500">Localisation</label>
                <input
                  type="text"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  placeholder="Ville, adresse, etc."
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
              <div className="md:col-span-2 flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  {isSubmitting ? 'Enregistrement...' : editingId ? 'Mettre à jour' : 'Créer'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Liste des entrepôts */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {warehouses.map((warehouse) => (
            <div key={warehouse.id} className="rounded-lg bg-white p-5 shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <WarehouseIcon size={24} className="mt-1 text-gray-400" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{warehouse.name}</h3>
                    {warehouse.location && (
                      <p className="text-sm text-gray-500">{warehouse.location}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(warehouse)}
                    className="rounded p-1 text-gray-400 hover:text-gray-600"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(warehouse.id)}
                    disabled={deletingId === warehouse.id}
                    className="rounded p-1 text-gray-400 hover:text-red-600 disabled:opacity-50"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {warehouses.length === 0 && !loadError && (
            <p className="col-span-full text-center text-gray-500">
              Aucun entrepôt. Créez-en un pour commencer !
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
