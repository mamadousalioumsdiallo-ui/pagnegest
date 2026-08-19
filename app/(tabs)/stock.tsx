import { Fab } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CategoryChips } from '@/components/ui/CategoryChips';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen, Title } from '@/components/ui/Screen';
import { SearchBar } from '@/components/ui/SearchBar';
import { colors, spacing } from '@/constants/theme';
import { useBoutique } from '@/lib/BoutiqueContext';
import { getCategory } from '@/lib/categories';
import { listProducts, productSubtitle } from '@/lib/db/queries';
import { formatMoney, formatQty } from '@/lib/format';
import type { Product } from '@/lib/types';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function StockScreen() {
  const { db, version } = useBoutique();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [products, setProducts] = useState<Product[]>([]);

  const load = useCallback(async () => {
    setProducts(await listProducts(db, { query, category }));
  }, [db, query, category]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load, version])
  );

  return (
    <Screen>
      <Title subtitle={`${products.length} article(s) en boutique`}>Stock</Title>
      <View style={{ gap: spacing.sm, marginBottom: spacing.md }}>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Rechercher un pagne, un vêtement…" />
        <CategoryChips value={category} onChange={setCategory} />
      </View>
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {products.length === 0 ? (
          <EmptyState
            icon="cube-outline"
            title="Aucun produit"
            subtitle="Ajoutez vos pagnes Woodin, Phoenix, Uniwax, bazin, voile et articles bébé."
          />
        ) : (
          products.map((product) => {
            const low = product.quantity <= product.min_quantity;
            return (
              <Card key={product.id} onPress={() => router.push(`/produit/${product.id}`)} style={styles.card}>
                <View style={[styles.swatch, { backgroundColor: getCategory(product.category).color }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{product.name}</Text>
                  <Text style={styles.meta}>{productSubtitle(product)}</Text>
                  <Text style={[styles.qty, low && { color: colors.danger }]}>
                    {formatQty(product.quantity)} {product.unit}
                    {low ? ' · stock faible' : ''}
                  </Text>
                </View>
                <Text style={styles.price}>{formatMoney(product.sale_price)}</Text>
              </Card>
            );
          })
        )}
        <View style={{ height: 88 }} />
      </ScrollView>
      <Fab icon="add" label="Produit" onPress={() => router.push('/produit/nouveau')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
    paddingBottom: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  swatch: {
    width: 12,
    height: 44,
    borderRadius: 8,
  },
  name: {
    fontWeight: '800',
    color: colors.ink,
  },
  meta: {
    color: colors.inkSoft,
    fontSize: 12,
    marginTop: 2,
  },
  qty: {
    marginTop: 4,
    fontWeight: '700',
    color: colors.forest,
    fontSize: 13,
  },
  price: {
    fontWeight: '800',
    color: colors.ink,
  },
});
