import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ProductThumb } from '@/components/ui/ProductThumb';
import { Badge, StackBody } from '@/components/ui/Screen';
import { colors, type } from '@/constants/theme';
import { useBoutique } from '@/lib/BoutiqueContext';
import { confirmAction, notify } from '@/lib/confirm';
import {
  cancelSale,
  getCustomer,
  getProduct,
  getReturnedByItem,
  getReturnTotalForSale,
  getSale,
  listSaleItems,
  recordItemReturn,
} from '@/lib/db/queries';
import { formatDateTime, formatMoney, formatQty, paymentLabel } from '@/lib/format';
import type { Customer, Product, Sale, SaleItem } from '@/lib/types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

export default function SaleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { db, refresh, version } = useBoutique();
  const router = useRouter();
  const [sale, setSale] = useState<Sale | null>(null);
  const [items, setItems] = useState<SaleItem[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [returned, setReturned] = useState<Record<string, number>>({});
  const [returnTotal, setReturnTotal] = useState(0);
  const [products, setProducts] = useState<Record<string, Product | null>>({});
  const [returnItem, setReturnItem] = useState<SaleItem | null>(null);
  const [returnQty, setReturnQty] = useState('1');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    void (async () => {
      const nextSale = await getSale(db, id);
      setSale(nextSale);
      const nextItems = await listSaleItems(db, id);
      setItems(nextItems);
      setReturned(await getReturnedByItem(db, id));
      setReturnTotal(await getReturnTotalForSale(db, id));
      if (nextSale?.customer_id) {
        setCustomer(await getCustomer(db, nextSale.customer_id));
      } else {
        setCustomer(null);
      }
      const map: Record<string, Product | null> = {};
      for (const item of nextItems) {
        map[item.product_id] = await getProduct(db, item.product_id);
      }
      setProducts(map);
    })();
  }, [db, id, version]);

  if (!sale) {
    return (
      <View style={styles.center}>
        <Text style={type.muted}>Vente introuvable.</Text>
      </View>
    );
  }

  const cancelled = sale.status === 'cancelled';
  const effectiveTotal = cancelled ? 0 : Math.max(0, sale.total - returnTotal);
  const remaining = Math.max(0, effectiveTotal - sale.paid);

  const confirmCancel = () => {
    confirmAction(
      'Annuler la vente',
      'Le stock sera remis et la vente marquée annulée. Continuer ?',
      () => {
        void (async () => {
          setBusy(true);
          try {
            await cancelSale(db, sale.id);
            refresh();
            notify('Annulée', 'La vente a été annulée et le stock remis.');
          } catch (error) {
            notify('Erreur', error instanceof Error ? error.message : 'Annulation impossible');
          } finally {
            setBusy(false);
          }
        })();
      },
      'Annuler la vente'
    );
  };

  const submitReturn = async () => {
    if (!returnItem) return;
    const qty = Number(returnQty.replace(',', '.'));
    setBusy(true);
    try {
      await recordItemReturn(db, {
        saleId: sale.id,
        saleItemId: returnItem.id,
        quantity: qty,
      });
      refresh();
      setReturnItem(null);
      notify('Retour enregistré', 'Le stock a été remis.');
    } catch (error) {
      notify('Retour', error instanceof Error ? error.message : 'Retour impossible');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <StackBody>
        <Card style={{ gap: 8 }}>
          <View style={styles.rowBetween}>
            <Text style={type.kicker}>{paymentLabel(sale.payment_method)}</Text>
            {cancelled ? <Badge label="Annulée" tone="danger" /> : null}
          </View>
          <Text style={[styles.total, cancelled && styles.strike]}>{formatMoney(sale.total)}</Text>
          {!cancelled && returnTotal > 0 ? (
            <Text style={type.muted}>Retours {formatMoney(returnTotal)} · Net {formatMoney(effectiveTotal)}</Text>
          ) : null}
          <Text style={type.muted}>{formatDateTime(sale.created_at)}</Text>
          {!cancelled ? (
            <Text style={type.muted}>
              Encaissé {formatMoney(sale.paid)}
              {remaining > 0 ? ` · reste ${formatMoney(remaining)}` : ' · soldée'}
            </Text>
          ) : null}
          {sale.note ? <Text style={type.muted}>{sale.note}</Text> : null}
        </Card>

        <Card style={{ gap: 8 }}>
          <Text style={type.section}>Articles</Text>
          {items.map((item) => {
            const product = products[item.product_id];
            const returnedQty = returned[item.id] ?? 0;
            const canReturn = !cancelled && item.quantity - returnedQty > 0;
            return (
              <View key={item.id} style={styles.item}>
                <ProductThumb
                  category={product?.category ?? 'autres'}
                  imageUri={product?.image_uri}
                  size={44}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.product_name}</Text>
                  <Text style={type.muted}>
                    {formatQty(item.quantity)} × {formatMoney(item.unit_price)}
                    {returnedQty > 0 ? ` · retour ${formatQty(returnedQty)}` : ''}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <Text style={styles.amount}>{formatMoney(Math.round(item.quantity * item.unit_price))}</Text>
                  {canReturn ? (
                    <Button
                      label="Retour"
                      variant="ghost"
                      onPress={() => {
                        setReturnItem(item);
                        setReturnQty(String(item.quantity - returnedQty));
                      }}
                    />
                  ) : null}
                </View>
              </View>
            );
          })}
        </Card>

        <Card style={{ gap: 8 }}>
          <Text style={type.section}>Client</Text>
          <Text style={styles.name}>{customer?.name ?? 'Client passage'}</Text>
          {customer?.phone ? <Text style={type.muted}>{customer.phone}</Text> : null}
          {customer ? (
            <Button label="Voir la fiche client" variant="secondary" onPress={() => router.push(`/client/${customer.id}`)} />
          ) : null}
        </Card>

        {!cancelled ? (
          <Button label="Annuler toute la vente" variant="danger" loading={busy} onPress={confirmCancel} />
        ) : null}
      </StackBody>

      <Modal visible={!!returnItem} animationType="slide" transparent>
        <Pressable style={styles.overlay} onPress={() => setReturnItem(null)}>
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <Text style={type.section}>Retour article</Text>
            <Text style={styles.name}>{returnItem?.product_name}</Text>
            <Text style={type.muted}>Quantité à remettre en stock</Text>
            <View style={styles.qtyRow}>
              {['1', '2', '3'].map((value) => (
                <Pressable
                  key={value}
                  onPress={() => setReturnQty(value)}
                  style={[styles.qtyChip, returnQty === value && styles.qtyChipOn]}>
                  <Text style={[styles.qtyText, returnQty === value && styles.qtyTextOn]}>{value}</Text>
                </Pressable>
              ))}
            </View>
            <Button label="Confirmer le retour" loading={busy} onPress={() => void submitReturn()} />
            <Button label="Fermer" variant="ghost" onPress={() => setReturnItem(null)} />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  total: {
    ...type.display,
    fontSize: 36,
  },
  strike: {
    textDecorationLine: 'line-through',
    color: colors.inkSoft,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  name: {
    ...type.body,
    fontWeight: '600',
  },
  amount: {
    ...type.money,
    fontSize: 15,
    color: colors.forest,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(29,53,87,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.paper,
    padding: 20,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    gap: 12,
  },
  qtyRow: {
    flexDirection: 'row',
    gap: 8,
  },
  qtyChip: {
    minWidth: 44,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
  },
  qtyChipOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  qtyText: {
    ...type.body,
    fontWeight: '600',
  },
  qtyTextOn: {
    color: colors.paper,
  },
});
