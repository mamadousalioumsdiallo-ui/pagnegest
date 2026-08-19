import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { StackBody } from '@/components/ui/Screen';
import { useBoutique } from '@/lib/BoutiqueContext';
import { notify } from '@/lib/confirm';
import { upsertCustomer } from '@/lib/db/queries';
import { useRouter } from 'expo-router';
import { useState } from 'react';

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
    <StackBody>
      <Field label="Nom" value={name} onChangeText={setName} placeholder="Ex. Aminata Diallo" />
      <Field label="Téléphone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="77 000 00 00" />
      <Field label="Notes" value={notes} onChangeText={setNotes} multiline placeholder="Préférences, quartier…" />
      <Button label="Enregistrer le client" loading={saving} onPress={() => void save()} />
    </StackBody>
  );
}
