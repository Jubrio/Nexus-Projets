import { api } from './api';

export interface Supplier {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
}

export interface Warehouse {
  id: number;
  name: string;
  location: string | null;
}

export interface Product {
  id: number;
  tenant_id: number;
  supplier_id: number | null;
  sku: string | null;
  name: string;
  description: string | null;
  unit_price: string;
  low_stock_threshold: number;
  total_stock: number;
  is_low_stock: boolean;
  supplier: Supplier | null;
  warehouses: (Warehouse & { pivot: { quantity: number } })[];
}

export interface StockMovement {
  id: number;
  product_id: number;
  warehouse_id: number;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string | null;
  created_at: string;
  warehouse: Warehouse;
  creator: { id: number; name: string };
}

// ---- Fournisseurs ----
export async function getSuppliers(): Promise<Supplier[]> {
  const response = await api.get<Supplier[]>('/suppliers');
  return response.data;
}

export async function createSupplier(data: { name: string; email?: string; phone?: string; address?: string }): Promise<Supplier> {
  const response = await api.post<Supplier>('/suppliers', data);
  return response.data;
}

export async function updateSupplier(id: number, data: Partial<Supplier>): Promise<Supplier> {
  const response = await api.put<Supplier>(`/suppliers/${id}`, data);
  return response.data;
}

export async function deleteSupplier(id: number): Promise<void> {
  await api.delete(`/suppliers/${id}`);
}

// ---- Entrepôts ----
export async function getWarehouses(): Promise<Warehouse[]> {
  const response = await api.get<Warehouse[]>('/warehouses');
  return response.data;
}

export async function createWarehouse(data: { name: string; location?: string }): Promise<Warehouse> {
  const response = await api.post<Warehouse>('/warehouses', data);
  return response.data;
}

export async function updateWarehouse(id: number, data: Partial<Warehouse>): Promise<Warehouse> {
  const response = await api.put<Warehouse>(`/warehouses/${id}`, data);
  return response.data;
}

export async function deleteWarehouse(id: number): Promise<void> {
  await api.delete(`/warehouses/${id}`);
}

// ---- Produits ----
export async function getProducts(): Promise<Product[]> {
  const response = await api.get<Product[]>('/products');
  return response.data;
}

export async function getProduct(id: number): Promise<Product> {
  const response = await api.get<Product>(`/products/${id}`);
  return response.data;
}

export async function createProduct(data: {
  name: string;
  sku?: string;
  description?: string;
  supplier_id?: number;
  unit_price: number;
  low_stock_threshold?: number;
}): Promise<Product> {
  const response = await api.post<Product>('/products', data);
  return response.data;
}

export async function updateProduct(id: number, data: Partial<Product>): Promise<Product> {
  const response = await api.put<Product>(`/products/${id}`, data);
  return response.data;
}

export async function deleteProduct(id: number): Promise<void> {
  await api.delete(`/products/${id}`);
}

// ---- Mouvements de stock ----
export async function getProductMovements(productId: number): Promise<StockMovement[]> {
  const response = await api.get<StockMovement[]>(`/products/${productId}/movements`);
  return response.data;
}

export async function createStockMovement(productId: number, data: {
  warehouse_id: number;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason?: string;
}): Promise<{ movement: StockMovement; new_total_stock: number }> {
  const response = await api.post(`/products/${productId}/movements`, data);
  return response.data;
}
