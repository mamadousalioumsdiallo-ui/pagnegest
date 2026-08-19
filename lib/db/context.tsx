import { BrandSplash } from '@/components/ui/BrandSplash';
import type { BoutiqueDatabase } from '@/lib/db/types';
import { createContext, useContext, type ReactNode } from 'react';

export const DbContext = createContext<BoutiqueDatabase | null>(null);

export function useDatabase(): BoutiqueDatabase {
  const value = useContext(DbContext);
  if (!value) {
    throw new Error('useDatabase must be used inside DatabaseProvider');
  }
  return value;
}

export function DatabaseLoadingScreen({ message }: { message?: string }) {
  return <BrandSplash message={message} />;
}

export function DatabaseShell({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
