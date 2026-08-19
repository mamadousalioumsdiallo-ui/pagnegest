import { colors } from '@/constants/theme';
import type { BoutiqueDatabase } from '@/lib/db/types';
import { createContext, useContext, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export const DbContext = createContext<BoutiqueDatabase | null>(null);

export function useDatabase(): BoutiqueDatabase {
  const value = useContext(DbContext);
  if (!value) {
    throw new Error('useDatabase must be used inside DatabaseProvider');
  }
  return value;
}

export function DatabaseLoadingScreen({ message }: { message?: string }) {
  return (
    <View style={styles.loading}>
      <Text style={styles.brand}>PagneGest</Text>
      <Text style={styles.tagline}>{message ?? 'Ventes · Stock · Dettes'}</Text>
      {message ? null : <ActivityIndicator color={colors.gold} style={{ marginTop: 18 }} />}
    </View>
  );
}

export function DatabaseShell({ children }: { children: ReactNode }) {
  return <>{children}</>;
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
