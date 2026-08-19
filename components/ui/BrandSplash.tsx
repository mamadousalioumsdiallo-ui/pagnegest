import { GoldRule, WaxMark } from '@/components/ui/WaxMark';
import { colors, fonts } from '@/constants/theme';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export function BrandSplash({ message }: { message?: string }) {
  return (
    <View style={styles.wrap}>
      <WaxMark color={colors.gold} size={8} />
      <Text style={styles.brand}>PagneGest</Text>
      <GoldRule />
      <Text style={styles.tagline}>{message ?? 'Ventes  ·  Stock  ·  Dettes'}</Text>
      {message ? null : <ActivityIndicator color={colors.gold} style={{ marginTop: 22 }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.burgundy,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  brand: {
    color: colors.paper,
    fontFamily: fonts.display,
    fontSize: 42,
    fontWeight: '600',
    letterSpacing: -0.8,
    marginTop: 18,
  },
  tagline: {
    color: colors.goldSoft,
    fontFamily: fonts.body,
    fontSize: 13,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginTop: 10,
  },
});
