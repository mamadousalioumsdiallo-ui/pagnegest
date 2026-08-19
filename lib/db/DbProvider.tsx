import { colors } from '@/constants/theme';
import { migrateDbIfNeeded } from '@/lib/db/migrate';
import type { BoutiqueDatabase } from '@/lib/db/types';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';

const DbContext = createContext<BoutiqueDatabase | null>(null);

export function useDatabase(): BoutiqueDatabase {
  const value = useContext(DbContext);
  if (!value) {
    throw new Error('useDatabase must be used inside DatabaseProvider');
  }
  return value;
}

function LoadingScreen() {
  return (
    <View style={styles.loading}>
      <Text style={styles.brand}>PagneGest</Text>
      <Text style={styles.tagline}>Ventes · Stock · Dettes</Text>
      <ActivityIndicator color={colors.gold} style={{ marginTop: 18 }} />
    </View>
  );
}

function NativeDbBridge({ children }: { children: ReactNode }) {
  const db = useSQLiteContext() as BoutiqueDatabase;
  return <DbContext.Provider value={db}>{children}</DbContext.Provider>;
}

function WebDbBridge({ children }: { children: ReactNode }) {
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

  if (error) {
    return (
      <View style={styles.loading}>
        <Text style={styles.brand}>PagneGest</Text>
        <Text style={styles.tagline}>{error}</Text>
      </View>
    );
  }
  if (!db) return <LoadingScreen />;
  return <DbContext.Provider value={db}>{children}</DbContext.Provider>;
}

export function DatabaseProvider({ children }: { children: ReactNode }) {
  if (Platform.OS === 'web') {
    return <WebDbBridge>{children}</WebDbBridge>;
  }
  return (
    <SQLiteProvider
        databaseName="pagnegest.db"
        onInit={(db) => migrateDbIfNeeded(db as unknown as BoutiqueDatabase)}
        useSuspense>
      <NativeDbBridge>{children}</NativeDbBridge>
    </SQLiteProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.burgundy,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  brand: {
    color: colors.gold,
    fontSize: 34,
    fontWeight: '800',
  },
  tagline: {
    color: colors.paper,
    marginTop: 6,
    textAlign: 'center',
  },
});
