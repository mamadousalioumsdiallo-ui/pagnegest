import { colors, fonts, radius } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export function QuantityStepper({
  value,
  onChange,
  min = 0,
  max,
  step = 1,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  const dec = () => onChange(Math.max(min, roundQty(value - step)));
  const inc = () => onChange(max == null ? roundQty(value + step) : Math.min(max, roundQty(value + step)));
  return (
    <View style={styles.row}>
      <Pressable onPress={dec} style={styles.btn}>
        <Ionicons name="remove" size={18} color={colors.burgundy} />
      </Pressable>
      <Text style={styles.value}>{String(value).replace('.', ',')}</Text>
      <Pressable onPress={inc} style={styles.btn}>
        <Ionicons name="add" size={18} color={colors.burgundy} />
      </Pressable>
    </View>
  );
}

function roundQty(value: number): number {
  return Math.round(value * 100) / 100;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btn: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    minWidth: 28,
    textAlign: 'center',
    fontFamily: fonts.body,
    fontWeight: '700',
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
});
