export type Element = 'fire' | 'water' | 'earth' | 'air';

export type Realm = 'fire' | 'water' | 'earth' | 'air' | 'shadow' | 'lightning' | 'ice' | 'crystal';

export interface ElementConfig {
  name: string;
  color: string;
  glowColor: string;
  key: string;
  icon: string;
  ability: string;
  weakness: Element;
  strength: Element;
}

export const ELEMENTS: Record<Element, ElementConfig> = {
  fire: { name: 'Fire', color: '#e8541a', glowColor: '#ff8533', key: '1', icon: '🔥', ability: 'Ignite', weakness: 'water', strength: 'earth' },
  water: { name: 'Water', color: '#0ea5c9', glowColor: '#38bdf8', key: '2', icon: '💧', ability: 'Freeze', weakness: 'earth', strength: 'fire' },
  earth: { name: 'Earth', color: '#22915a', glowColor: '#4ade80', key: '3', icon: '🌿', ability: 'Terraform', weakness: 'air', strength: 'water' },
  air: { name: 'Air', color: '#94a8be', glowColor: '#bfcfdf', key: '4', icon: '💨', ability: 'Glide', weakness: 'fire', strength: 'earth' },
};

// Map extended realms to their base element for WASM combat
export const REALM_BASE_ELEMENT: Record<Realm, Element> = {
  fire: 'fire',
  water: 'water',
  earth: 'earth',
  air: 'air',
  shadow: 'fire',
  lightning: 'air',
  ice: 'water',
  crystal: 'earth',
};

export interface RealmConfig {
  name: string;
  groundColor: string;
  fogColor: string;
  ambientColor: string;
  skyColor: string;
  enemySpeedMult: number;
  enemyHealthMult: number;
  enemyDamageMult: number;
  gravity: number; // affects floating islands height
  particleColor: string;
  description: string;
}

export const REALM_CONFIGS: Record<Realm, RealmConfig> = {
  fire: {
    name: 'Ember Wastes',
    groundColor: '#3d1a0a',
    fogColor: '#1a0a05',
    ambientColor: '#4a2010',
    skyColor: '#1a0500',
    enemySpeedMult: 1.0,
    enemyHealthMult: 1.0,
    enemyDamageMult: 1.0,
    gravity: 1.0,
    particleColor: '#ff4400',
    description: 'Scorched volcanic plains with rivers of lava',
  },
  water: {
    name: 'Tidal Depths',
    groundColor: '#0a2a3d',
    fogColor: '#050a1a',
    ambientColor: '#102030',
    skyColor: '#000a15',
    enemySpeedMult: 0.8,
    enemyHealthMult: 1.2,
    enemyDamageMult: 0.9,
    gravity: 0.7,
    particleColor: '#0088ff',
    description: 'Deep ocean trenches with bioluminescent life',
  },
  earth: {
    name: 'Verdant Wilds',
    groundColor: '#1a3d0a',
    fogColor: '#0a1a05',
    ambientColor: '#203010',
    skyColor: '#051500',
    enemySpeedMult: 0.9,
    enemyHealthMult: 1.3,
    enemyDamageMult: 1.1,
    gravity: 1.2,
    particleColor: '#44ff00',
    description: 'Ancient forests with massive living trees',
  },
  air: {
    name: 'Sky Citadel',
    groundColor: '#1a2a3d',
    fogColor: '#0a0f1a',
    ambientColor: '#202830',
    skyColor: '#0a0f15',
    enemySpeedMult: 1.3,
    enemyHealthMult: 0.7,
    enemyDamageMult: 1.0,
    gravity: 0.5,
    particleColor: '#aabbcc',
    description: 'Floating platforms high above the clouds',
  },
  shadow: {
    name: 'Void Abyss',
    groundColor: '#0d0a14',
    fogColor: '#050308',
    ambientColor: '#1a0f2a',
    skyColor: '#050010',
    enemySpeedMult: 1.4,
    enemyHealthMult: 1.5,
    enemyDamageMult: 1.4,
    gravity: 0.3,
    particleColor: '#8b00ff',
    description: 'A dimension of pure darkness where shadows come alive',
  },
  lightning: {
    name: 'Storm Pinnacle',
    groundColor: '#1a1a2d',
    fogColor: '#0a0a15',
    ambientColor: '#252540',
    skyColor: '#0a0a20',
    enemySpeedMult: 1.6,
    enemyHealthMult: 0.9,
    enemyDamageMult: 1.6,
    gravity: 0.8,
    particleColor: '#ffff00',
    description: 'Electrified peaks where lightning never stops',
  },
  ice: {
    name: 'Frozen Expanse',
    groundColor: '#1a2a35',
    fogColor: '#0a1520',
    ambientColor: '#152535',
    skyColor: '#051015',
    enemySpeedMult: 0.6,
    enemyHealthMult: 2.0,
    enemyDamageMult: 1.2,
    gravity: 1.0,
    particleColor: '#88ddff',
    description: 'Endless glacier with frozen ancient creatures',
  },
  crystal: {
    name: 'Prismatic Caverns',
    groundColor: '#2a1a2d',
    fogColor: '#100a12',
    ambientColor: '#301530',
    skyColor: '#0f0510',
    enemySpeedMult: 1.1,
    enemyHealthMult: 1.8,
    enemyDamageMult: 1.3,
    gravity: 0.9,
    particleColor: '#ff44ff',
    description: 'Underground caverns filled with living crystals',
  },
};

export const ALL_REALMS: Realm[] = ['fire', 'water', 'earth', 'air', 'shadow', 'lightning', 'ice', 'crystal'];

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
