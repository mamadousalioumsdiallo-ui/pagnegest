import { colors } from '@/constants/theme';
import { BoutiqueProvider } from '@/lib/BoutiqueContext';
import { migrateDbIfNeeded } from '@/lib/db/migrate';
import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { Suspense } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

function LoadingScreen() {
  return (
    <View style={styles.loading}>
      <Text style={styles.brand}>PagneGest</Text>
      <Text style={styles.tagline}>Ventes · Stock · Dettes</Text>
      <ActivityIndicator color={colors.gold} style={{ marginTop: 18 }} />
    </View>
  );
}

export default function RootLayout() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <SQLiteProvider databaseName="pagnegest.db" onInit={migrateDbIfNeeded} useSuspense>
        <BoutiqueProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.cream },
              headerTintColor: colors.burgundy,
              headerTitleStyle: { fontWeight: '800', color: colors.ink },
              headerShadowVisible: false,
              contentStyle: { backgroundColor: colors.cream },
            }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="produit/nouveau" options={{ title: 'Nouveau produit' }} />
            <Stack.Screen name="produit/[id]" options={{ title: 'Produit' }} />
            <Stack.Screen name="vente/nouvelle" options={{ title: 'Nouvelle vente' }} />
            <Stack.Screen name="vente/[id]" options={{ title: 'Détail vente' }} />
            <Stack.Screen name="client/nouveau" options={{ title: 'Nouveau client' }} />
            <Stack.Screen name="client/[id]" options={{ title: 'Client' }} />
          </Stack>
        </BoutiqueProvider>
      </SQLiteProvider>
    </Suspense>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.burgundy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    color: colors.gold,
    fontSize: 34,
    fontWeight: '800',
  },
  tagline: {
    color: colors.paper,
    marginTop: 6,
    letterSpacing: 0.6,
  },
});
