import { Button } from '@/components/ui/Button';
import { Card, ListRow, initialsOf } from '@/components/ui/Card';
import { Field } from '@/components/ui/Field';
import { Screen, Title } from '@/components/ui/Screen';
import { colors, spacing, type } from '@/constants/theme';
import { useBoutique } from '@/lib/BoutiqueContext';
import { confirmAction, notify } from '@/lib/confirm';
import { resetDatabase } from '@/lib/db/migrate';
import { getDashboardStats, getMeta, listCustomers, setMeta, topProducts } from '@/lib/db/queries';
import { formatMoney, startOfMonthISO } from '@/lib/format';
import type { CustomerWithBalance, DashboardStats } from '@/lib/types';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function MoreScreen() {
  const { db, refresh, version } = useBoutique();
  const router = useRouter();
  const [name, setName] = useState('');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [tops, setTops] = useState<{ name: string; quantity: number; total: number }[]>([]);
  const [customers, setCustomers] = useState<CustomerWithBalance[]>([]);

  const load = useCallback(async () => {
    const [saved, nextStats, nextTops, nextCustomers] = await Promise.all([
      getMeta(db, 'boutique_name', 'Boutique Wax & Bébé'),
      getDashboardStats(db),
      topProducts(db, startOfMonthISO()),
      listCustomers(db),
    ]);
    setName(saved);
    setStats(nextStats);
    setTops(nextTops);
    setCustomers(nextCustomers);
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load, version])
  );

  const saveName = async () => {
    await setMeta(db, 'boutique_name', name.trim() || 'Ma boutique');
    refresh();
    notify('Enregistré', 'Le nom de la boutique a été mis à jour.');
  };

  const confirmReset = () => {
    confirmAction(
      'Réinitialiser',
      'Les ventes, stocks, clients et dettes d’exemple seront recréés. Continuer ?',
      () => {
        void (async () => {
          await resetDatabase(db);
          refresh();
        })();
      },
      'Réinitialiser'
    );
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Title subtitle="Paramètres, clients et bilan du mois">Plus</Title>

        <Card style={{ gap: 12 }}>
          <Text style={type.section}>Boutique</Text>
          <Field label="Nom de la boutique" value={name} onChangeText={setName} placeholder="Ex. Boutique Aminata" />
          <Button label="Enregistrer le nom" variant="secondary" onPress={() => void saveName()} />
        </Card>

        <Card style={{ gap: 10 }}>
          <Text style={type.section}>Bilan du mois</Text>
          <Row label="Chiffre d’affaires" value={formatMoney(stats?.monthTotal ?? 0)} />
          <Row label="Marge estimée" value={formatMoney(stats?.monthProfit ?? 0)} />
          <Row label="Produits" value={String(stats?.productCount ?? 0)} />
          <Row label="Dettes ouvertes" value={formatMoney(stats?.debtTotal ?? 0)} />
        </Card>

        <Card style={{ gap: 10 }}>
          <Text style={type.section}>Meilleures ventes du mois</Text>
          {tops.length === 0 ? (
            <Text style={type.muted}>Pas encore assez de ventes ce mois-ci.</Text>
          ) : (
            tops.map((item, index) => (
              <Row key={item.name} label={`${index + 1}. ${item.name}`} value={formatMoney(item.total)} />
            ))
          )}
        </Card>

        <Card style={{ gap: 12 }}>
          <View style={styles.rowBetween}>
            <Text style={type.section}>Clients</Text>
            <Button label="Ajouter" variant="ghost" onPress={() => router.push('/client/nouveau')} />
          </View>
          {customers.slice(0, 8).map((customer) => (
            <ListRow
              key={customer.id}
              title={customer.name}
              subtitle={customer.phone || 'Sans téléphone'}
              initials={initialsOf(customer.name)}
              onPress={() => router.push(`/client/${customer.id}`)}
              right={
                <Text style={{ color: customer.balance > 0 ? colors.danger : colors.forest, ...type.money, fontSize: 14 }}>
                  {customer.balance > 0 ? formatMoney(customer.balance) : 'Soldé'}
                </Text>
              }
            />
          ))}
        </Card>

        <Card style={{ gap: 12 }}>
          <Text style={type.section}>Données d’exemple</Text>
          <Text style={type.muted}>
            PagneGest fonctionne hors ligne sur votre téléphone. Les exemples aident à tester Woodin, Phoenix, Uniwax,
            bazin, voile, vêtements bébé et dettes.
          </Text>
          <Button label="Réinitialiser avec les exemples" variant="danger" onPress={confirmReset} />
        </Card>
        <View style={{ height: 28 }} />
      </ScrollView>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.rowBetween}>
      <Text style={[type.muted, { flex: 1 }]}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    paddingBottom: 24,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  value: {
    ...type.money,
    fontSize: 15,
  },
});
