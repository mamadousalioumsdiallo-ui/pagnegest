import { ProductForm } from '@/components/ProductForm';
import { StackBody } from '@/components/ui/Screen';
import { useBoutique } from '@/lib/BoutiqueContext';
import { upsertProduct } from '@/lib/db/queries';
import { useRouter } from 'expo-router';

export default function NewProductScreen() {
  const { db, refresh } = useBoutique();
  const router = useRouter();

  return (
    <StackBody>
      <ProductForm
        submitLabel="Enregistrer le produit"
        onSubmit={async (value) => {
          await upsertProduct(db, value);
          refresh();
          router.back();
        }}
      />
    </StackBody>
  );
}
