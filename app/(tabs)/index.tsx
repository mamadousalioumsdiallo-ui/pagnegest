import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen, Title } from '@/components/ui/Screen';
import { colors, radius, spacing } from '@/constants/theme';
import { useBoutique } from '@/lib/BoutiqueContext';
import { getCategory } from '@/lib/categories';
import { getDashboardStats, getMeta, listDebts, listLowStock, listSales } from '@/lib/db/queries';
import { formatMoney, formatQty } from '@/lib/format';
import type { CustomerWithBalance, DashboardStats, Product, SaleWithDetails } from '@/lib/types';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  const { db, version } = useBoutique();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [debts, setDebts] = useState<CustomerWithBalance[]>([]);
  const [sales, setSales] = useState<SaleWithDetails[]>([]);
  const [boutiqueName, setBoutiqueName] = useState('Ma boutique');

  const load = useCallback(async () => {
    const [nextStats, nextLow, nextDebts, nextSales, name] = await Promise.all([
      getDashboardStats(db),
      listLowStock(db),
      listDebts(db),
      listSales(db, 'today'),
      getMeta(db, 'boutique_name', 'Boutique Wax & Bébé'),
    ]);
    setStats(nextStats);
    setLowStock(nextLow.slice(0, 4));
    setDebts(nextDebts.slice(0, 3));
    setSales(nextSales.slice(0, 4));
    setBoutiqueName(name);
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load, version])
  );

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Title subtitle={boutiqueName}>Bonjour</Title>

        <View style={styles.hero}>
          <View>
            <Text style={styles.heroKicker}>Ventes du jour</Text>
            <Text style={styles.heroValue}>{formatMoney(stats?.todayTotal ?? 0)}</Text>
            <Text style={styles.heroMeta}>{stats?.todayCount ?? 0} vente(s) aujourd’hui</Text>
          </View>
          <View style={styles.heroBadge}>
            <Ionicons name="sparkles" size={22} color={colors.ink} />
          </View>
        </View>

        <View style={styles.stats}>
          <MiniStat
            label="Dettes"
            value={formatMoney(stats?.debtTotal ?? 0)}
            hint={`${stats?.debtorsCount ?? 0} client(s)`}
            onPress={() => router.push('/dettes')}
          />
          <MiniStat
            label="Alerte stock"
            value={String(stats?.lowStockCount ?? 0)}
            hint="à réapprovisionner"
            danger={(stats?.lowStockCount ?? 0) > 0}
            onPress={() => router.push('/stock')}
          />
        </View>

        <View style={styles.actions}>
          <Button label="Nouvelle vente" icon="cart" onPress={() => router.push('/vente/nouvelle')} />
          <Button
            label="Ajouter un produit"
            icon="add"
            variant="secondary"
            onPress={() => router.push('/produit/nouveau')}
          />
        </View>

        <Section title="Stock faible">
          {lowStock.length === 0 ? (
            <Text style={styles.empty}>Tous les produits sont à niveau.</Text>
          ) : (
            lowStock.map((product) => (
              <Card key={product.id} onPress={() => router.push(`/produit/${product.id}`)} style={styles.rowCard}>
                <View style={[styles.dot, { backgroundColor: getCategory(product.category).color }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{product.name}</Text>
                  <Text style={styles.rowMeta}>
                    {formatQty(product.quantity)} {product.unit} · seuil {formatQty(product.min_quantity)}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.inkSoft} />
              </Card>
            ))
          )}
        </Section>

        <Section title="Dettes en cours">
          {debts.length === 0 ? (
            <Text style={styles.empty}>Aucune dette ouverte.</Text>
          ) : (
            debts.map((customer) => (
              <Card key={customer.id} onPress={() => router.push(`/client/${customer.id}`)} style={styles.rowCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{customer.name}</Text>
                  <Text style={styles.rowMeta}>{customer.phone || 'Sans téléphone'}</Text>
                </View>
                <Text style={styles.debt}>{formatMoney(customer.balance)}</Text>
              </Card>
            ))
          )}
        </Section>

        <Section title="Ventes du jour">
          {sales.length === 0 ? (
            <Text style={styles.empty}>Pas encore de vente aujourd’hui.</Text>
          ) : (
            sales.map((sale) => (
              <Card key={sale.id} onPress={() => router.push(`/vente/${sale.id}`)} style={styles.rowCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{sale.customer_name ?? 'Client passage'}</Text>
                  <Text style={styles.rowMeta}>
                    {sale.item_count} article(s) · {sale.payment_method === 'cash' ? 'Comptant' : 'Crédit'}
                  </Text>
                </View>
                <Text style={styles.rowAmount}>{formatMoney(sale.total)}</Text>
              </Card>
            ))
          )}
        </Section>
        <View style={{ height: 24 }} />
      </ScrollView>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.section}>{title}</Text>
      {children}
    </View>
  );
}

function MiniStat({
  label,
  value,
  hint,
  onPress,
  danger,
}: {
  label: string;
  value: string;
  hint: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Card onPress={onPress} style={styles.mini}>
      <Text style={styles.miniLabel}>{label}</Text>
      <Text style={[styles.miniValue, danger && { color: colors.danger }]}>{value}</Text>
      <Text style={styles.miniHint}>{hint}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    paddingBottom: 32,
  },
  hero: {
    backgroundColor: colors.burgundy,
    borderRadius: radius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroKicker: {
    color: colors.goldSoft,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontSize: 12,
  },
  heroValue: {
    color: colors.paper,
    fontSize: 32,
    fontWeight: '800',
    marginTop: 4,
  },
  heroMeta: {
    color: '#F3D6CF',
    marginTop: 4,
  },
  heroBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stats: {
    flexDirection: 'row',
    gap: 10,
  },
  mini: {
    flex: 1,
  },
  miniLabel: {
    color: colors.inkSoft,
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  miniValue: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 6,
  },
  miniHint: {
    color: colors.inkSoft,
    marginTop: 2,
    fontSize: 12,
  },
  actions: {
    gap: 10,
  },
  section: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.ink,
    marginTop: 6,
  },
  empty: {
    color: colors.inkSoft,
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  rowTitle: {
    fontWeight: '700',
    color: colors.ink,
  },
  rowMeta: {
    color: colors.inkSoft,
    fontSize: 12,
    marginTop: 2,
  },
  rowAmount: {
    fontWeight: '800',
    color: colors.forest,
  },
  debt: {
    fontWeight: '800',
    color: colors.danger,
  },
});
