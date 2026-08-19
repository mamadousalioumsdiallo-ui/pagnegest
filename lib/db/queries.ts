import type { BoutiqueDatabase } from '@/lib/db/types';

import { getCategory, type CategoryId, type Unit } from '@/lib/categories';
import { daysAgoISO, startOfDayISO, startOfMonthISO } from '@/lib/format';
import { createId } from '@/lib/id';
import { cartTotal, customerBalance, paymentMethod } from '@/lib/saleMath';
import type {
  CartLine,
  Customer,
  CustomerWithBalance,
  DashboardStats,
  Payment,
  Product,
  Sale,
  SaleItem,
  SaleReturn,
  SaleWithDetails,
  StockMove,
} from '@/lib/types';

const ACTIVE_SALE = "(status IS NULL OR status = 'completed')";
const ACTIVE_SALE_S = "(s.status IS NULL OR s.status = 'completed')";

export async function getMeta(db: BoutiqueDatabase, key: string, fallback = ''): Promise<string> {
  const row = await db.getFirstAsync<{ value: string | null }>(
    'SELECT value FROM meta WHERE key = ?',
    key
  );
  return row?.value ?? fallback;
}

export async function setMeta(db: BoutiqueDatabase, key: string, value: string): Promise<void> {
  await db.runAsync('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)', key, value);
}

export async function listProducts(
  db: BoutiqueDatabase,
  options: { query?: string; category?: string | 'all' } = {}
): Promise<Product[]> {
  const clauses: string[] = [];
  const params: (string | number)[] = [];
  if (options.category && options.category !== 'all') {
    clauses.push('category = ?');
    params.push(options.category);
  }
  if (options.query?.trim()) {
    clauses.push("(name LIKE ? OR IFNULL(brand, '') LIKE ?)");
    const like = `%${options.query.trim()}%`;
    params.push(like, like);
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  return db.getAllAsync<Product>(
    `SELECT * FROM products ${where} ORDER BY name COLLATE NOCASE ASC`,
    params
  );
}

export async function getProduct(db: BoutiqueDatabase, id: string): Promise<Product | null> {
  return db.getFirstAsync<Product>('SELECT * FROM products WHERE id = ?', id);
}

export async function upsertProduct(
  db: BoutiqueDatabase,
  input: {
    id?: string;
    name: string;
    category: CategoryId;
    brand?: string;
    unit: Unit | string;
    quantity: number;
    min_quantity: number;
    cost_price: number;
    sale_price: number;
    notes?: string;
    image_uri?: string | null;
  }
): Promise<string> {
  const now = new Date().toISOString();
  const id = input.id ?? createId();
  const existing = input.id ? await getProduct(db, input.id) : null;
  const imageUri = input.image_uri !== undefined ? input.image_uri : (existing?.image_uri ?? null);
  if (existing) {
    await db.runAsync(
      `UPDATE products SET
        name = ?, category = ?, brand = ?, unit = ?, quantity = ?, min_quantity = ?,
        cost_price = ?, sale_price = ?, notes = ?, image_uri = ?, updated_at = ?
       WHERE id = ?`,
      input.name.trim(),
      input.category,
      input.brand?.trim() || null,
      input.unit,
      input.quantity,
      input.min_quantity,
      input.cost_price,
      input.sale_price,
      input.notes?.trim() || null,
      imageUri,
      now,
      id
    );
  } else {
    await db.runAsync(
      `INSERT INTO products (
        id, name, category, brand, unit, quantity, min_quantity, cost_price, sale_price, notes, image_uri, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      input.name.trim(),
      input.category,
      input.brand?.trim() || null,
      input.unit,
      input.quantity,
      input.min_quantity,
      input.cost_price,
      input.sale_price,
      input.notes?.trim() || null,
      imageUri,
      now,
      now
    );
    if (input.quantity > 0) {
      await db.runAsync(
        `INSERT INTO stock_moves (id, product_id, type, quantity, note, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        createId(),
        id,
        'in',
        input.quantity,
        'Stock initial',
        now
      );
    }
  }
  return id;
}

export async function deleteProduct(db: BoutiqueDatabase, id: string): Promise<void> {
  const used = await db.getFirstAsync<{ c: number }>(
    'SELECT COUNT(*) as c FROM sale_items WHERE product_id = ?',
    id
  );
  if ((used?.c ?? 0) > 0) {
    throw new Error('Ce produit a déjà été vendu. Vous pouvez mettre la quantité à 0.');
  }
  await db.runAsync('DELETE FROM stock_moves WHERE product_id = ?', id);
  await db.runAsync('DELETE FROM products WHERE id = ?', id);
}

export async function adjustStock(
  db: BoutiqueDatabase,
  productId: string,
  delta: number,
  note?: string
): Promise<void> {
  const product = await getProduct(db, productId);
  if (!product) throw new Error('Produit introuvable');
  const next = product.quantity + delta;
  if (next < 0) throw new Error('Le stock ne peut pas être négatif');
  const now = new Date().toISOString();
  const type = delta >= 0 ? 'in' : 'out';
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      'UPDATE products SET quantity = ?, updated_at = ? WHERE id = ?',
      next,
      now,
      productId
    );
    await db.runAsync(
      `INSERT INTO stock_moves (id, product_id, type, quantity, note, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      createId(),
      productId,
      type,
      Math.abs(delta),
      note?.trim() || (delta >= 0 ? 'Entrée stock' : 'Sortie stock'),
      now
    );
  });
}

export async function listStockMoves(db: BoutiqueDatabase, productId: string): Promise<StockMove[]> {
  return db.getAllAsync<StockMove>(
    'SELECT * FROM stock_moves WHERE product_id = ? ORDER BY created_at DESC LIMIT 30',
    productId
  );
}

export async function listLowStock(db: BoutiqueDatabase): Promise<Product[]> {
  return db.getAllAsync<Product>(
    'SELECT * FROM products WHERE quantity <= min_quantity ORDER BY quantity ASC, name ASC'
  );
}

export async function listCustomers(db: BoutiqueDatabase, query = ''): Promise<CustomerWithBalance[]> {
  const like = `%${query.trim()}%`;
  const customers = query.trim()
    ? await db.getAllAsync<Customer>(
        "SELECT * FROM customers WHERE name LIKE ? OR IFNULL(phone, '') LIKE ? ORDER BY name COLLATE NOCASE",
        like,
        like
      )
    : await db.getAllAsync<Customer>('SELECT * FROM customers ORDER BY name COLLATE NOCASE');

  const withBalances: CustomerWithBalance[] = [];
  for (const customer of customers) {
    const balance = await getCustomerBalance(db, customer.id);
    withBalances.push({ ...customer, balance });
  }
  return withBalances;
}

export async function getCustomer(db: BoutiqueDatabase, id: string): Promise<Customer | null> {
  return db.getFirstAsync<Customer>('SELECT * FROM customers WHERE id = ?', id);
}

export async function upsertCustomer(
  db: BoutiqueDatabase,
  input: { id?: string; name: string; phone?: string; notes?: string }
): Promise<string> {
  const id = input.id ?? createId();
  const existing = input.id ? await getCustomer(db, input.id) : null;
  if (existing) {
    await db.runAsync(
      'UPDATE customers SET name = ?, phone = ?, notes = ? WHERE id = ?',
      input.name.trim(),
      input.phone?.trim() || null,
      input.notes?.trim() || null,
      id
    );
  } else {
    await db.runAsync(
      'INSERT INTO customers (id, name, phone, notes, created_at) VALUES (?, ?, ?, ?, ?)',
      id,
      input.name.trim(),
      input.phone?.trim() || null,
      input.notes?.trim() || null,
      new Date().toISOString()
    );
  }
  return id;
}

export async function getCustomerBalance(db: BoutiqueDatabase, customerId: string): Promise<number> {
  const sales = await db.getAllAsync<{ id: string; total: number; paid: number; created_at: string; status: string | null }>(
    `SELECT id, total, paid, created_at, status FROM sales WHERE customer_id = ? AND ${ACTIVE_SALE}`,
    customerId
  );
  const effectiveSales: { id: string; total: number; paid: number; created_at: string }[] = [];
  for (const sale of sales) {
    const returned = await getReturnTotalForSale(db, sale.id);
    effectiveSales.push({
      id: sale.id,
      total: Math.max(0, sale.total - returned),
      paid: sale.paid,
      created_at: sale.created_at,
    });
  }
  const payments = await db.getAllAsync<{ amount: number }>(
    'SELECT amount FROM payments WHERE customer_id = ?',
    customerId
  );
  return customerBalance(effectiveSales, payments);
}

export async function listDebts(db: BoutiqueDatabase): Promise<CustomerWithBalance[]> {
  const customers = await listCustomers(db);
  return customers.filter((customer) => customer.balance > 0).sort((a, b) => b.balance - a.balance);
}

export async function listSales(
  db: BoutiqueDatabase,
  period: 'today' | 'week' | 'month' | 'all' = 'all'
): Promise<SaleWithDetails[]> {
  let from = '1970-01-01T00:00:00.000Z';
  if (period === 'today') from = startOfDayISO();
  if (period === 'week') from = daysAgoISO(7);
  if (period === 'month') from = startOfMonthISO();

  return db.getAllAsync<SaleWithDetails>(
    `SELECT
        s.*,
        c.name as customer_name,
        (SELECT COUNT(*) FROM sale_items si WHERE si.sale_id = s.id) as item_count
     FROM sales s
     LEFT JOIN customers c ON c.id = s.customer_id
     WHERE s.created_at >= ?
     ORDER BY s.created_at DESC`,
    from
  );
}

export async function getSale(db: BoutiqueDatabase, id: string): Promise<Sale | null> {
  return db.getFirstAsync<Sale>('SELECT * FROM sales WHERE id = ?', id);
}

export async function listSaleItems(db: BoutiqueDatabase, saleId: string): Promise<SaleItem[]> {
  return db.getAllAsync<SaleItem>(
    'SELECT * FROM sale_items WHERE sale_id = ? ORDER BY product_name',
    saleId
  );
}

export async function listCustomerSales(db: BoutiqueDatabase, customerId: string): Promise<Sale[]> {
  return db.getAllAsync<Sale>(
    'SELECT * FROM sales WHERE customer_id = ? ORDER BY created_at DESC',
    customerId
  );
}

export async function listPayments(db: BoutiqueDatabase, customerId: string): Promise<Payment[]> {
  return db.getAllAsync<Payment>(
    'SELECT * FROM payments WHERE customer_id = ? ORDER BY created_at DESC',
    customerId
  );
}

export async function recordSale(
  db: BoutiqueDatabase,
  input: {
    customerId: string | null;
    items: CartLine[];
    paid: number;
    note?: string;
  }
): Promise<string> {
  if (input.items.length === 0) {
    throw new Error('Ajoutez au moins un article.');
  }

  const total = cartTotal(input.items);
  const paid = Math.min(Math.max(0, Math.round(input.paid)), total);
  const remaining = total - paid;
  if (remaining > 0 && !input.customerId) {
    throw new Error('Choisissez un client pour enregistrer une dette.');
  }

  const saleId = createId();
  const now = new Date().toISOString();
  const method = paymentMethod(total, paid);

  await db.withTransactionAsync(async () => {
    for (const item of input.items) {
      const product = await getProduct(db, item.productId);
      if (!product) throw new Error(`Produit introuvable: ${item.name}`);
      if (product.quantity + 1e-9 < item.quantity) {
        throw new Error(`Stock insuffisant pour ${product.name}`);
      }
    }

    await db.runAsync(
      `INSERT INTO sales (id, customer_id, total, paid, payment_method, note, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      saleId,
      input.customerId,
      total,
      paid,
      method,
      input.note?.trim() || null,
      'completed',
      now
    );

    for (const item of input.items) {
      const product = (await getProduct(db, item.productId))!;
      await db.runAsync(
        `INSERT INTO sale_items (id, sale_id, product_id, product_name, quantity, unit_price, cost_price)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        createId(),
        saleId,
        product.id,
        product.name,
        item.quantity,
        item.unitPrice,
        product.cost_price
      );
      await db.runAsync(
        'UPDATE products SET quantity = quantity - ?, updated_at = ? WHERE id = ?',
        item.quantity,
        now,
        product.id
      );
      await db.runAsync(
        `INSERT INTO stock_moves (id, product_id, type, quantity, note, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        createId(),
        product.id,
        'sale',
        item.quantity,
        'Vente',
        now
      );
    }
  });

  return saleId;
}

export async function recordPayment(
  db: BoutiqueDatabase,
  input: { customerId: string; amount: number; note?: string }
): Promise<void> {
  const amount = Math.round(input.amount);
  if (amount <= 0) throw new Error('Le montant doit être supérieur à 0.');
  const balance = await getCustomerBalance(db, input.customerId);
  if (amount > balance) {
    throw new Error(`Le reste à payer est de ${balance} F.`);
  }
  await db.runAsync(
    `INSERT INTO payments (id, customer_id, amount, note, created_at) VALUES (?, ?, ?, ?, ?)`,
    createId(),
    input.customerId,
    amount,
    input.note?.trim() || null,
    new Date().toISOString()
  );
}

export async function getDashboardStats(db: BoutiqueDatabase): Promise<DashboardStats> {
  const today = startOfDayISO();
  const month = startOfMonthISO();

  const todayRow = await db.getFirstAsync<{ total: number; count: number }>(
    `SELECT COALESCE(SUM(s.total - IFNULL(r.refunded, 0)), 0) as total,
            COUNT(*) as count
     FROM sales s
     LEFT JOIN (
       SELECT sale_id, SUM(refund_amount) as refunded FROM sale_returns GROUP BY sale_id
     ) r ON r.sale_id = s.id
     WHERE s.created_at >= ? AND ${ACTIVE_SALE_S}`,
    today
  );
  const monthRow = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(s.total - IFNULL(r.refunded, 0)), 0) as total
     FROM sales s
     LEFT JOIN (
       SELECT sale_id, SUM(refund_amount) as refunded FROM sale_returns GROUP BY sale_id
     ) r ON r.sale_id = s.id
     WHERE s.created_at >= ? AND ${ACTIVE_SALE_S}`,
    month
  );
  const profitRow = await db.getFirstAsync<{ profit: number }>(
    `SELECT COALESCE(SUM(
        (si.quantity - IFNULL(ret.qty, 0)) * (si.unit_price - si.cost_price)
      ), 0) as profit
     FROM sale_items si
     JOIN sales s ON s.id = si.sale_id
     LEFT JOIN (
       SELECT sale_item_id, SUM(quantity) as qty FROM sale_returns GROUP BY sale_item_id
     ) ret ON ret.sale_item_id = si.id
     WHERE s.created_at >= ? AND ${ACTIVE_SALE_S}`,
    month
  );
  const low = await db.getFirstAsync<{ c: number }>(
    'SELECT COUNT(*) as c FROM products WHERE quantity <= min_quantity'
  );
  const products = await db.getFirstAsync<{ c: number }>('SELECT COUNT(*) as c FROM products');
  const debts = await listDebts(db);
  const debtTotal = debts.reduce((sum, customer) => sum + customer.balance, 0);

  return {
    todayTotal: todayRow?.total ?? 0,
    todayCount: todayRow?.count ?? 0,
    monthTotal: monthRow?.total ?? 0,
    monthProfit: Math.round(profitRow?.profit ?? 0),
    lowStockCount: low?.c ?? 0,
    debtTotal,
    debtorsCount: debts.length,
    productCount: products?.c ?? 0,
  };
}

export async function topProducts(
  db: BoutiqueDatabase,
  fromISO: string
): Promise<{ name: string; quantity: number; total: number }[]> {
  return db.getAllAsync(
    `SELECT si.product_name as name,
            SUM(si.quantity) as quantity,
            SUM(si.quantity * si.unit_price) as total
     FROM sale_items si
     JOIN sales s ON s.id = si.sale_id
     WHERE s.created_at >= ? AND ${ACTIVE_SALE_S}
     GROUP BY si.product_name
     ORDER BY total DESC
     LIMIT 5`,
    fromISO
  );
}

export function productSubtitle(product: Product): string {
  const category = getCategory(product.category).shortLabel;
  const brand = product.brand ? ` · ${product.brand}` : '';
  return `${category}${brand} · ${product.unit}`;
}

export async function getReturnTotalForSale(db: BoutiqueDatabase, saleId: string): Promise<number> {
  const row = await db.getFirstAsync<{ total: number }>(
    'SELECT COALESCE(SUM(refund_amount), 0) as total FROM sale_returns WHERE sale_id = ?',
    saleId
  );
  return row?.total ?? 0;
}

export async function getReturnedByItem(db: BoutiqueDatabase, saleId: string): Promise<Record<string, number>> {
  const rows = await db.getAllAsync<{ sale_item_id: string; qty: number }>(
    'SELECT sale_item_id, SUM(quantity) as qty FROM sale_returns WHERE sale_id = ? GROUP BY sale_item_id',
    saleId
  );
  const map: Record<string, number> = {};
  for (const row of rows) map[row.sale_item_id] = row.qty;
  return map;
}

export async function listSaleReturns(db: BoutiqueDatabase, saleId: string): Promise<SaleReturn[]> {
  return db.getAllAsync<SaleReturn>(
    'SELECT * FROM sale_returns WHERE sale_id = ? ORDER BY created_at DESC',
    saleId
  );
}

export async function cancelSale(db: BoutiqueDatabase, saleId: string): Promise<void> {
  const sale = await getSale(db, saleId);
  if (!sale) throw new Error('Vente introuvable.');
  if (sale.status === 'cancelled') throw new Error('Cette vente est déjà annulée.');

  const items = await listSaleItems(db, saleId);
  const returned = await getReturnedByItem(db, saleId);
  const now = new Date().toISOString();

  await db.withTransactionAsync(async () => {
    for (const item of items) {
      const already = returned[item.id] ?? 0;
      const qty = item.quantity - already;
      if (qty <= 0) continue;
      await db.runAsync(
        'UPDATE products SET quantity = quantity + ?, updated_at = ? WHERE id = ?',
        qty,
        now,
        item.product_id
      );
      await db.runAsync(
        `INSERT INTO stock_moves (id, product_id, type, quantity, note, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        createId(),
        item.product_id,
        'return',
        qty,
        'Annulation vente',
        now
      );
    }
    await db.runAsync('UPDATE sales SET status = ?, cancelled_at = ? WHERE id = ?', 'cancelled', now, saleId);
  });
}

export async function recordItemReturn(
  db: BoutiqueDatabase,
  input: { saleId: string; saleItemId: string; quantity: number; note?: string }
): Promise<void> {
  const sale = await getSale(db, input.saleId);
  if (!sale) throw new Error('Vente introuvable.');
  if (sale.status === 'cancelled') throw new Error('Impossible de retourner une vente annulée.');

  const item = await db.getFirstAsync<SaleItem>(
    'SELECT * FROM sale_items WHERE id = ? AND sale_id = ?',
    input.saleItemId,
    input.saleId
  );
  if (!item) throw new Error('Article introuvable.');

  const returned = await getReturnedByItem(db, input.saleId);
  const already = returned[item.id] ?? 0;
  const remaining = item.quantity - already;
  const qty = Math.round(input.quantity * 100) / 100;
  if (qty <= 0) throw new Error('Indiquez une quantité valide.');
  if (qty > remaining + 1e-9) {
    throw new Error(`Il reste ${remaining} unité(s) à retourner pour cet article.`);
  }

  const refundAmount = Math.round(qty * item.unit_price);
  const now = new Date().toISOString();

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO sale_returns (id, sale_id, sale_item_id, product_id, quantity, refund_amount, note, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      createId(),
      input.saleId,
      item.id,
      item.product_id,
      qty,
      refundAmount,
      input.note?.trim() || null,
      now
    );
    await db.runAsync(
      'UPDATE products SET quantity = quantity + ?, updated_at = ? WHERE id = ?',
      qty,
      now,
      item.product_id
    );
    await db.runAsync(
      `INSERT INTO stock_moves (id, product_id, type, quantity, note, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      createId(),
      item.product_id,
      'return',
      qty,
      input.note?.trim() || 'Retour client',
      now
    );
  });
}

export async function effectiveSaleTotal(db: BoutiqueDatabase, sale: Sale): Promise<number> {
  if (sale.status === 'cancelled') return 0;
  const returned = await getReturnTotalForSale(db, sale.id);
  return Math.max(0, sale.total - returned);
}

