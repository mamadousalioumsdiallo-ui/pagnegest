import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { colors, spacing } from '@/constants/theme';
import { useBoutique } from '@/lib/BoutiqueContext';
import { upsertCustomer } from '@/lib/db/queries';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { notify } from '@/lib/confirm';
import { ScrollView, StyleSheet } from 'react-native';

export default function NewCustomerScreen() {
  const { db, refresh } = useBoutique();
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) {
      notify('Client', 'Indiquez le nom du client.');
      return;
    }
    setSaving(true);
    try {
      const id = await upsertCustomer(db, { name, phone, notes });
      refresh();
      router.replace(`/client/${id}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.cream }} contentContainerStyle={styles.content}>
      <Field label="Nom" value={name} onChangeText={setName} placeholder="Ex. Aminata Diallo" />
      <Field label="Téléphone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="77 000 00 00" />
      <Field label="Notes" value={notes} onChangeText={setNotes} multiline placeholder="Préférences, quartier…" />
      <Button label="Enregistrer le client" loading={saving} onPress={() => void save()} />
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
});
