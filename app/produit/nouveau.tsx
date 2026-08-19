import { ProductForm } from '@/components/ProductForm';
import { colors, spacing } from '@/constants/theme';
import { useBoutique } from '@/lib/BoutiqueContext';
import { upsertProduct } from '@/lib/db/queries';
import { useRouter } from 'expo-router';
import { ScrollView } from 'react-native';

export default function NewProductScreen() {
  const { db, refresh } = useBoutique();
  const router = useRouter();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.cream }}
      contentContainerStyle={{ padding: spacing.md, maxWidth: 560, width: '100%', alignSelf: 'center' }}>
      <ProductForm
        submitLabel="Enregistrer le produit"
        onSubmit={async (value) => {
          await upsertProduct(db, value);
          refresh();
          router.back();
        }}
      />
    </ScrollView>
  );
}
