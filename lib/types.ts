import type { CategoryId, Unit } from '@/lib/categories';

export type Product = {
  id: string;
  name: string;
  category: CategoryId;
  brand: string | null;
  unit: Unit | string;
  quantity: number;
  min_quantity: number;
  cost_price: number;
  sale_price: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Customer = {
  id: string;
  name: string;
  phone: string | null;
  notes: string | null;
  created_at: string;
};

export type CustomerWithBalance = Customer & {
  balance: number;
};

export type Sale = {
  id: string;
  customer_id: string | null;
  total: number;
  paid: number;
  payment_method: 'cash' | 'credit' | 'mixed';
  note: string | null;
  created_at: string;
};

export type SaleItem = {
  id: string;
  sale_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  cost_price: number;
};

export type SaleWithDetails = Sale & {
  customer_name: string | null;
  item_count: number;
};

export type Payment = {
  id: string;
  customer_id: string;
  amount: number;
  note: string | null;
  created_at: string;
};

export type StockMove = {
  id: string;
  product_id: string;
  type: 'in' | 'out' | 'sale' | 'adjust';
  quantity: number;
  note: string | null;
  created_at: string;
};

export type DashboardStats = {
  todayTotal: number;
  todayCount: number;
  monthTotal: number;
  monthProfit: number;
  lowStockCount: number;
  debtTotal: number;
  debtorsCount: number;
  productCount: number;
};

export type CartLine = {
  productId: string;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  maxQuantity: number;
};
