import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Field } from '@/components/ui/Field';
import { colors, spacing } from '@/constants/theme';
import { useBoutique } from '@/lib/BoutiqueContext';
import {
  getCustomer,
  getCustomerBalance,
  listCustomerSales,
  listPayments,
  recordPayment,
  upsertCustomer,
} from '@/lib/db/queries';
import { formatDateTime, formatMoney, parseMoney, paymentLabel } from '@/lib/format';
import { remainingBySale } from '@/lib/saleMath';
import type { Customer, Payment, Sale } from '@/lib/types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { notify } from '@/lib/confirm';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function CustomerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { db, refresh, version } = useBoutique();
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!id) return;
    void (async () => {
      const next = await getCustomer(db, id);
      setCustomer(next);
      setName(next?.name ?? '');
      setPhone(next?.phone ?? '');
      setNotes(next?.notes ?? '');
      const nextSales = await listCustomerSales(db, id);
      const nextPayments = await listPayments(db, id);
      setSales(nextSales);
      setPayments(nextPayments);
      setBalance(await getCustomerBalance(db, id));
    })();
  }, [db, id, version]);

  const remainingMap = useMemo(() => remainingBySale(sales, payments), [sales, payments]);

  if (!customer) {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.inkSoft }}>Client introuvable.</Text>
      </View>
    );
  }

  const pay = async () => {
    try {
      await recordPayment(db, { customerId: customer.id, amount: parseMoney(amount), note });
      setAmount('');
      setNote('');
      refresh();
    } catch (error) {
      notify('Paiement', error instanceof Error ? error.message : 'Paiement impossible');
    }
  };

  const saveProfile = async () => {
    await upsertCustomer(db, { id: customer.id, name, phone, notes });
    refresh();
    notify('Enregistré', 'La fiche client a été mise à jour.');
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.cream }} contentContainerStyle={styles.content}>
      <Card style={{ gap: 8 }}>
        <Text style={styles.kicker}>Reste à payer</Text>
        <Text style={[styles.balance, { color: balance > 0 ? colors.danger : colors.forest }]}>
          {formatMoney(balance)}
        </Text>
        {customer.phone ? (
          <Button
            label="Appeler"
            icon="call"
            variant="secondary"
            onPress={() => Linking.openURL(`tel:${customer.phone!.replace(/\s/g, '')}`)}
          />
        ) : null}
      </Card>

      {balance > 0 ? (
        <Card style={{ gap: 10 }}>
          <Text style={styles.section}>Enregistrer un paiement</Text>
          <Field label="Montant" value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="5000" />
          <Field label="Note" value={note} onChangeText={setNote} placeholder="Espèces, Wave, Orange Money…" />
          <Button label="Encaisser" onPress={() => void pay()} />
        </Card>
      ) : null}

      <Card style={{ gap: 10 }}>
        <Text style={styles.section}>Fiche</Text>
        <Field label="Nom" value={name} onChangeText={setName} />
        <Field label="Téléphone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Field label="Notes" value={notes} onChangeText={setNotes} multiline />
        <Button label="Mettre à jour" variant="secondary" onPress={() => void saveProfile()} />
      </Card>

      <Card style={{ gap: 8 }}>
        <Text style={styles.section}>Ventes</Text>
        {sales.length === 0 ? (
          <Text style={styles.muted}>Aucune vente pour ce client.</Text>
        ) : (
          sales.map((sale) => (
            <Card key={sale.id} onPress={() => router.push(`/vente/${sale.id}`)} style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{paymentLabel(sale.payment_method)}</Text>
                <Text style={styles.muted}>{formatDateTime(sale.created_at)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.amount}>{formatMoney(sale.total)}</Text>
                <Text style={{ color: (remainingMap[sale.id] ?? 0) > 0 ? colors.danger : colors.forest, fontWeight: '700' }}>
                  {(remainingMap[sale.id] ?? 0) > 0
                    ? `Reste ${formatMoney(remainingMap[sale.id])}`
                    : 'Soldée'}
                </Text>
              </View>
            </Card>
          ))
        )}
      </Card>

      <Card style={{ gap: 8 }}>
        <Text style={styles.section}>Paiements</Text>
        {payments.length === 0 ? (
          <Text style={styles.muted}>Aucun paiement ultérieur.</Text>
        ) : (
          payments.map((payment) => (
            <View key={payment.id} style={styles.pay}>
              <Text style={styles.name}>{formatMoney(payment.amount)}</Text>
              <Text style={styles.muted}>
                {formatDateTime(payment.created_at)}
                {payment.note ? ` · ${payment.note}` : ''}
              </Text>
            </View>
          ))
        )}
      </Card>
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
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kicker: {
    color: colors.inkSoft,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  balance: {
    fontSize: 32,
    fontWeight: '800',
  },
  section: {
    fontWeight: '800',
    fontSize: 16,
    color: colors.ink,
  },
  muted: {
    color: colors.inkSoft,
    fontSize: 13,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontWeight: '800',
    color: colors.ink,
  },
  amount: {
    fontWeight: '800',
    color: colors.ink,
  },
  pay: {
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
});
