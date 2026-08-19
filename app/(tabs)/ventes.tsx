import { Button, Fab } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen, Title } from '@/components/ui/Screen';
import { colors, spacing } from '@/constants/theme';
import { useBoutique } from '@/lib/BoutiqueContext';
import { listSales } from '@/lib/db/queries';
import { formatDateTime, formatMoney, paymentLabel } from '@/lib/format';
import type { SaleWithDetails } from '@/lib/types';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const PERIODS = [
  { id: 'today', label: 'Aujourd’hui' },
  { id: 'week', label: '7 jours' },
  { id: 'month', label: 'Mois' },
  { id: 'all', label: 'Tout' },
] as const;

export default function SalesScreen() {
  const { db, version } = useBoutique();
  const router = useRouter();
  const [period, setPeriod] = useState<(typeof PERIODS)[number]['id']>('today');
  const [sales, setSales] = useState<SaleWithDetails[]>([]);

  const load = useCallback(async () => {
    setSales(await listSales(db, period));
  }, [db, period]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load, version])
  );

  const total = sales.reduce((sum, sale) => sum + sale.total, 0);

  return (
    <Screen>
      <Title subtitle={`${sales.length} vente(s) · ${formatMoney(total)}`}>Ventes</Title>
      <View style={styles.periods}>
        {PERIODS.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => setPeriod(item.id)}
            style={[styles.period, period === item.id && styles.periodOn]}>
            <Text style={[styles.periodText, period === item.id && styles.periodTextOn]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {sales.length === 0 ? (
          <EmptyState
            icon="receipt-outline"
            title="Aucune vente"
            subtitle="Enregistrez une vente comptant ou à crédit."
            action={<Button label="Nouvelle vente" onPress={() => router.push('/vente/nouvelle')} />}
          />
        ) : (
          sales.map((sale) => (
            <Card key={sale.id} onPress={() => router.push(`/vente/${sale.id}`)} style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{sale.customer_name ?? 'Client passage'}</Text>
                <Text style={styles.meta}>
                  {formatDateTime(sale.created_at)} · {sale.item_count} article(s) · {paymentLabel(sale.payment_method)}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.amount}>{formatMoney(sale.total)}</Text>
                {sale.total > sale.paid ? (
                  <Text style={styles.rest}>Reste {formatMoney(sale.total - sale.paid)}</Text>
                ) : null}
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.inkSoft} />
            </Card>
          ))
        )}
        <View style={{ height: 88 }} />
      </ScrollView>
      <Fab icon="add" label="Vente" onPress={() => router.push('/vente/nouvelle')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  periods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: spacing.md,
  },
  period: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
  },
  periodOn: {
    backgroundColor: colors.burgundy,
    borderColor: colors.burgundy,
  },
  periodText: {
    color: colors.ink,
    fontWeight: '700',
    fontSize: 13,
  },
  periodTextOn: {
    color: colors.paper,
  },
  list: {
    gap: 10,
    paddingBottom: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontWeight: '800',
    color: colors.ink,
  },
  meta: {
    color: colors.inkSoft,
    fontSize: 12,
    marginTop: 3,
  },
  amount: {
    fontWeight: '800',
    color: colors.forest,
  },
  rest: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
});
