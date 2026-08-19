import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Field } from '@/components/ui/Field';
import { ProductForm } from '@/components/ProductForm';
import { colors, spacing } from '@/constants/theme';
import { useBoutique } from '@/lib/BoutiqueContext';
import { adjustStock, deleteProduct, getProduct, listStockMoves, upsertProduct } from '@/lib/db/queries';
import { formatDateTime, formatQty, parseQty } from '@/lib/format';
import type { Product, StockMove } from '@/lib/types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { confirmAction, notify } from '@/lib/confirm';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { db, refresh, version } = useBoutique();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [moves, setMoves] = useState<StockMove[]>([]);
  const [delta, setDelta] = useState('1');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!id) return;
    void (async () => {
      setProduct(await getProduct(db, id));
      setMoves(await listStockMoves(db, id));
    })();
  }, [db, id, version]);

  if (!product) {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.inkSoft }}>Produit introuvable.</Text>
      </View>
    );
  }

  const applyDelta = async (sign: 1 | -1) => {
    try {
      await adjustStock(db, product.id, sign * parseQty(delta || '0'), note);
      setNote('');
      refresh();
    } catch (error) {
      notify('Stock', error instanceof Error ? error.message : 'Ajustement impossible');
    }
  };

  const remove = () => {
    confirmAction(
      'Supprimer',
      'Retirer ce produit du stock ?',
      () => {
        void (async () => {
          try {
            await deleteProduct(db, product.id);
            refresh();
            router.back();
          } catch (error) {
            notify('Impossible', error instanceof Error ? error.message : 'Suppression refusée');
          }
        })();
      },
      'Supprimer'
    );
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.cream }}
      contentContainerStyle={styles.content}>
      <Card style={{ gap: 10 }}>
        <Text style={styles.kicker}>Ajuster le stock</Text>
        <Text style={styles.stock}>
          {formatQty(product.quantity)} {product.unit}
        </Text>
        <Field label="Quantité" value={delta} onChangeText={setDelta} keyboardType="decimal-pad" />
        <Field label="Motif" value={note} onChangeText={setNote} placeholder="Livraison, casse, inventaire…" />
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Button label="Entrée +" variant="gold" onPress={() => void applyDelta(1)} />
          </View>
          <View style={{ flex: 1 }}>
            <Button label="Sortie −" variant="secondary" onPress={() => void applyDelta(-1)} />
          </View>
        </View>
      </Card>

      <ProductForm
        initial={product}
        submitLabel="Enregistrer les modifications"
        onSubmit={async (value) => {
          await upsertProduct(db, { ...value, id: product.id });
          refresh();
          notify('Enregistré', 'Le produit a été mis à jour.');
        }}
      />

      <Card style={{ gap: 8 }}>
        <Text style={styles.kicker}>Mouvements récents</Text>
        {moves.length === 0 ? (
          <Text style={{ color: colors.inkSoft }}>Aucun mouvement.</Text>
        ) : (
          moves.map((move) => (
            <View key={move.id} style={styles.move}>
              <Text style={styles.moveType}>
                {move.type === 'in' ? 'Entrée' : move.type === 'out' ? 'Sortie' : move.type === 'sale' ? 'Vente' : 'Ajustement'}{' '}
                · {formatQty(move.quantity)}
              </Text>
              <Text style={{ color: colors.inkSoft, fontSize: 12 }}>
                {formatDateTime(move.created_at)}
                {move.note ? ` · ${move.note}` : ''}
              </Text>
            </View>
          ))
        )}
      </Card>

      <Button label="Supprimer le produit" variant="danger" onPress={remove} />
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    gap: spacing.md,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream,
  },
  kicker: {
    fontWeight: '800',
    color: colors.ink,
    fontSize: 16,
  },
  stock: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.burgundy,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  move: {
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  moveType: {
    fontWeight: '700',
    color: colors.ink,
  },
});
