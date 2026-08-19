import { colors, fonts, radius, spacing } from '@/constants/theme';
import { CATEGORIES, type CategoryId } from '@/lib/categories';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export function CategoryChips({
  value,
  onChange,
  includeAll = true,
}: {
  value: string;
  onChange: (value: string) => void;
  includeAll?: boolean;
}) {
  const items = includeAll
    ? [{ id: 'all', label: 'Tout', shortLabel: 'Tout', color: colors.burgundy }, ...CATEGORIES]
    : CATEGORIES;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {items.map((item) => {
        const selected = value === item.id;
        return (
          <Pressable
            key={item.id}
            onPress={() => onChange(item.id)}
            style={[
              styles.chip,
              selected
                ? { backgroundColor: colors.ink, borderColor: colors.ink }
                : { backgroundColor: colors.paper, borderColor: colors.line },
            ]}>
            <View style={[styles.dot, { backgroundColor: item.color }]} />
            <Text style={[styles.label, { color: selected ? colors.paper : colors.ink }]}>
              {item.shortLabel}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function selectedCategoryColor(id: string): string {
  return CATEGORIES.find((item) => item.id === id)?.color ?? colors.burgundy;
}

export type { CategoryId };

const styles = StyleSheet.create({
  row: {
    gap: 8,
    paddingRight: spacing.md,
  },
  chip: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  label: {
    fontFamily: fonts.body,
    fontWeight: '600',
    fontSize: 13,
  },
});
