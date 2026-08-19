import { useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

type BoutiqueContextValue = {
  db: SQLiteDatabase;
  version: number;
  refresh: () => void;
};

const BoutiqueContext = createContext<BoutiqueContextValue | null>(null);

export function BoutiqueProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((value) => value + 1), []);
  const value = useMemo(() => ({ db, version, refresh }), [db, version, refresh]);
  return <BoutiqueContext.Provider value={value}>{children}</BoutiqueContext.Provider>;
}

export function useBoutique(): BoutiqueContextValue {
  const value = useContext(BoutiqueContext);
  if (!value) {
    throw new Error('useBoutique must be used inside BoutiqueProvider');
  }
  return value;
}
