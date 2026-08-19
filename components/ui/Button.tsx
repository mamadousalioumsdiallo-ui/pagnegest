import { colors, fonts, radius, shadow, spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

const palettes: Record<Variant, { bg: string; fg: string; border: string }> = {
  primary: { bg: colors.burgundy, fg: colors.paper, border: colors.burgundy },
  secondary: { bg: colors.paper, fg: colors.burgundy, border: colors.line },
  ghost: { bg: 'transparent', fg: colors.ink, border: colors.line },
  danger: { bg: colors.dangerSoft, fg: colors.danger, border: colors.dangerSoft },
  gold: { bg: colors.gold, fg: colors.ink, border: colors.gold },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  loading,
  style,
}: Props) {
  const palette = palettes[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          opacity: disabled ? 0.45 : pressed ? 0.88 : 1,
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <View style={styles.row}>
          {icon ? <Ionicons name={icon} size={18} color={palette.fg} /> : null}
          <Text style={[styles.label, { color: palette.fg }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function IconButton({
  icon,
  onPress,
  color = colors.ink,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  color?: string;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.icon, { opacity: pressed ? 0.6 : 1 }]}>
      <Ionicons name={icon} size={22} color={color} />
    </Pressable>
  );
}

export function Fab({
  icon,
  onPress,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  label?: ReactNode;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.fab, shadow.float, { opacity: pressed ? 0.9 : 1 }]}>
      <Ionicons name={icon} size={20} color={colors.paper} />
      {label ? <Text style={styles.fabLabel}>{label}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontFamily: fonts.body,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    right: 18,
    bottom: 22,
    backgroundColor: colors.burgundy,
    borderRadius: radius.pill,
    minHeight: 54,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fabLabel: {
    color: colors.paper,
    fontFamily: fonts.body,
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.3,
  },
});
