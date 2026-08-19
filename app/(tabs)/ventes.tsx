import { Button, Fab } from '@/components/ui/Button';
import { ListRow } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen, Title } from '@/components/ui/Screen';
import { colors, fonts, radius, spacing, type } from '@/constants/theme';
import { useBoutique } from '@/lib/BoutiqueContext';
import { listSales } from '@/lib/db/queries';
import { formatDateTime, formatMoney, paymentLabel } from '@/lib/format';
import type { SaleWithDetails } from '@/lib/types';
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

  const total = sales
    .filter((sale) => sale.status !== 'cancelled')
    .reduce((sum, sale) => sum + sale.total, 0);

  return (
    <Screen>
      <Title subtitle={`${sales.length} ticket${sales.length > 1 ? 's' : ''} · ${formatMoney(total)}`}>Ventes</Title>
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
            subtitle="Enregistrez une vente comptant, un acompte ou un crédit."
            action={<Button label="Nouvelle vente" onPress={() => router.push('/vente/nouvelle')} />}
          />
        ) : (
          sales.map((sale) => {
            const cancelled = sale.status === 'cancelled';
            return (
              <ListRow
                key={sale.id}
                title={sale.customer_name ?? 'Client passage'}
                subtitle={`${formatDateTime(sale.created_at)} · ${paymentLabel(sale.payment_method)}${cancelled ? ' · annulée' : ''}`}
                onPress={() => router.push(`/vente/${sale.id}`)}
                right={
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.amount, cancelled && styles.cancelled]}>{formatMoney(sale.total)}</Text>
                    {!cancelled && sale.total > sale.paid ? (
                      <Text style={styles.rest}>Reste {formatMoney(sale.total - sale.paid)}</Text>
                    ) : null}
                  </View>
                }
              />
            );
          })
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
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
  },
  periodOn: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  periodText: {
    color: colors.ink,
    fontFamily: fonts.body,
    fontWeight: '600',
    fontSize: 13,
  },
  periodTextOn: {
    color: colors.paper,
  },
  list: {
    gap: 10,
    paddingBottom: 12,
  },
  amount: {
    ...type.money,
    fontSize: 15,
    color: colors.forest,
  },
  rest: {
    color: colors.danger,
    fontSize: 11,
    fontFamily: fonts.body,
    fontWeight: '600',
    marginTop: 3,
  },
  cancelled: {
    textDecorationLine: 'line-through',
    color: colors.inkSoft,
  },
});
