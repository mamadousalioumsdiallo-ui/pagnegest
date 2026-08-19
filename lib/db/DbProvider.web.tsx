import { migrateDbIfNeeded } from '@/lib/db/migrate';
import { DatabaseLoadingScreen, DbContext } from '@/lib/db/context';
import type { BoutiqueDatabase } from '@/lib/db/types';
import { useEffect, useState, type ReactNode } from 'react';

export function DatabaseProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<BoutiqueDatabase | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const { openWebDatabase } = await import('@/lib/db/webDatabase');
        const next = await openWebDatabase();
        await migrateDbIfNeeded(next);
        if (!cancelled) setDb(next);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Base web indisponible');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <DatabaseLoadingScreen message={error} />;
  if (!db) return <DatabaseLoadingScreen />;
  return <DbContext.Provider value={db}>{children}</DbContext.Provider>;
}

export { useDatabase } from '@/lib/db/context';
