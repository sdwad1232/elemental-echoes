import { useState, useCallback, useEffect, useRef } from 'react';
import { Element, Realm, GameStats } from './types';
import {
  initializeWasm, isWasmReady, wasmInitGame, wasmSwitchElement,
  wasmMovePlayer, wasmPlayerAttack, wasmTick, wasmGetState, wasmDrainEvents,
  WasmGameState, GameEvent,
} from './wasmBridge';

export type GameScreen = 'menu' | 'playing' | 'gameover' | 'loading';

// Global keyboard state – shared with GameWorld via ref
export const keys: Record<string, boolean> = {};

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

  const wasmStateRef = useRef<WasmGameState | null>(null);
  const screenRef = useRef<GameScreen>('menu');
  const attackCooldownRef = useRef(false);
  const hudTickRef = useRef(0);
  const setHudStateRef = useRef(setHudState);
  setHudStateRef.current = setHudState;
  screenRef.current = screen;

  // Keyboard listeners
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = true;
      if (e.key === ' ') e.preventDefault();
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

  // This function is called from GameWorld's useFrame (inside R3F)
  const tickGame = useCallback((delta: number) => {
    if (screenRef.current !== 'playing') return;

    // Read keyboard and move player
    let dx = 0, dz = 0;
    if (keys['w'] || keys['arrowup']) dz -= 1;
    if (keys['s'] || keys['arrowdown']) dz += 1;
    if (keys['a'] || keys['arrowleft']) dx -= 1;
    if (keys['d'] || keys['arrowright']) dx += 1;
    if (dx !== 0 || dz !== 0) {
      wasmMovePlayer(dx, dz, delta);
    }

    // Element switching
    if (keys['1']) wasmSwitchElement('fire');
    if (keys['2']) wasmSwitchElement('water');
    if (keys['3']) wasmSwitchElement('earth');
    if (keys['4']) wasmSwitchElement('air');

    // Attack
    if (keys[' '] && !attackCooldownRef.current) {
      attackCooldownRef.current = true;
      wasmPlayerAttack();
      setTimeout(() => { attackCooldownRef.current = false; }, 500);
    }

    // Tick WASM
    wasmTick(Date.now(), delta);

    // Process events
    const events = wasmDrainEvents();
    if (events.length > 0) processEvents(events);

    // Read state into ref (NO re-render)
    const state = wasmGetState();
    wasmStateRef.current = state;

    // Update HUD at ~10fps
    hudTickRef.current++;
    if (hudTickRef.current % 6 === 0) {
      setHudStateRef.current({
        activeElement: state.playerElement,
        health: state.playerHealth,
        currentRealm: state.currentRealm,
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
    }
  }, [processEvents]);

  const startGame = useCallback(async () => {
    setScreen('loading');
    if (!isWasmReady()) {
      await initializeWasm();
    }
    wasmInitGame();
    const initialState = wasmGetState();
    wasmStateRef.current = initialState;
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
  };
}
