import { GoldRule, WaxMark } from '@/components/ui/WaxMark';
import { colors, fonts, radius, spacing, type } from '@/constants/theme';
import { type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
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

export function StackBody({ children }: { children: ReactNode }) {
  return (
    <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.safe}
        contentContainerStyle={styles.stack}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {children}
        <View style={{ height: 36 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function Title({ children, subtitle }: { children: ReactNode; subtitle?: string }) {
  return (
    <View style={styles.titleWrap}>
      <View style={styles.brandRow}>
        <Text style={type.kicker}>Hafsa Gestion</Text>
        <WaxMark />
      </View>
      <Text style={styles.title}>{children}</Text>
      <GoldRule />
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.section}>{children}</Text>
      <View style={styles.sectionLine} />
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
    gold: { bg: colors.goldSoft, fg: colors.goldDeep },
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
  stack: {
    padding: spacing.md,
    gap: spacing.md,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  titleWrap: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: 6,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  title: {
    ...type.display,
    fontSize: 38,
  },
  subtitle: {
    ...type.muted,
    fontSize: 14,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
  },
  section: {
    ...type.section,
  },
  sectionLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.goldLine,
  },
  badge: {
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontFamily: fonts.body,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});
