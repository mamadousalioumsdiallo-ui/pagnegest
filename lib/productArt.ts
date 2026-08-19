import type { CategoryId } from '@/lib/categories';
import type { Ionicons } from '@expo/vector-icons';

type Art = {
  icon: keyof typeof Ionicons.glyphMap;
  gradient: [string, string];
};

export const PRODUCT_ART: Record<CategoryId, Art> = {
  woodin: { icon: 'color-palette', gradient: ['#8C2F1F', '#C45C26'] },
  phoenix: { icon: 'flame', gradient: ['#C45C26', '#E07A5F'] },
  uniwax: { icon: 'sparkles', gradient: ['#1B4332', '#40916C'] },
  bazin: { icon: 'diamond', gradient: ['#9A6B2F', '#D4A574'] },
  voile: { icon: 'water', gradient: ['#3A4F68', '#457B9D'] },
  tissus: { icon: 'layers', gradient: ['#6B3F69', '#9D8189'] },
  bebe: { icon: 'heart', gradient: ['#B56576', '#E07A5F'] },
  enfants: { icon: 'happy', gradient: ['#E07A5F', '#F4A261'] },
  accessoires: { icon: 'gift', gradient: ['#457B9D', '#6B9AC4'] },
  autres: { icon: 'shirt', gradient: ['#6B5344', '#A98467'] },
};

export function artForCategory(category: string): Art {
  return PRODUCT_ART[category as CategoryId] ?? PRODUCT_ART.autres;
}
