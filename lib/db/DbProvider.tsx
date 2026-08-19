import { migrateDbIfNeeded } from '@/lib/db/migrate';
import { DbContext } from '@/lib/db/context';
import type { BoutiqueDatabase } from '@/lib/db/types';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import type { ReactNode } from 'react';

function NativeDbBridge({ children }: { children: ReactNode }) {
  const db = useSQLiteContext() as BoutiqueDatabase;
  return <DbContext.Provider value={db}>{children}</DbContext.Provider>;
}

export function DatabaseProvider({ children }: { children: ReactNode }) {
  return (
    <SQLiteProvider
      databaseName="pagnegest.db"
      onInit={(db) => migrateDbIfNeeded(db as unknown as BoutiqueDatabase)}
      useSuspense>
      <NativeDbBridge>{children}</NativeDbBridge>
    </SQLiteProvider>
  );
}

export { useDatabase } from '@/lib/db/context';
