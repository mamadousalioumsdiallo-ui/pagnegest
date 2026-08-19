export type CategoryId =
  | 'woodin'
  | 'phoenix'
  | 'uniwax'
  | 'bazin'
  | 'voile'
  | 'tissus'
  | 'bebe'
  | 'enfants'
  | 'accessoires'
  | 'autres';

export type Category = {
  id: CategoryId;
  label: string;
  shortLabel: string;
  color: string;
};

export const CATEGORIES: Category[] = [
  { id: 'woodin', label: 'Pagnes Woodin', shortLabel: 'Woodin', color: '#8C2F1F' },
  { id: 'phoenix', label: 'Pagnes Phoenix', shortLabel: 'Phoenix', color: '#C45C26' },
  { id: 'uniwax', label: 'Pagnes Uniwax', shortLabel: 'Uniwax', color: '#1F4D3A' },
  { id: 'bazin', label: 'Bazin', shortLabel: 'Bazin', color: '#C9A227' },
  { id: 'voile', label: 'Voile', shortLabel: 'Voile', color: '#3D5A80' },
  { id: 'tissus', label: 'Tissus', shortLabel: 'Tissus', color: '#6B3F69' },
  { id: 'bebe', label: 'Vêtements bébé', shortLabel: 'Bébé', color: '#B56576' },
  { id: 'enfants', label: 'Vêtements enfants', shortLabel: 'Enfants', color: '#E07A5F' },
  { id: 'accessoires', label: 'Accessoires bébé', shortLabel: 'Accessoires', color: '#457B9D' },
  { id: 'autres', label: 'Autres', shortLabel: 'Autres', color: '#6B5344' },
];

export const UNITS = ['6 yards', '12 yards', 'mètre', 'pièce', 'lot', 'paquet'] as const;

export type Unit = (typeof UNITS)[number];

export function getCategory(id: string): Category {
  return CATEGORIES.find((item) => item.id === id) ?? CATEGORIES[CATEGORIES.length - 1];
}
