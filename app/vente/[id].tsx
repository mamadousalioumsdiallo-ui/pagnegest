import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StackBody } from '@/components/ui/Screen';
import { colors, type } from '@/constants/theme';
import { useBoutique } from '@/lib/BoutiqueContext';
import { getCustomer, getSale, listSaleItems } from '@/lib/db/queries';
import { formatDateTime, formatMoney, formatQty, paymentLabel } from '@/lib/format';
import type { Customer, Sale, SaleItem } from '@/lib/types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

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
        <Text style={type.muted}>Vente introuvable.</Text>
      </View>
    );
  }

  const remaining = Math.max(0, sale.total - sale.paid);

  return (
    <StackBody>
      <Card style={{ gap: 8 }}>
        <Text style={type.kicker}>{paymentLabel(sale.payment_method)}</Text>
        <Text style={styles.total}>{formatMoney(sale.total)}</Text>
        <Text style={type.muted}>{formatDateTime(sale.created_at)}</Text>
        <Text style={type.muted}>
          Encaissé {formatMoney(sale.paid)}
          {remaining > 0 ? ` · reste ${formatMoney(remaining)}` : ' · soldée'}
        </Text>
        {sale.note ? <Text style={type.muted}>{sale.note}</Text> : null}
      </Card>

      <Card style={{ gap: 8 }}>
        <Text style={type.section}>Articles</Text>
        {items.map((item) => (
          <View key={item.id} style={styles.item}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.product_name}</Text>
              <Text style={type.muted}>
                {formatQty(item.quantity)} × {formatMoney(item.unit_price)}
              </Text>
            </View>
            <Text style={styles.amount}>{formatMoney(Math.round(item.quantity * item.unit_price))}</Text>
          </View>
        ))}
      </Card>

      <Card style={{ gap: 8 }}>
        <Text style={type.section}>Client</Text>
        <Text style={styles.name}>{customer?.name ?? 'Client passage'}</Text>
        {customer?.phone ? <Text style={type.muted}>{customer.phone}</Text> : null}
        {customer ? (
          <Button label="Voir la fiche client" variant="secondary" onPress={() => router.push(`/client/${customer.id}`)} />
        ) : null}
      </Card>
    </StackBody>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  total: {
    ...type.display,
    fontSize: 36,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  name: {
    ...type.body,
    fontWeight: '600',
  },
  amount: {
    ...type.money,
    fontSize: 15,
    color: colors.forest,
  },
});
