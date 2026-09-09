'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  getProduct,
  getProductMovements,
  createStockMovement,
  getWarehouses,
  Product,
  StockMovement,
  Warehouse,
} from '@/lib/inventory';
import { ArrowLeft, Package, Warehouse as WarehouseIcon, User, Calendar, AlertTriangle, CheckCircle } from 'lucide-react';

const TYPE_LABELS: Record<string, string> = {
  in: 'Entrée',
  out: 'Sortie',
  adjustment: 'Ajustement',
};

const TYPE_COLORS: Record<string, string> = {
  in: 'text-green-600 bg-green-50',
  out: 'text-red-600 bg-red-50',
  adjustment: 'text-blue-600 bg-blue-50',
};

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const productId = Number(params.id);
  const { user, isLoading: authLoading } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Formulaire mouvement
  const [showForm, setShowForm] = useState(false);
  const [movementType, setMovementType] = useState<'in' | 'out' | 'adjustment'>('in');
  const [warehouseId, setWarehouseId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [productData, movementsData, warehousesData] = await Promise.all([
        getProduct(productId),
        getProductMovements(productId),
        getWarehouses(),
      ]);
      setProduct(productData);
      setMovements(movementsData);
      setWarehouses(warehousesData);
      if (warehousesData.length > 0 && warehouseId === null) {
        setWarehouseId(warehousesData[0].id);
      }
    } catch {
      setLoadError("Ce produit n'existe pas ou vous n'y avez pas accès.");
    } finally {
      setIsLoading(false);
    }
  }, [productId, warehouseId]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      loadData();
    }
  }, [authLoading, user, router, loadData]);

  const handleSubmitMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!warehouseId || quantity < 1) return;

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      await createStockMovement(productId, {
        warehouse_id: warehouseId,
        type: movementType,
        quantity,
        reason: reason || undefined,
      });
      await loadData();
      setShowForm(false);
      setQuantity(1);
      setReason('');
    } catch (err: any) {
      if (err.response?.data?.message) {
        setSubmitError(err.response.data.message);
      } else {
        setSubmitError('Une erreur est survenue.');
      }
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

  if (loadError || !product) {
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
        <div className="mb-4">
          <Link href="/inventory/products" className="text-sm text-gray-500 hover:underline">
            <ArrowLeft size={16} className="inline mr-1" />
            Retour à l'inventaire
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Informations produit */}
          <div className="md:col-span-2">
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>
                {product.sku && <p className="text-sm text-gray-500">SKU : {product.sku}</p>}
                <div className="mt-2 flex gap-2">
                  <a
                    href={`${process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/v1$/, "") || "http://localhost:8000"}/api/v1/products/${productId}/qrcode`}
                    target="_blank"
                    className="inline-block rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    QR Code
                  </a>
                </div>
                  {product.sku && <p className="text-sm text-gray-500">SKU : {product.sku}</p>}
                </div>
                {product.is_low_stock ? (
                  <span className="flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">
                    <AlertTriangle size={14} />
                    Stock bas
                  </span>
                ) : (
                  <span className="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                    <CheckCircle size={14} />
                    Stock OK
                  </span>
                )}
              </div>

              {product.description && (
                <p className="mt-4 text-sm text-gray-600">{product.description}</p>
              )}

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500">Prix unitaire</p>
                  <p className="text-lg font-semibold text-gray-900">{product.unit_price} €</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">Stock total</p>
                  <p className="text-lg font-semibold text-gray-900">{product.total_stock}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">Seuil d'alerte</p>
                  <p className="text-sm text-gray-700">{product.low_stock_threshold}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">Fournisseur</p>
                  <p className="text-sm text-gray-700">{product.supplier?.name || 'Aucun'}</p>
                </div>
              </div>

              {/* Entrepôts et stocks */}
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-700">Stock par entrepôt</h4>
                <div className="mt-2 space-y-1">
                  {product.warehouses.map((w) => (
                    <div key={w.id} className="flex justify-between text-sm">
                      <span className="text-gray-600">{w.name}</span>
                      <span className="font-medium text-gray-900">{w.pivot.quantity}</span>
                    </div>
                  ))}
                  {product.warehouses.length === 0 && (
                    <p className="text-sm text-gray-400">Aucun stock enregistré</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action rapide : mouvement de stock */}
          <div>
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="text-sm font-medium text-gray-900">Mouvement de stock</h3>
              {!showForm ? (
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-4 w-full rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                >
                  + Enregistrer un mouvement
                </button>
              ) : (
                <form onSubmit={handleSubmitMovement} className="mt-4 space-y-3">
                  {submitError && (
                    <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{submitError}</div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-gray-500">Type</label>
                    <select
                      value={movementType}
                      onChange={(e) => setMovementType(e.target.value as 'in' | 'out' | 'adjustment')}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                    >
                      <option value="in">Entrée</option>
                      <option value="out">Sortie</option>
                      <option value="adjustment">Ajustement</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500">Entrepôt</label>
                    <select
                      value={warehouseId || ''}
                      onChange={(e) => setWarehouseId(Number(e.target.value))}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                    >
                      {warehouses.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500">Quantité</label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500">Motif (optionnel)</label>
                    <input
                      type="text"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Réception, vente, etc."
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
                      onClick={() => setShowForm(false)}
                      className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Historique des mouvements */}
        <div className="mt-6 rounded-lg bg-white p-6 shadow">
          <h3 className="text-sm font-medium text-gray-900">Historique des mouvements</h3>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900">Historique des mouvements</h3>
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/v1$/, "") || "http://localhost:8000"}/api/v1/products/${productId}/movements/export`}
            className="text-sm text-blue-600 hover:underline"
          >
            Exporter CSV
          </a>
        </div>
          <div className="mt-4 space-y-2">
            {movements.map((movement) => (
              <div
                key={movement.id}
                className="flex items-center justify-between rounded-md border border-gray-100 p-3"
              >
                <div className="flex items-center gap-4">
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[movement.type]}`}>
                    {TYPE_LABELS[movement.type]}
                  </span>
                  <span className="font-medium text-gray-900">{movement.quantity}</span>
                  <span className="text-sm text-gray-500">
                    <WarehouseIcon size={14} className="inline mr-1" />
                    {movement.warehouse.name}
                  </span>
                  {movement.reason && (
                    <span className="text-sm text-gray-400">— {movement.reason}</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>
                    <User size={12} className="inline mr-1" />
                    {movement.creator.name}
                  </span>
                  <span>
                    <Calendar size={12} className="inline mr-1" />
                    {new Date(movement.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
            ))}
            {movements.length === 0 && (
              <p className="text-sm text-gray-400">Aucun mouvement enregistré.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
