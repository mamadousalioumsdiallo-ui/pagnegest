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

function wasmPath(file: string): string {
  if (typeof window === 'undefined') return `/pagnegest/${file}`;
  const declared = document.querySelector('base')?.href;
  if (declared) return new URL(file, declared).toString();
  if (window.location.pathname.startsWith('/pagnegest')) {
    return `/pagnegest/${file}`;
  }
  return `/${file}`;
}

export async function openWebDatabase(): Promise<BoutiqueDatabase> {
  const initSqlJs = (await import('sql.js')).default;
  const SQL = await initSqlJs({
    locateFile: (file) => wasmPath(file),
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
