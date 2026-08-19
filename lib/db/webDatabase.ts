import type { BoutiqueDatabase, SqlParam } from '@/lib/db/types';
import { normalizeSqlParams } from '@/lib/db/types';
import type { Database } from 'sql.js';

const STORAGE_KEY = 'pagnegest.sqlite.v1';

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function base64ToUint8(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function wasmUrls(): string[] {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return [
    `${origin}/pagnegest/sql-wasm.wasm`,
    `${origin}/pagnegest/sql-wasm-browser.wasm`,
    '/pagnegest/sql-wasm.wasm',
    '/sql-wasm.wasm',
    'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.13.0/sql-wasm.wasm',
    'https://sql.js.org/dist/sql-wasm.wasm',
  ];
}

async function loadWasmBinary(): Promise<ArrayBuffer> {
  let lastError: unknown;
  for (const url of wasmUrls()) {
    try {
      const response = await fetch(url);
      if (!response.ok) continue;
      const buffer = await response.arrayBuffer();
      if (buffer.byteLength < 1000) continue;
      return buffer;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error('Impossible de charger le moteur de base (wasm).');
}

export async function openWebDatabase(): Promise<BoutiqueDatabase> {
  const initSqlJs = (await import('sql.js')).default;
  const wasmBinary = await loadWasmBinary();
  const SQL = await initSqlJs({
    wasmBinary,
    locateFile: () => wasmUrls()[0],
  });

  let sqlite: Database;
  const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
  sqlite = saved ? new SQL.Database(base64ToUint8(saved)) : new SQL.Database();

  let transactionDepth = 0;
  const persist = () => {
    if (transactionDepth > 0) return;
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, uint8ToBase64(sqlite.export()));
  };

  const bindAndAll = <T,>(source: string, params: SqlParam[]): T[] => {
    const stmt = sqlite.prepare(source);
    try {
      if (params.length) stmt.bind(params as any);
      const rows: T[] = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject() as T);
      }
      return rows;
    } finally {
      stmt.free();
    }
  };

  const db: BoutiqueDatabase = {
    async execAsync(source: string) {
      sqlite.exec(source);
      persist();
    },
    async runAsync(source: string, ...params: Array<SqlParam | SqlParam[]>) {
      const values = normalizeSqlParams(params);
      if (values.length) sqlite.run(source, values as any);
      else sqlite.run(source);
      persist();
      const idRow = sqlite.exec('SELECT last_insert_rowid() as id');
      const lastInsertRowId = Number(idRow[0]?.values?.[0]?.[0] ?? 0);
      return { lastInsertRowId, changes: sqlite.getRowsModified() };
    },
    async getFirstAsync<T>(source: string, ...params: Array<SqlParam | SqlParam[]>) {
      const rows = bindAndAll<T>(source, normalizeSqlParams(params));
      return rows[0] ?? null;
    },
    async getAllAsync<T>(source: string, ...params: Array<SqlParam | SqlParam[]>) {
      return bindAndAll<T>(source, normalizeSqlParams(params));
    },
    async withTransactionAsync(task: () => Promise<void>) {
      sqlite.exec('BEGIN');
      transactionDepth += 1;
      try {
        await task();
        sqlite.exec('COMMIT');
        transactionDepth -= 1;
        persist();
      } catch (error) {
        sqlite.exec('ROLLBACK');
        transactionDepth -= 1;
        throw error;
      }
    },
  };

  return db;
}
