import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Field } from '@/components/ui/Field';
import { Screen, Title } from '@/components/ui/Screen';
import { colors, spacing } from '@/constants/theme';
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
          <Text style={styles.section}>Boutique</Text>
          <Field label="Nom de la boutique" value={name} onChangeText={setName} placeholder="Ex. Boutique Aminata" />
          <Button label="Enregistrer le nom" variant="secondary" onPress={() => void saveName()} />
        </Card>

        <Card style={{ gap: 8 }}>
          <Text style={styles.section}>Bilan du mois</Text>
          <Row label="Chiffre d’affaires" value={formatMoney(stats?.monthTotal ?? 0)} />
          <Row label="Marge estimée" value={formatMoney(stats?.monthProfit ?? 0)} />
          <Row label="Produits" value={String(stats?.productCount ?? 0)} />
          <Row label="Dettes ouvertes" value={formatMoney(stats?.debtTotal ?? 0)} />
        </Card>

        <Card style={{ gap: 8 }}>
          <Text style={styles.section}>Meilleures ventes du mois</Text>
          {tops.length === 0 ? (
            <Text style={styles.muted}>Pas encore assez de ventes ce mois-ci.</Text>
          ) : (
            tops.map((item, index) => (
              <Row
                key={item.name}
                label={`${index + 1}. ${item.name}`}
                value={formatMoney(item.total)}
              />
            ))
          )}
        </Card>

        <Card style={{ gap: 10 }}>
          <View style={styles.rowBetween}>
            <Text style={styles.section}>Clients</Text>
            <Button label="Ajouter" variant="ghost" onPress={() => router.push('/client/nouveau')} />
          </View>
          {customers.slice(0, 8).map((customer) => (
            <Card key={customer.id} onPress={() => router.push(`/client/${customer.id}`)} style={styles.customer}>
              <View style={{ flex: 1 }}>
                <Text style={styles.customerName}>{customer.name}</Text>
                <Text style={styles.muted}>{customer.phone || 'Sans téléphone'}</Text>
              </View>
              <Text style={{ color: customer.balance > 0 ? colors.danger : colors.forest, fontWeight: '800' }}>
                {customer.balance > 0 ? formatMoney(customer.balance) : 'Soldé'}
              </Text>
            </Card>
          ))}
        </Card>

        <Card style={{ gap: 10 }}>
          <Text style={styles.section}>Données d’exemple</Text>
          <Text style={styles.muted}>
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
      <Text style={styles.muted}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    paddingBottom: 24,
  },
  section: {
    fontWeight: '800',
    color: colors.ink,
    fontSize: 16,
  },
  muted: {
    color: colors.inkSoft,
    fontSize: 13,
    lineHeight: 18,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  value: {
    fontWeight: '800',
    color: colors.ink,
  },
  customer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  customerName: {
    fontWeight: '700',
    color: colors.ink,
  },
});
