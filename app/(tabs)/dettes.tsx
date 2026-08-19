import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen, Title } from '@/components/ui/Screen';
import { SearchBar } from '@/components/ui/SearchBar';
import { colors, spacing } from '@/constants/theme';
import { useBoutique } from '@/lib/BoutiqueContext';
import { listDebts } from '@/lib/db/queries';
import { formatMoney } from '@/lib/format';
import type { CustomerWithBalance } from '@/lib/types';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function DebtsScreen() {
  const { db, version } = useBoutique();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [debts, setDebts] = useState<CustomerWithBalance[]>([]);

  const load = useCallback(async () => {
    setDebts(await listDebts(db));
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load, version])
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return debts;
    return debts.filter(
      (customer) =>
        customer.name.toLowerCase().includes(q) || (customer.phone ?? '').toLowerCase().includes(q)
    );
  }, [debts, query]);

  const total = debts.reduce((sum, customer) => sum + customer.balance, 0);

  return (
    <Screen>
      <Title subtitle={`${debts.length} client(s) · ${formatMoney(total)} à recouvrer`}>Dettes</Title>
      <SearchBar value={query} onChangeText={setQuery} placeholder="Nom ou téléphone du client" />
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <EmptyState
            icon="wallet-outline"
            title="Aucune dette"
            subtitle="Les ventes à crédit et les acomptes apparaîtront ici."
            action={<Button label="Voir les clients" variant="secondary" onPress={() => router.push('/plus')} />}
          />
        ) : (
          filtered.map((customer) => (
            <Card key={customer.id} onPress={() => router.push(`/client/${customer.id}`)} style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{customer.name}</Text>
                <Text style={styles.meta}>{customer.phone || 'Téléphone non renseigné'}</Text>
              </View>
              <Text style={styles.amount}>{formatMoney(customer.balance)}</Text>
              {customer.phone ? (
                <Ionicons
                  name="call"
                  size={18}
                  color={colors.forest}
                  onPress={() => Linking.openURL(`tel:${customer.phone!.replace(/\s/g, '')}`)}
                />
              ) : (
                <Ionicons name="chevron-forward" size={18} color={colors.inkSoft} />
              )}
            </Card>
          ))
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
    paddingTop: spacing.md,
    paddingBottom: 24,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  name: {
    fontWeight: '800',
    color: colors.ink,
  },
  meta: {
    color: colors.inkSoft,
    marginTop: 3,
    fontSize: 13,
  },
  amount: {
    fontWeight: '800',
    color: colors.danger,
  },
});
