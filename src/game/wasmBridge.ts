import initWasm, {
  init_game,
  switch_element as wasm_switch_element,
  move_player as wasm_move_player,
  player_attack as wasm_player_attack,
  tick as wasm_tick,
  get_state,
  drain_events,
  Element as WasmElement,
} from '@/lib/wasm/elemental-realms/elemental_realms';
import type { Element, Realm, GameStats, EnemyData, CollectibleData } from './types';

let wasmReady = false;

export async function initializeWasm(): Promise<void> {
  if (wasmReady) return;
  await initWasm();
  wasmReady = true;
}

export function isWasmReady(): boolean {
  return wasmReady;
}

// Element mapping
const ELEMENT_TO_WASM: Record<Element, number> = {
  fire: WasmElement.Fire,
  water: WasmElement.Water,
  earth: WasmElement.Earth,
  air: WasmElement.Air,
};

const WASM_TO_ELEMENT: Record<number, Element> = {
  [WasmElement.Fire]: 'fire',
  [WasmElement.Water]: 'water',
  [WasmElement.Earth]: 'earth',
  [WasmElement.Air]: 'air',
};

const CTYPE_MAP: Record<number, 'health' | 'xp' | 'element_shard'> = {
  0: 'health',
  1: 'xp',
  2: 'element_shard',
};

export function wasmInitGame(): void {
  init_game();
}

export function wasmSwitchElement(el: Element): void {
  wasm_switch_element(ELEMENT_TO_WASM[el]);
}

export function wasmMovePlayer(dx: number, dz: number, delta: number): void {
  wasm_move_player(dx, dz, delta);
}

export function wasmPlayerAttack(): void {
  wasm_player_attack();
}

export function wasmTick(now: number, delta: number): void {
  wasm_tick(now, delta);
}

export interface WasmGameState {
  playerX: number;
  playerY: number;
  playerZ: number;
  playerHealth: number;
  playerMaxHealth: number;
  playerAttackPower: number;
  playerElement: Element;
  playerLevel: number;
  playerXp: number;
  playerXpToNext: number;
  playerKills: number;
  currentRealm: Realm;
  enemies: EnemyData[];
  collectibles: CollectibleData[];
  realmsVisited: Set<Realm>;
}

export function wasmGetState(): WasmGameState {
  const raw = get_state();

  const enemies: EnemyData[] = (raw.enemies || []).map((e: any) => ({
    id: e.id,
    element: WASM_TO_ELEMENT[e.element] || 'fire',
    position: [e.x, e.y, e.z] as [number, number, number],
    health: e.health,
    maxHealth: e.max_health,
    speed: e.speed,
    damage: e.damage,
    xpReward: e.xp_reward,
    dead: e.dead,
    deathTime: e.death_time || undefined,
    attackCooldown: e.attack_cooldown,
    lastAttackTime: e.last_attack_time,
  }));

  const collectibles: CollectibleData[] = (raw.collectibles || []).map((c: any) => ({
    id: c.id,
    type: CTYPE_MAP[c.ctype] || 'xp',
    element: WASM_TO_ELEMENT[c.element],
    position: [c.x, c.y, c.z] as [number, number, number],
    collected: c.collected,
  }));

  // Decode realms visited bitmask
  const visited = new Set<Realm>();
  const elements: Realm[] = ['fire', 'water', 'earth', 'air'];
  for (let i = 0; i < 4; i++) {
    if (raw.realms_visited & (1 << i)) {
      visited.add(elements[i]);
    }
  }

  return {
    playerX: raw.player_x,
    playerY: raw.player_y,
    playerZ: raw.player_z,
    playerHealth: raw.player_health,
    playerMaxHealth: raw.player_max_health,
    playerAttackPower: raw.player_attack_power,
    playerElement: WASM_TO_ELEMENT[raw.player_element] || 'fire',
    playerLevel: raw.player_level,
    playerXp: raw.player_xp,
    playerXpToNext: raw.player_xp_to_next,
    playerKills: raw.player_kills,
    currentRealm: WASM_TO_ELEMENT[raw.current_realm] as Realm || 'fire',
    enemies,
    collectibles,
    realmsVisited: visited,
  };
}

export interface GameEvent {
  type: 'DamageFlash' | 'LevelUp' | 'Notification' | 'GameOver' | 'EnemyKilled' | 'ItemCollected';
  level?: number;
  msg?: string;
  id?: string;
  ctype?: number;
}

export function wasmDrainEvents(): GameEvent[] {
  const raw = drain_events();
  if (!Array.isArray(raw)) return [];
  return raw.map((e: any) => {
    if (typeof e === 'string') {
      return { type: e } as GameEvent;
    }
    // Serde serializes enums with data as { VariantName: { fields } }
    if (e.LevelUp) return { type: 'LevelUp' as const, level: e.LevelUp.level };
    if (e.Notification) return { type: 'Notification' as const, msg: e.Notification.msg };
    if (e.EnemyKilled) return { type: 'EnemyKilled' as const, id: e.EnemyKilled.id };
    if (e.ItemCollected) return { type: 'ItemCollected' as const, id: e.ItemCollected.id, ctype: e.ItemCollected.ctype };
    return { type: e as string } as GameEvent;
  });
}
