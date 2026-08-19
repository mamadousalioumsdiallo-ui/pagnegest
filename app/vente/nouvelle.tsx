import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Field } from '@/components/ui/Field';
import { QuantityStepper } from '@/components/ui/QuantityStepper';
import { SearchBar } from '@/components/ui/SearchBar';
import { colors, radius, spacing } from '@/constants/theme';
import { useBoutique } from '@/lib/BoutiqueContext';
import { listCustomers, listProducts, recordSale } from '@/lib/db/queries';
import { formatMoney, parseMoney } from '@/lib/format';
import { cartTotal, paymentMethod } from '@/lib/saleMath';
import type { CartLine, CustomerWithBalance, Product } from '@/lib/types';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { notify } from '@/lib/confirm';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function NewSaleScreen() {
  const { db, refresh } = useBoutique();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<CustomerWithBalance[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customer, setCustomer] = useState<CustomerWithBalance | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [paid, setPaid] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      setProducts(await listProducts(db, { query }));
      setCustomers(await listCustomers(db));
    })();
  }, [db, query]);

  const total = useMemo(() => cartTotal(cart), [cart]);
  const paidAmount = paid === '' ? total : parseMoney(paid);
  const remaining = Math.max(0, total - Math.min(paidAmount, total));
  const method = paymentMethod(total, Math.min(paidAmount, total));

  const addProduct = (product: Product) => {
    if (product.quantity <= 0) {
      notify('Stock', `${product.name} n’est plus en stock.`);
      return;
    }
    setCart((current) => {
      const existing = current.find((line) => line.productId === product.id);
      if (existing) {
        return current.map((line) =>
          line.productId === product.id
            ? { ...line, quantity: Math.min(product.quantity, line.quantity + 1) }
            : line
        );
      }
      return [
        ...current,
        {
          productId: product.id,
          name: product.name,
          unit: product.unit,
          quantity: 1,
          unitPrice: product.sale_price,
          maxQuantity: product.quantity,
        },
      ];
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      const saleId = await recordSale(db, {
        customerId: customer?.id ?? null,
        items: cart,
        paid: remaining === 0 && paid === '' ? total : paidAmount,
        note,
      });
      refresh();
      router.replace(`/vente/${saleId}`);
    } catch (error) {
      notify('Vente', error instanceof Error ? error.message : 'Enregistrement impossible');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.cream }}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <SearchBar value={query} onChangeText={setQuery} placeholder="Ajouter un pagne, un vêtement…" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.products}>
          {products.slice(0, 20).map((product) => (
            <Pressable key={product.id} onPress={() => addProduct(product)} style={styles.productChip}>
              <Text style={styles.productName} numberOfLines={2}>
                {product.name}
              </Text>
              <Text style={styles.productMeta}>
                {formatMoney(product.sale_price)} · {product.quantity} {product.unit}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={styles.section}>Panier</Text>
        {cart.length === 0 ? (
          <EmptyState icon="cart-outline" title="Panier vide" subtitle="Touchez un produit pour l’ajouter à la vente." />
        ) : (
          cart.map((line) => (
            <Card key={line.productId} style={styles.line}>
              <View style={{ flex: 1 }}>
                <Text style={styles.lineName}>{line.name}</Text>
                <Text style={styles.muted}>
                  {formatMoney(line.unitPrice)} / {line.unit}
                </Text>
              </View>
              <QuantityStepper
                value={line.quantity}
                min={1}
                max={line.maxQuantity}
                onChange={(quantity) =>
                  setCart((current) =>
                    current.map((item) => (item.productId === line.productId ? { ...item, quantity } : item))
                  )
                }
              />
              <Pressable onPress={() => setCart((current) => current.filter((item) => item.productId !== line.productId))}>
                <Text style={{ color: colors.danger, fontWeight: '700' }}>Retirer</Text>
              </Pressable>
            </Card>
          ))
        )}

        <Text style={styles.section}>Client & paiement</Text>
        <Card style={{ gap: 10 }}>
          <Pressable onPress={() => setPickerOpen(true)} style={styles.customerBtn}>
            <Text style={styles.lineName}>{customer ? customer.name : 'Client passage'}</Text>
            <Text style={styles.muted}>{customer ? customer.phone || 'Client enregistré' : 'Touchez pour choisir un client'}</Text>
          </Pressable>
          <Button label="Nouveau client" variant="ghost" onPress={() => router.push('/client/nouveau')} />
          <Field
            label="Montant encaissé"
            value={paid}
            onChangeText={setPaid}
            keyboardType="numeric"
            placeholder={String(total)}
          />
          <Text style={styles.muted}>
            Total {formatMoney(total)} · {method === 'cash' ? 'Comptant' : method === 'credit' ? 'Crédit' : 'Acompte'} · Reste{' '}
            {formatMoney(remaining)}
          </Text>
          <Field label="Note" value={note} onChangeText={setNote} placeholder="Optionnel" />
        </Card>

        <Button
          label={`Valider · ${formatMoney(total)}`}
          loading={saving}
          disabled={cart.length === 0}
          onPress={() => void save()}
        />
        <View style={{ height: 24 }} />
      </ScrollView>

      <Modal visible={pickerOpen} animationType="slide" transparent>
        <Pressable style={styles.overlay} onPress={() => setPickerOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <Text style={styles.section}>Choisir un client</Text>
            <Pressable
              style={styles.pick}
              onPress={() => {
                setCustomer(null);
                setPickerOpen(false);
              }}>
              <Text style={styles.lineName}>Client passage</Text>
              <Text style={styles.muted}>Vente comptant sans fiche client</Text>
            </Pressable>
            {customers.map((item) => (
              <Pressable
                key={item.id}
                style={styles.pick}
                onPress={() => {
                  setCustomer(item);
                  setPickerOpen(false);
                }}>
                <Text style={styles.lineName}>{item.name}</Text>
                <Text style={styles.muted}>
                  {item.phone || 'Sans téléphone'}
                  {item.balance > 0 ? ` · dette ${formatMoney(item.balance)}` : ''}
                </Text>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    gap: spacing.md,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  products: {
    gap: 8,
  },
  productChip: {
    width: 160,
    backgroundColor: colors.paper,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 12,
  },
  productName: {
    fontWeight: '800',
    color: colors.ink,
    minHeight: 36,
  },
  productMeta: {
    color: colors.inkSoft,
    fontSize: 12,
    marginTop: 6,
  },
  section: {
    fontWeight: '800',
    fontSize: 16,
    color: colors.ink,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lineName: {
    fontWeight: '800',
    color: colors.ink,
  },
  muted: {
    color: colors.inkSoft,
    fontSize: 13,
    marginTop: 2,
  },
  customerBtn: {
    paddingVertical: 4,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(42,26,18,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.paper,
    padding: spacing.md,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    gap: 8,
  },
  pick: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
});
