import { Button } from '@/components/ui/Button';
import { ListRow, initialsOf } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen, Title } from '@/components/ui/Screen';
import { SearchBar } from '@/components/ui/SearchBar';
import { colors, spacing, type } from '@/constants/theme';
import { useBoutique } from '@/lib/BoutiqueContext';
import { listDebts } from '@/lib/db/queries';
import { formatMoney } from '@/lib/format';
import type { CustomerWithBalance } from '@/lib/types';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

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
      <Title subtitle={`${debts.length} dossier${debts.length > 1 ? 's' : ''} · ${formatMoney(total)}`}>Dettes</Title>
      <SearchBar value={query} onChangeText={setQuery} placeholder="Nom ou téléphone" />
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
            <ListRow
              key={customer.id}
              title={customer.name}
              subtitle={customer.phone || 'Téléphone non renseigné'}
              initials={initialsOf(customer.name)}
              onPress={() => router.push(`/client/${customer.id}`)}
              right={<Text style={styles.amount}>{formatMoney(customer.balance)}</Text>}
            />
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
  amount: {
    ...type.money,
    fontSize: 15,
    color: colors.danger,
  },
});
