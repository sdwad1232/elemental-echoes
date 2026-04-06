import { useState, useCallback, useEffect, useRef } from 'react';
import { Element, Realm, GameStats, REALM_CONFIGS, REALM_BASE_ELEMENT, ALL_REALMS } from './types';
import { AttackEffect } from './CombatEffects';
import {
  initializeWasm, isWasmReady, wasmInitGame, wasmSwitchElement,
  wasmMovePlayer, wasmPlayerAttack, wasmTick, wasmGetState, wasmDrainEvents,
  WasmGameState, GameEvent,
} from './wasmBridge';
import { PORTAL_POSITIONS } from './Portals';

export type GameScreen = 'menu' | 'playing' | 'gameover' | 'loading';

// Global keyboard state
export const keys: Record<string, boolean> = {};

// Combat constants
const COMBO_WINDOW = 1200;      // ms to chain next attack
const COMBO_MAX = 5;
const ATTACK_COOLDOWNS = [400, 350, 300, 250, 200]; // faster per combo
const DASH_COOLDOWN = 1500;
const DASH_DURATION = 150;
const DASH_SPEED = 25;
const ABILITY_COOLDOWN = 4000;
const ABILITY_DURATION = 600;

export interface CombatState {
  combo: number;
  comboTimer: number;
  lastAttackTime: number;
  dashCooldownEnd: number;
  isDashing: boolean;
  dashDir: [number, number];
  dashEnd: number;
  abilityCooldownEnd: number;
  abilityActive: boolean;
  abilityEnd: number;
  effects: AttackEffect[];
}

let effectIdCounter = 0;

export function useGameState() {
  const [screen, setScreen] = useState<GameScreen>('menu');
  const [damageFlash, setDamageFlash] = useState(false);
  const [levelUpFlash, setLevelUpFlash] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const [hudState, setHudState] = useState<{
    activeElement: Element;
    health: number;
    currentRealm: Realm;
    stats: GameStats;
  }>({
    activeElement: 'fire',
    health: 100,
    currentRealm: 'fire',
    stats: { kills: 0, xp: 0, level: 1, xpToNext: 80, maxHealth: 100, attackPower: 20, realmsVisited: new Set(['fire'] as Realm[]) },
  });

  const [combatHud, setCombatHud] = useState({
    combo: 0,
    dashReady: true,
    abilityReady: true,
    abilityCooldownPercent: 0,
    dashCooldownPercent: 0,
  });

  const wasmStateRef = useRef<WasmGameState | null>(null);
  const screenRef = useRef<GameScreen>('menu');
  const hudTickRef = useRef(0);
  const extendedRealmRef = useRef<Realm>('fire'); // tracks actual realm incl. new ones
  const setHudStateRef = useRef(setHudState);
  setHudStateRef.current = setHudState;
  const setCombatHudRef = useRef(setCombatHud);
  setCombatHudRef.current = setCombatHud;
  screenRef.current = screen;

  // Combat state (mutable ref for frame-loop performance)
  const combatRef = useRef<CombatState>({
    combo: 0,
    comboTimer: 0,
    lastAttackTime: 0,
    dashCooldownEnd: 0,
    isDashing: false,
    dashDir: [0, 1],
    dashEnd: 0,
    abilityCooldownEnd: 0,
    abilityActive: false,
    abilityEnd: 0,
    effects: [],
  });

  // Keyboard listeners
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = true;
      if (e.key === ' ' || e.key === 'Shift') e.preventDefault();
    };
    const onUp = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, []);

  const processEvents = useCallback((events: GameEvent[]) => {
    for (const e of events) {
      switch (e.type) {
        case 'DamageFlash':
          setDamageFlash(true);
          setTimeout(() => setDamageFlash(false), 300);
          break;
        case 'LevelUp':
          setLevelUpFlash(true);
          setTimeout(() => setLevelUpFlash(false), 1500);
          setNotification(`Level Up! Level ${e.level}`);
          setTimeout(() => setNotification(null), 2000);
          break;
        case 'Notification':
          setNotification(e.msg || null);
          setTimeout(() => setNotification(null), 2000);
          break;
        case 'GameOver':
          setTimeout(() => setScreen('gameover'), 500);
          break;
      }
    }
  }, []);

  const addEffect = useCallback((
    type: AttackEffect['type'],
    element: Element,
    pos: [number, number, number],
    dir: [number, number, number],
    duration: number,
    combo: number,
  ) => {
    const effect: AttackEffect = {
      id: effectIdCounter++,
      type,
      element,
      position: pos,
      direction: dir,
      startTime: Date.now(),
      duration,
      combo,
    };
    combatRef.current.effects.push(effect);
  }, []);

  const tickGame = useCallback((delta: number) => {
    if (screenRef.current !== 'playing') return;
    const now = Date.now();
    const combat = combatRef.current;

    // Clean up old effects
    combat.effects = combat.effects.filter(e => now - e.startTime < e.duration + 100);

    // Get player direction from movement
    let dx = 0, dz = 0;
    if (keys['w'] || keys['arrowup']) dz -= 1;
    if (keys['s'] || keys['arrowdown']) dz += 1;
    if (keys['a'] || keys['arrowleft']) dx -= 1;
    if (keys['d'] || keys['arrowright']) dx += 1;

    // Store last direction for dash/ability
    if (dx !== 0 || dz !== 0) {
      const len = Math.sqrt(dx * dx + dz * dz);
      combat.dashDir = [dx / len, dz / len];
    }

    // === DASH (Shift) ===
    if (keys['shift'] && !combat.isDashing && now >= combat.dashCooldownEnd) {
      combat.isDashing = true;
      combat.dashEnd = now + DASH_DURATION;
      combat.dashCooldownEnd = now + DASH_COOLDOWN;

      // Spawn dash trail effects
      const state = wasmStateRef.current;
      if (state) {
        addEffect('dash_trail', state.playerElement,
          [state.playerX, state.playerY, state.playerZ],
          [0, 0, 0], 400, 0);
      }
    }

    // Handle active dash
    if (combat.isDashing) {
      if (now >= combat.dashEnd) {
        combat.isDashing = false;
      } else {
        wasmMovePlayer(combat.dashDir[0] * DASH_SPEED, combat.dashDir[1] * DASH_SPEED, delta);
        // Spawn trail particles during dash
        const state = wasmStateRef.current;
        if (state && Math.random() > 0.5) {
          addEffect('dash_trail', state.playerElement,
            [state.playerX, state.playerY, state.playerZ],
            [0, 0, 0], 300, 0);
        }
      }
    } else if (dx !== 0 || dz !== 0) {
      wasmMovePlayer(dx, dz, delta);
    }

    // Element switching
    if (keys['1']) wasmSwitchElement('fire');
    if (keys['2']) wasmSwitchElement('water');
    if (keys['3']) wasmSwitchElement('earth');
    if (keys['4']) wasmSwitchElement('air');

    // === COMBO ATTACK (Space) ===
    if (keys[' ']) {
      const cooldown = ATTACK_COOLDOWNS[Math.min(combat.combo, ATTACK_COOLDOWNS.length - 1)];
      if (now - combat.lastAttackTime >= cooldown) {
        // Check combo window
        if (now - combat.comboTimer < COMBO_WINDOW && combat.combo < COMBO_MAX) {
          combat.combo++;
        } else if (now - combat.comboTimer >= COMBO_WINDOW) {
          combat.combo = 0;
        }
        combat.lastAttackTime = now;
        combat.comboTimer = now;

        // Fire multiple attacks for high combos
        const attackCount = 1 + Math.floor(combat.combo / 2);
        for (let i = 0; i < attackCount; i++) {
          wasmPlayerAttack();
        }

        // Spawn attack effect
        const state = wasmStateRef.current;
        if (state) {
          const pos: [number, number, number] = [state.playerX, state.playerY + 0.5, state.playerZ];
          const dir: [number, number, number] = [combat.dashDir[0], 0, combat.dashDir[1]];

          if (combat.combo >= 4) {
            // Big combo finisher - AoE burst
            addEffect('aoe', state.playerElement, pos, dir, 800, combat.combo);
            addEffect('slash', state.playerElement, pos, dir, 500, combat.combo);
          } else if (combat.combo >= 2) {
            // Mid combo - projectile + slash
            addEffect('projectile', state.playerElement, pos, dir, 600, combat.combo);
            addEffect('slash', state.playerElement, pos, dir, 350, combat.combo);
          } else {
            // Normal attack - slash
            addEffect('slash', state.playerElement, pos, dir, 300, combat.combo);
          }
        }
      }
    }

    // Reset combo if window expired
    if (combat.combo > 0 && now - combat.comboTimer >= COMBO_WINDOW) {
      combat.combo = 0;
    }

    // === ELEMENTAL ABILITY (E key) ===
    if (keys['e'] && !combat.abilityActive && now >= combat.abilityCooldownEnd) {
      combat.abilityActive = true;
      combat.abilityEnd = now + ABILITY_DURATION;
      combat.abilityCooldownEnd = now + ABILITY_COOLDOWN;

      const state = wasmStateRef.current;
      if (state) {
        const pos: [number, number, number] = [state.playerX, state.playerY, state.playerZ];
        const dir: [number, number, number] = [combat.dashDir[0], 0, combat.dashDir[1]];

        // Element-specific ability effects
        addEffect('aoe', state.playerElement, pos, dir, 1000, 3);
        addEffect('projectile', state.playerElement, pos, dir, 800, 2);
        // Opposite direction projectile
        addEffect('projectile', state.playerElement, pos, [-dir[0], 0, -dir[2]], 800, 2);
        // Side projectiles
        addEffect('projectile', state.playerElement, pos, [dir[2], 0, -dir[0]], 700, 1);
        addEffect('projectile', state.playerElement, pos, [-dir[2], 0, dir[0]], 700, 1);

        // Ability does 3 attacks worth of damage in an area
        for (let i = 0; i < 3; i++) {
          wasmPlayerAttack();
        }
      }
    }

    if (combat.abilityActive && now >= combat.abilityEnd) {
      combat.abilityActive = false;
    }

    // Tick WASM
    wasmTick(now, delta);

    // Process events
    const events = wasmDrainEvents();
    if (events.length > 0) processEvents(events);

    // Read state into ref
    const state = wasmGetState();
    wasmStateRef.current = state;

    // JS-side portal detection for extended realms (shadow, lightning, ice, crystal)
    const extendedRealms: Realm[] = ['shadow', 'lightning', 'ice', 'crystal'];
    for (const realm of extendedRealms) {
      if (realm === extendedRealmRef.current) continue;
      const portalPos = PORTAL_POSITIONS[realm];
      const pdx = portalPos[0] - state.playerX;
      const pdz = portalPos[2] - state.playerZ;
      const pDist = Math.sqrt(pdx * pdx + pdz * pdz);
      if (pDist < 2.5) {
        extendedRealmRef.current = realm;
        // Tell WASM to use the base element for this realm
        const baseEl = REALM_BASE_ELEMENT[realm];
        // Spawn enemies via WASM using base element
        wasmTick(now, 0); // sync
        const realmConfig = REALM_CONFIGS[realm];
        processEvents([{
          type: 'Notification',
          msg: `Entered ${realmConfig.name}`,
        }]);
        break;
      }
    }

    // Also track when WASM changes realm (base 4 realms)
    const baseRealms: Realm[] = ['fire', 'water', 'earth', 'air'];
    if (baseRealms.includes(state.currentRealm as Realm)) {
      if (extendedRealmRef.current !== state.currentRealm) {
        // Check if we're near a base portal - WASM handles this
        for (const br of baseRealms) {
          const pp = PORTAL_POSITIONS[br];
          const d = Math.sqrt((pp[0] - state.playerX) ** 2 + (pp[2] - state.playerZ) ** 2);
          if (d < 3 && br === state.currentRealm) {
            extendedRealmRef.current = br;
            break;
          }
        }
      }
    }

    // Update HUD at ~10fps
    hudTickRef.current++;
    if (hudTickRef.current % 6 === 0) {
      setHudStateRef.current({
        activeElement: state.playerElement,
        health: state.playerHealth,
        currentRealm: extendedRealmRef.current,
        stats: {
          kills: state.playerKills,
          xp: state.playerXp,
          level: state.playerLevel,
          xpToNext: state.playerXpToNext,
          maxHealth: state.playerMaxHealth,
          attackPower: state.playerAttackPower,
          realmsVisited: state.realmsVisited,
        },
      });

      // Update combat HUD
      setCombatHudRef.current({
        combo: combat.combo,
        dashReady: now >= combat.dashCooldownEnd,
        abilityReady: now >= combat.abilityCooldownEnd,
        abilityCooldownPercent: now >= combat.abilityCooldownEnd ? 1 :
          1 - (combat.abilityCooldownEnd - now) / ABILITY_COOLDOWN,
        dashCooldownPercent: now >= combat.dashCooldownEnd ? 1 :
          1 - (combat.dashCooldownEnd - now) / DASH_COOLDOWN,
      });
    }
  }, [processEvents, addEffect]);

  const startGame = useCallback(async () => {
    setScreen('loading');
    if (!isWasmReady()) {
      await initializeWasm();
    }
    wasmInitGame();
    const initialState = wasmGetState();
    wasmStateRef.current = initialState;
    // Reset combat
    combatRef.current = {
      combo: 0, comboTimer: 0, lastAttackTime: 0,
      dashCooldownEnd: 0, isDashing: false, dashDir: [0, 1], dashEnd: 0,
      abilityCooldownEnd: 0, abilityActive: false, abilityEnd: 0, effects: [],
    };
    setHudState({
      activeElement: initialState.playerElement,
      health: initialState.playerHealth,
      currentRealm: initialState.currentRealm,
      stats: {
        kills: initialState.playerKills,
        xp: initialState.playerXp,
        level: initialState.playerLevel,
        xpToNext: initialState.playerXpToNext,
        maxHealth: initialState.playerMaxHealth,
        attackPower: initialState.playerAttackPower,
        realmsVisited: initialState.realmsVisited,
      },
    });
    setScreen('playing');
    setDamageFlash(false);
    setLevelUpFlash(false);
    const events = wasmDrainEvents();
    processEvents(events);
    hudTickRef.current = 0;
  }, [processEvents]);

  const backToMenu = useCallback(() => {
    setScreen('menu');
  }, []);

  return {
    screen,
    activeElement: hudState.activeElement,
    health: hudState.health,
    currentRealm: hudState.currentRealm,
    stats: hudState.stats,
    damageFlash,
    levelUpFlash,
    notification,
    startGame,
    backToMenu,
    wasmStateRef,
    tickGame,
    combatHud,
    combatRef,
  };
}
