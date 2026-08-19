import { colors, radius, spacing } from '@/constants/theme';
import { type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function Screen({
  children,
  padded = true,
}: {
  children: ReactNode;
  padded?: boolean;
}) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={[styles.frame, padded && styles.padded]}>{children}</View>
    </SafeAreaView>
  );
}

export function Title({ children, subtitle }: { children: ReactNode; subtitle?: string }) {
  return (
    <View style={styles.titleWrap}>
      <Text style={styles.kicker}>PagneGest</Text>
      <Text style={styles.title}>{children}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function Badge({
  label,
  tone = 'gold',
}: {
  label: string;
  tone?: 'gold' | 'danger' | 'forest' | 'ink';
}) {
  const map = {
    gold: { bg: colors.goldSoft, fg: colors.ink },
    danger: { bg: colors.dangerSoft, fg: colors.danger },
    forest: { bg: colors.forestSoft, fg: colors.forest },
    ink: { bg: colors.creamDark, fg: colors.inkSoft },
  }[tone];
  return (
    <View style={[styles.badge, { backgroundColor: map.bg }]}>
      <Text style={[styles.badgeText, { color: map.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  frame: {
    flex: 1,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  padded: {
    paddingHorizontal: spacing.md,
  },
  titleWrap: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: 2,
  },
  kicker: {
    color: colors.gold,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    fontSize: 11,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.ink,
  },
  subtitle: {
    color: colors.inkSoft,
    fontSize: 14,
    marginTop: 2,
  },
  badge: {
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
});
