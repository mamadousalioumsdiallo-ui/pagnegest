import { GoldRule, WaxMark } from '@/components/ui/WaxMark';
import { colors, fonts } from '@/constants/theme';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export function BrandSplash({ message }: { message?: string }) {
  return (
    <View style={styles.wrap}>
      <WaxMark color={colors.accent} size={8} />
      <Text style={styles.brand}>Hafsa Gestion</Text>
      <GoldRule />
      <Text style={styles.tagline}>{message ?? 'Ventes  ·  Stock  ·  Dettes'}</Text>
      {message ? null : <ActivityIndicator color={colors.accent} style={{ marginTop: 22 }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  brand: {
    color: colors.paper,
    fontFamily: fonts.display,
    fontSize: 38,
    fontWeight: '600',
    letterSpacing: -0.6,
    marginTop: 18,
    textAlign: 'center',
  },
  tagline: {
    color: colors.accentSoft,
    fontFamily: fonts.body,
    fontSize: 13,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginTop: 10,
  },
});
