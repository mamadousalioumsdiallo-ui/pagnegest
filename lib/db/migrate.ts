import type { SQLiteDatabase } from 'expo-sqlite';

import { createId } from '@/lib/id';

const DATABASE_VERSION = 1;

export async function migrateDbIfNeeded(db: SQLiteDatabase): Promise<void> {
  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let current = result?.user_version ?? 0;
  if (current >= DATABASE_VERSION) {
    return;
  }

  if (current === 0) {
    try {
      await db.execAsync(`PRAGMA journal_mode = WAL;`);
    } catch {
      // WAL is not available on some web builds.
    }

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS meta (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT
      );

      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        brand TEXT,
        unit TEXT NOT NULL DEFAULT 'pièce',
        quantity REAL NOT NULL DEFAULT 0,
        min_quantity REAL NOT NULL DEFAULT 2,
        cost_price INTEGER NOT NULL DEFAULT 0,
        sale_price INTEGER NOT NULL DEFAULT 0,
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        phone TEXT,
        notes TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sales (
        id TEXT PRIMARY KEY NOT NULL,
        customer_id TEXT,
        total INTEGER NOT NULL,
        paid INTEGER NOT NULL,
        payment_method TEXT NOT NULL,
        note TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (customer_id) REFERENCES customers(id)
      );

      CREATE TABLE IF NOT EXISTS sale_items (
        id TEXT PRIMARY KEY NOT NULL,
        sale_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        product_name TEXT NOT NULL,
        quantity REAL NOT NULL,
        unit_price INTEGER NOT NULL,
        cost_price INTEGER NOT NULL,
        FOREIGN KEY (sale_id) REFERENCES sales(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
      );

      CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY NOT NULL,
        customer_id TEXT NOT NULL,
        amount INTEGER NOT NULL,
        note TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (customer_id) REFERENCES customers(id)
      );

      CREATE TABLE IF NOT EXISTS stock_moves (
        id TEXT PRIMARY KEY NOT NULL,
        product_id TEXT NOT NULL,
        type TEXT NOT NULL,
        quantity REAL NOT NULL,
        note TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (product_id) REFERENCES products(id)
      );

      CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
      CREATE INDEX IF NOT EXISTS idx_sales_created ON sales(created_at);
      CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
      CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer_id);
    `);

    await seedIfEmpty(db);
    current = 1;
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}

async function seedIfEmpty(db: SQLiteDatabase): Promise<void> {
  const existing = await db.getFirstAsync<{ c: number }>('SELECT COUNT(*) as c FROM products');
  if ((existing?.c ?? 0) > 0) return;
  await seedDemoData(db);
}

export async function seedDemoData(db: SQLiteDatabase): Promise<void> {
  const now = new Date();
  const iso = now.toISOString();
  await db.runAsync(
    `INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)`,
    'boutique_name',
    'Boutique Wax & Bébé'
  );

  const products = [
    ['Pagne Woodin Super Wax', 'woodin', 'Woodin', '6 yards', 18, 3, 12000, 18000],
    ['Pagne Woodin Premium', 'woodin', 'Woodin', '12 yards', 6, 2, 22000, 32000],
    ['Pagne Phoenix Hollandais', 'phoenix', 'Phoenix', '6 yards', 24, 4, 9000, 14000],
    ['Pagne Phoenix Deluxe', 'phoenix', 'Phoenix', '6 yards', 10, 2, 11000, 16000],
    ['Pagne Uniwax Super Wax', 'uniwax', 'Uniwax', '6 yards', 30, 5, 5500, 8500],
    ['Pagne Uniwax Fancy', 'uniwax', 'Uniwax', '6 yards', 15, 3, 4500, 7000],
    ['Bazin riche Getzner', 'bazin', 'Getzner', 'pièce', 8, 2, 20000, 28000],
    ['Bazin damassé', 'bazin', '', 'pièce', 12, 2, 8000, 12500],
    ['Voile suisse', 'voile', '', 'mètre', 40, 8, 2500, 4000],
    ['Voile brodé', 'voile', '', 'mètre', 20, 5, 3500, 5500],
    ['Tissu broderie', 'tissus', '', 'mètre', 15, 4, 2000, 3500],
    ['Body bébé coton 0-3 mois', 'bebe', '', 'pièce', 25, 5, 1200, 2500],
    ['Grenouillère bébé', 'bebe', '', 'pièce', 18, 4, 1800, 3500],
    ['Ensemble enfant 2-3 ans', 'enfants', '', 'pièce', 14, 3, 3500, 6500],
    ['Robe fille wax 4-5 ans', 'enfants', '', 'pièce', 9, 2, 4000, 7500],
    ['Bonnet bébé', 'accessoires', '', 'pièce', 40, 8, 400, 1000],
    ['Chaussettes bébé (lot 3)', 'accessoires', '', 'lot', 22, 5, 600, 1500],
    ['Bavoirs (lot 3)', 'accessoires', '', 'lot', 16, 4, 800, 1800],
    ['Couverture bébé', 'accessoires', '', 'pièce', 7, 2, 2500, 4500],
    ['Pagne Hitarget 6 yards', 'autres', 'Hitarget', '6 yards', 2, 3, 5000, 8000],
  ] as const;

  const productIds: string[] = [];
  for (const product of products) {
    const id = createId();
    productIds.push(id);
    await db.runAsync(
      `INSERT INTO products (
        id, name, category, brand, unit, quantity, min_quantity, cost_price, sale_price, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      product[0],
      product[1],
      product[2] || null,
      product[3],
      product[4],
      product[5],
      product[6],
      product[7],
      null,
      iso,
      iso
    );
  }

  const aminata = createId();
  const awa = createId();
  const moussa = createId();
  await db.runAsync(
    `INSERT INTO customers (id, name, phone, notes, created_at) VALUES (?, ?, ?, ?, ?)`,
    aminata,
    'Aminata Diallo',
    '77 123 45 67',
    'Cliente fidèle, préfère le Woodin',
    iso
  );
  await db.runAsync(
    `INSERT INTO customers (id, name, phone, notes, created_at) VALUES (?, ?, ?, ?, ?)`,
    awa,
    'Awa Ndiaye',
    '70 111 22 33',
    null,
    iso
  );
  await db.runAsync(
    `INSERT INTO customers (id, name, phone, notes, created_at) VALUES (?, ?, ?, ?, ?)`,
    moussa,
    'Moussa Traoré',
    '65 544 33 22',
    'Achète souvent du bazin',
    iso
  );

  const hoursAgo = (hours: number) => new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();

  await insertSale(db, {
    customerId: null,
    productId: productIds[4],
    name: 'Pagne Uniwax Super Wax',
    quantity: 2,
    unitPrice: 8500,
    cost: 5500,
    paid: 17000,
    method: 'cash',
    createdAt: hoursAgo(2),
  });

  await insertSale(db, {
    customerId: awa,
    productId: productIds[11],
    name: 'Body bébé coton 0-3 mois',
    quantity: 3,
    unitPrice: 2500,
    cost: 1200,
    paid: 7500,
    method: 'cash',
    createdAt: hoursAgo(5),
  });

  await insertSale(db, {
    customerId: aminata,
    productId: productIds[6],
    name: 'Bazin riche Getzner',
    quantity: 1,
    unitPrice: 28000,
    cost: 20000,
    paid: 10000,
    method: 'mixed',
    createdAt: hoursAgo(28),
  });

  await insertSale(db, {
    customerId: moussa,
    productId: productIds[0],
    name: 'Pagne Woodin Super Wax',
    quantity: 2,
    unitPrice: 18000,
    cost: 12000,
    paid: 0,
    method: 'credit',
    createdAt: hoursAgo(50),
  });

  await db.runAsync(
    `INSERT INTO payments (id, customer_id, amount, note, created_at) VALUES (?, ?, ?, ?, ?)`,
    createId(),
    aminata,
    5000,
    'Acompte versé à la boutique',
    hoursAgo(10)
  );

  await db.runAsync(
    `UPDATE products SET quantity = quantity - 2, updated_at = ? WHERE id = ?`,
    iso,
    productIds[4]
  );
  await db.runAsync(
    `UPDATE products SET quantity = quantity - 3, updated_at = ? WHERE id = ?`,
    iso,
    productIds[11]
  );
  await db.runAsync(
    `UPDATE products SET quantity = quantity - 1, updated_at = ? WHERE id = ?`,
    iso,
    productIds[6]
  );
  await db.runAsync(
    `UPDATE products SET quantity = quantity - 2, updated_at = ? WHERE id = ?`,
    iso,
    productIds[0]
  );
}

async function insertSale(
  db: SQLiteDatabase,
  input: {
    customerId: string | null;
    productId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    cost: number;
    paid: number;
    method: string;
    createdAt: string;
  }
): Promise<void> {
  const saleId = createId();
  const total = Math.round(input.quantity * input.unitPrice);
  await db.runAsync(
    `INSERT INTO sales (id, customer_id, total, paid, payment_method, note, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    saleId,
    input.customerId,
    total,
    input.paid,
    input.method,
    null,
    input.createdAt
  );
  await db.runAsync(
    `INSERT INTO sale_items (id, sale_id, product_id, product_name, quantity, unit_price, cost_price)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    createId(),
    saleId,
    input.productId,
    input.name,
    input.quantity,
    input.unitPrice,
    input.cost
  );
  await db.runAsync(
    `INSERT INTO stock_moves (id, product_id, type, quantity, note, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    createId(),
    input.productId,
    'sale',
    input.quantity,
    'Vente démo',
    input.createdAt
  );
}

export async function resetDatabase(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    DELETE FROM stock_moves;
    DELETE FROM sale_items;
    DELETE FROM payments;
    DELETE FROM sales;
    DELETE FROM customers;
    DELETE FROM products;
    DELETE FROM meta;
    PRAGMA user_version = 0;
  `);
  await migrateDbIfNeeded(db);
}
