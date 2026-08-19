import { Button } from '@/components/ui/Button';
import { CategoryChips } from '@/components/ui/CategoryChips';
import { Field } from '@/components/ui/Field';
import { colors, radius, spacing } from '@/constants/theme';
import { CATEGORIES, UNITS, type CategoryId } from '@/lib/categories';
import { formatMoney, parseMoney, parseQty } from '@/lib/format';
import type { Product } from '@/lib/types';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type ProductFormValue = {
  name: string;
  category: CategoryId;
  brand: string;
  unit: string;
  quantity: string;
  min_quantity: string;
  cost_price: string;
  sale_price: string;
  notes: string;
};

export function productToForm(product?: Product | null): ProductFormValue {
  return {
    name: product?.name ?? '',
    category: product?.category ?? 'woodin',
    brand: product?.brand ?? '',
    unit: product?.unit ?? '6 yards',
    quantity: product ? String(product.quantity) : '0',
    min_quantity: product ? String(product.min_quantity) : '2',
    cost_price: product ? String(product.cost_price) : '',
    sale_price: product ? String(product.sale_price) : '',
    notes: product?.notes ?? '',
  };
}

export function ProductForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: Product | null;
  submitLabel: string;
  onSubmit: (value: {
    name: string;
    category: CategoryId;
    brand?: string;
    unit: string;
    quantity: number;
    min_quantity: number;
    cost_price: number;
    sale_price: number;
    notes?: string;
  }) => Promise<void> | void;
}) {
  const [form, setForm] = useState<ProductFormValue>(productToForm(initial));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (key: keyof ProductFormValue, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const save = async () => {
    setError('');
    if (!form.name.trim()) {
      setError('Indiquez le nom du produit.');
      return;
    }
    const sale_price = parseMoney(form.sale_price);
    if (sale_price <= 0) {
      setError('Indiquez un prix de vente.');
      return;
    }
    setSaving(true);
    try {
      await onSubmit({
        name: form.name,
        category: form.category,
        brand: form.brand,
        unit: form.unit,
        quantity: parseQty(form.quantity),
        min_quantity: parseQty(form.min_quantity),
        cost_price: parseMoney(form.cost_price),
        sale_price,
        notes: form.notes,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enregistrement impossible.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.form}>
      <Field label="Nom" value={form.name} onChangeText={(value) => set('name', value)} placeholder="Ex. Pagne Woodin Super Wax" />
      <View style={{ gap: 6 }}>
        <Text style={styles.label}>Catégorie</Text>
        <CategoryChips value={form.category} onChange={(value) => set('category', value)} includeAll={false} />
      </View>
      <Field label="Marque" value={form.brand} onChangeText={(value) => set('brand', value)} placeholder="Woodin, Phoenix, Uniwax, Getzner…" />
      <View style={{ gap: 6 }}>
        <Text style={styles.label}>Unité</Text>
        <View style={styles.units}>
          {UNITS.map((unit) => (
            <Pressable
              key={unit}
              onPress={() => set('unit', unit)}
              style={[styles.unit, form.unit === unit && styles.unitOn]}>
              <Text style={[styles.unitText, form.unit === unit && styles.unitTextOn]}>{unit}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Field label="Quantité" value={form.quantity} onChangeText={(value) => set('quantity', value)} keyboardType="decimal-pad" />
        </View>
        <View style={{ flex: 1 }}>
          <Field
            label="Seuil d’alerte"
            value={form.min_quantity}
            onChangeText={(value) => set('min_quantity', value)}
            keyboardType="decimal-pad"
          />
        </View>
      </View>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Field
            label="Prix d’achat"
            value={form.cost_price}
            onChangeText={(value) => set('cost_price', value)}
            keyboardType="numeric"
            placeholder="0"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Field
            label="Prix de vente"
            value={form.sale_price}
            onChangeText={(value) => set('sale_price', value)}
            keyboardType="numeric"
            placeholder="0"
          />
        </View>
      </View>
      <Text style={styles.hint}>
        Prix de vente : {formatMoney(parseMoney(form.sale_price))} · {CATEGORIES.find((item) => item.id === form.category)?.label}
      </Text>
      <Field label="Notes" value={form.notes} onChangeText={(value) => set('notes', value)} multiline placeholder="Couleur, motif, taille…" />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button label={submitLabel} loading={saving} onPress={() => void save()} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.md,
    paddingBottom: 32,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.inkSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  units: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  unit: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  unitOn: {
    backgroundColor: colors.burgundy,
    borderColor: colors.burgundy,
  },
  unitText: {
    color: colors.ink,
    fontWeight: '700',
    fontSize: 13,
  },
  unitTextOn: {
    color: colors.paper,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  hint: {
    color: colors.inkSoft,
    fontSize: 13,
  },
  error: {
    color: colors.danger,
    fontWeight: '700',
  },
});
