export type Element = 'fire' | 'water' | 'earth' | 'air';

export type Realm = 'fire' | 'water' | 'earth' | 'air';

export interface ElementConfig {
  name: string;
  color: string;
  glowColor: string;
  key: string;
  icon: string;
  ability: string;
  weakness: Element; // element this is weak against
  strength: Element; // element this is strong against
}

export const ELEMENTS: Record<Element, ElementConfig> = {
  fire: { name: 'Fire', color: '#e8541a', glowColor: '#ff8533', key: '1', icon: '🔥', ability: 'Ignite', weakness: 'water', strength: 'earth' },
  water: { name: 'Water', color: '#0ea5c9', glowColor: '#38bdf8', key: '2', icon: '💧', ability: 'Freeze', weakness: 'earth', strength: 'fire' },
  earth: { name: 'Earth', color: '#22915a', glowColor: '#4ade80', key: '3', icon: '🌿', ability: 'Terraform', weakness: 'air', strength: 'water' },
  air: { name: 'Air', color: '#94a8be', glowColor: '#bfcfdf', key: '4', icon: '💨', ability: 'Glide', weakness: 'fire', strength: 'earth' },
};

export interface EnemyData {
  id: string;
  element: Element;
  position: [number, number, number];
  health: number;
  maxHealth: number;
  speed: number;
  damage: number;
  xpReward: number;
  dead: boolean;
  deathTime?: number;
  attackCooldown: number;
  lastAttackTime: number;
}

export interface CollectibleData {
  id: string;
  type: 'health' | 'xp' | 'element_shard';
  element?: Element;
  position: [number, number, number];
  collected: boolean;
}

export interface PortalData {
  realm: Realm;
  position: [number, number, number];
}

export interface GameStats {
  kills: number;
  xp: number;
  level: number;
  xpToNext: number;
  maxHealth: number;
  attackPower: number;
  realmsVisited: Set<Realm>;
}

export const REALM_CONFIGS: Record<Realm, {
  name: string;
  groundColor: string;
  fogColor: string;
  ambientColor: string;
  skyColor: string;
}> = {
  fire: { name: 'Ember Wastes', groundColor: '#3d1a0a', fogColor: '#1a0a05', ambientColor: '#4a2010', skyColor: '#1a0500' },
  water: { name: 'Tidal Depths', groundColor: '#0a2a3d', fogColor: '#050a1a', ambientColor: '#102030', skyColor: '#000a15' },
  earth: { name: 'Verdant Wilds', groundColor: '#1a3d0a', fogColor: '#0a1a05', ambientColor: '#203010', skyColor: '#051500' },
  air: { name: 'Sky Citadel', groundColor: '#1a2a3d', fogColor: '#0a0f1a', ambientColor: '#202830', skyColor: '#0a0f15' },
};

export function calcXpToNext(level: number): number {
  return Math.floor(80 * Math.pow(1.4, level - 1));
}

export function calcDamage(attackPower: number, attackerElement: Element, defenderElement: Element): number {
  const config = ELEMENTS[attackerElement];
  let multiplier = 1;
  if (config.strength === defenderElement) multiplier = 2;
  if (config.weakness === defenderElement) multiplier = 0.5;
  return Math.floor(attackPower * multiplier);
}
