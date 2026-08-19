import { Button } from '@/components/ui/Button';
import { Card, ListRow, initialsOf } from '@/components/ui/Card';
import { Screen, SectionTitle } from '@/components/ui/Screen';
import { WaxMark } from '@/components/ui/WaxMark';
import { colors, fonts, radius, spacing, type } from '@/constants/theme';
import { useBoutique } from '@/lib/BoutiqueContext';
import { getCategory } from '@/lib/categories';
import { getDashboardStats, getMeta, listDebts, listLowStock, listSales } from '@/lib/db/queries';
import { formatMoney, formatQty, paymentLabel } from '@/lib/format';
import type { CustomerWithBalance, DashboardStats, Product, SaleWithDetails } from '@/lib/types';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
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
        <View style={styles.header}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={type.kicker}>Maison de pagnes</Text>
            <Text style={styles.hello}>{boutiqueName}</Text>
            <Text style={styles.date}>
              {new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}
            </Text>
          </View>
          <WaxMark color={colors.goldDeep} size={8} />
        </View>

        <View style={styles.hero}>
          <View style={styles.heroFrame}>
            <View style={styles.heroPattern} pointerEvents="none">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <View
                  key={index}
                  style={[
                    styles.heroDiamond,
                    {
                      top: 14 + (index % 3) * 18,
                      right: 14 + Math.floor(index / 3) * 18,
                      opacity: 0.12 + (index % 2) * 0.08,
                    },
                  ]}
                />
              ))}
            </View>
            <Text style={styles.heroKicker}>Chiffre du jour</Text>
            <Text style={styles.heroValue}>{formatMoney(stats?.todayTotal ?? 0)}</Text>
            <Text style={styles.heroMeta}>
              {stats?.todayCount ?? 0} vente{(stats?.todayCount ?? 0) > 1 ? 's' : ''} · marge du mois{' '}
              {formatMoney(stats?.monthProfit ?? 0)}
            </Text>
            <View style={styles.heroActions}>
              <Button
                label="Nouvelle vente"
                icon="cart"
                variant="gold"
                onPress={() => router.push('/vente/nouvelle')}
              />
            </View>
          </View>
        </View>

        <View style={styles.stats}>
          <MiniStat
            label="À recouvrer"
            value={formatMoney(stats?.debtTotal ?? 0)}
            hint={`${stats?.debtorsCount ?? 0} client${(stats?.debtorsCount ?? 0) > 1 ? 's' : ''}`}
            onPress={() => router.push('/dettes')}
            tone="danger"
          />
          <MiniStat
            label="Alertes"
            value={String(stats?.lowStockCount ?? 0)}
            hint="stock bas"
            onPress={() => router.push('/stock')}
            tone={(stats?.lowStockCount ?? 0) > 0 ? 'warn' : 'ok'}
          />
          <MiniStat
            label="Mois"
            value={formatMoney(stats?.monthTotal ?? 0)}
            hint="chiffre d’affaires"
            onPress={() => router.push('/ventes')}
            tone="ok"
          />
        </View>

        <SectionTitle>Stock à surveiller</SectionTitle>
        {lowStock.length === 0 ? (
          <Text style={styles.empty}>Tous les articles sont à niveau.</Text>
        ) : (
          lowStock.map((product) => (
            <ListRow
              key={product.id}
              title={product.name}
              subtitle={`${formatQty(product.quantity)} ${product.unit} · seuil ${formatQty(product.min_quantity)}`}
              swatch={getCategory(product.category).color}
              onPress={() => router.push(`/produit/${product.id}`)}
            />
          ))
        )}

        <SectionTitle>Crédits ouverts</SectionTitle>
        {debts.length === 0 ? (
          <Text style={styles.empty}>Aucune dette en cours.</Text>
        ) : (
          debts.map((customer) => (
            <ListRow
              key={customer.id}
              title={customer.name}
              subtitle={customer.phone || 'Sans téléphone'}
              initials={initialsOf(customer.name)}
              onPress={() => router.push(`/client/${customer.id}`)}
              right={<Text style={styles.debt}>{formatMoney(customer.balance)}</Text>}
            />
          ))
        )}

        <SectionTitle>Dernières ventes</SectionTitle>
        {sales.length === 0 ? (
          <Text style={styles.empty}>Pas encore de vente aujourd’hui.</Text>
        ) : (
          sales.map((sale) => (
            <ListRow
              key={sale.id}
              title={sale.customer_name ?? 'Client passage'}
              subtitle={`${sale.item_count} article${sale.item_count > 1 ? 's' : ''} · ${paymentLabel(sale.payment_method)}`}
              onPress={() => router.push(`/vente/${sale.id}`)}
              right={<Text style={styles.amount}>{formatMoney(sale.total)}</Text>}
            />
          ))
        )}
        <View style={{ height: 28 }} />
      </ScrollView>
    </Screen>
  );
}

function MiniStat({
  label,
  value,
  hint,
  onPress,
  tone,
}: {
  label: string;
  hint: string;
  value: string;
  onPress: () => void;
  tone: 'danger' | 'warn' | 'ok';
}) {
  const color = tone === 'danger' ? colors.danger : tone === 'warn' ? colors.warning : colors.forest;
  return (
    <Card onPress={onPress} style={styles.mini}>
      <Text style={styles.miniLabel}>{label}</Text>
      <Text style={[styles.miniValue, { color }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.miniHint}>{hint}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 14,
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 8,
  },
  hello: {
    fontFamily: fonts.display,
    fontSize: 30,
    fontWeight: '600',
    color: colors.ink,
    marginTop: 6,
    letterSpacing: -0.5,
  },
  date: {
    ...type.muted,
    textTransform: 'capitalize',
    marginTop: 4,
  },
  hero: {
    backgroundColor: colors.burgundyDark,
    borderRadius: radius.lg,
    padding: 2,
  },
  heroFrame: {
    backgroundColor: colors.burgundy,
    borderRadius: radius.lg - 2,
    padding: spacing.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.gold,
  },
  heroPattern: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  heroDiamond: {
    position: 'absolute',
    width: 10,
    height: 10,
    backgroundColor: colors.gold,
    transform: [{ rotate: '45deg' }],
  },
  heroKicker: {
    color: colors.goldSoft,
    fontFamily: fonts.body,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontSize: 11,
  },
  heroValue: {
    color: colors.paper,
    fontFamily: fonts.display,
    fontSize: 42,
    fontWeight: '600',
    marginTop: 10,
    letterSpacing: -1,
  },
  heroMeta: {
    color: '#F0D2C8',
    fontFamily: fonts.body,
    marginTop: 6,
    fontSize: 13,
  },
  heroActions: {
    marginTop: 18,
  },
  stats: {
    flexDirection: 'row',
    gap: 8,
  },
  mini: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
  },
  miniLabel: {
    ...type.label,
    fontSize: 10,
  },
  miniValue: {
    fontFamily: fonts.display,
    fontSize: 15,
    fontWeight: '600',
    marginTop: 8,
  },
  miniHint: {
    ...type.muted,
    fontSize: 11,
    marginTop: 4,
  },
  empty: {
    ...type.muted,
  },
  amount: {
    ...type.money,
    fontSize: 15,
    color: colors.forest,
  },
  debt: {
    ...type.money,
    fontSize: 15,
    color: colors.danger,
  },
});
