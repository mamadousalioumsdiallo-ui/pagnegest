import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { colors, spacing } from '@/constants/theme';
import { useBoutique } from '@/lib/BoutiqueContext';
import { getCustomer, getSale, listSaleItems } from '@/lib/db/queries';
import { formatDateTime, formatMoney, formatQty, paymentLabel } from '@/lib/format';
import type { Customer, Sale, SaleItem } from '@/lib/types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function SaleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { db, version } = useBoutique();
  const router = useRouter();
  const [sale, setSale] = useState<Sale | null>(null);
  const [items, setItems] = useState<SaleItem[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    if (!id) return;
    void (async () => {
      const nextSale = await getSale(db, id);
      setSale(nextSale);
      setItems(await listSaleItems(db, id));
      if (nextSale?.customer_id) {
        setCustomer(await getCustomer(db, nextSale.customer_id));
      } else {
        setCustomer(null);
      }
    })();
  }, [db, id, version]);

  if (!sale) {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.inkSoft }}>Vente introuvable.</Text>
      </View>
    );
  }

  const remaining = Math.max(0, sale.total - sale.paid);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.cream }} contentContainerStyle={styles.content}>
      <Card style={{ gap: 6 }}>
        <Text style={styles.kicker}>{paymentLabel(sale.payment_method)}</Text>
        <Text style={styles.total}>{formatMoney(sale.total)}</Text>
        <Text style={styles.muted}>{formatDateTime(sale.created_at)}</Text>
        <Text style={styles.muted}>
          Encaissé {formatMoney(sale.paid)}
          {remaining > 0 ? ` · reste ${formatMoney(remaining)}` : ' · soldée'}
        </Text>
        {sale.note ? <Text style={styles.muted}>{sale.note}</Text> : null}
      </Card>

      <Card style={{ gap: 8 }}>
        <Text style={styles.section}>Articles</Text>
        {items.map((item) => (
          <View key={item.id} style={styles.item}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.product_name}</Text>
              <Text style={styles.muted}>
                {formatQty(item.quantity)} × {formatMoney(item.unit_price)}
              </Text>
            </View>
            <Text style={styles.amount}>{formatMoney(Math.round(item.quantity * item.unit_price))}</Text>
          </View>
        ))}
      </Card>

      <Card style={{ gap: 8 }}>
        <Text style={styles.section}>Client</Text>
        <Text style={styles.name}>{customer?.name ?? 'Client passage'}</Text>
        {customer?.phone ? <Text style={styles.muted}>{customer.phone}</Text> : null}
        {customer ? (
          <Button label="Voir la fiche client" variant="secondary" onPress={() => router.push(`/client/${customer.id}`)} />
        ) : null}
      </Card>
    </ScrollView>
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
  center: {
    flex: 1,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kicker: {
    color: colors.gold,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  total: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.ink,
  },
  muted: {
    color: colors.inkSoft,
  },
  section: {
    fontWeight: '800',
    color: colors.ink,
    fontSize: 16,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  name: {
    fontWeight: '700',
    color: colors.ink,
  },
  amount: {
    fontWeight: '800',
    color: colors.forest,
  },
});
