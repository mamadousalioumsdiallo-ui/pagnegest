import { Fab } from '@/components/ui/Button';
import { Badge, Screen, Title } from '@/components/ui/Screen';
import { ListRow } from '@/components/ui/Card';
import { CategoryChips } from '@/components/ui/CategoryChips';
import { EmptyState } from '@/components/ui/EmptyState';
import { SearchBar } from '@/components/ui/SearchBar';
import { colors, spacing, type } from '@/constants/theme';
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
      <Title subtitle={`${products.length} pièce${products.length > 1 ? 's' : ''} en magasin`}>Stock</Title>
      <View style={{ gap: spacing.sm, marginBottom: spacing.md }}>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Woodin, bazin, body bébé…" />
        <CategoryChips value={category} onChange={setCategory} />
      </View>
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {products.length === 0 ? (
          <EmptyState
            icon="cube-outline"
            title="Aucun produit"
            subtitle="Ajoutez pagnes Woodin, Phoenix, Uniwax, bazin, voile et articles bébé."
          />
        ) : (
          products.map((product) => {
            const low = product.quantity <= product.min_quantity;
            return (
              <ListRow
                key={product.id}
                title={product.name}
                subtitle={productSubtitle(product)}
                swatch={getCategory(product.category).color}
                onPress={() => router.push(`/produit/${product.id}`)}
                right={
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <Text style={styles.price}>{formatMoney(product.sale_price)}</Text>
                    {low ? (
                      <Badge label={`${formatQty(product.quantity)} bas`} tone="danger" />
                    ) : (
                      <Text style={styles.qty}>
                        {formatQty(product.quantity)} {product.unit}
                      </Text>
                    )}
                  </View>
                }
              />
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
  price: {
    ...type.money,
    fontSize: 15,
  },
  qty: {
    ...type.muted,
    color: colors.forest,
    fontWeight: '600',
  },
});
