import { BrandSplash } from '@/components/ui/BrandSplash';
import { colors, fonts } from '@/constants/theme';
import { BoutiqueProvider } from '@/lib/BoutiqueContext';
import { DatabaseProvider } from '@/lib/db/DbProvider';
import { ensureWebFonts } from '@/lib/webFonts';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Suspense } from 'react';

export { ErrorBoundary } from 'expo-router';

ensureWebFonts();

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    ionicons: require('../assets/fonts/Ionicons.ttf'),
    Ionicons: require('../assets/fonts/Ionicons.ttf'),
  });

  if (!fontsLoaded) {
    return <BrandSplash />;
  }

  return (
    <Suspense fallback={<BrandSplash />}>
      <DatabaseProvider>
        <BoutiqueProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.cream },
              headerTintColor: colors.burgundy,
              headerTitleStyle: {
                fontFamily: fonts.display,
                fontWeight: '600',
                color: colors.ink,
                fontSize: 18,
              },
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
      </DatabaseProvider>
    </Suspense>
  );
}
