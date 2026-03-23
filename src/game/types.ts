export type Element = 'fire' | 'water' | 'earth' | 'air';

export interface ElementConfig {
  name: string;
  color: string;
  glowColor: string;
  key: string;
  icon: string;
  ability: string;
}

export const ELEMENTS: Record<Element, ElementConfig> = {
  fire: { name: 'Fire', color: '#e8541a', glowColor: '#ff8533', key: '1', icon: '🔥', ability: 'Ignite' },
  water: { name: 'Water', color: '#0ea5c9', glowColor: '#38bdf8', key: '2', icon: '💧', ability: 'Freeze' },
  earth: { name: 'Earth', color: '#22915a', glowColor: '#4ade80', key: '3', icon: '🌿', ability: 'Terraform' },
  air: { name: 'Air', color: '#94a8be', glowColor: '#bfcfdf', key: '4', icon: '💨', ability: 'Glide' },
};
