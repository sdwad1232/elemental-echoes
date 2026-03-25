import { useState, useCallback, useEffect, useRef } from 'react';
import { Element, Realm, GameStats } from './types';
import {
  initializeWasm, isWasmReady, wasmInitGame, wasmSwitchElement,
  wasmMovePlayer, wasmPlayerAttack, wasmTick, wasmGetState, wasmDrainEvents,
  WasmGameState, GameEvent,
} from './wasmBridge';

export type GameScreen = 'menu' | 'playing' | 'gameover' | 'loading';

// Global keyboard state
const keys: Record<string, boolean> = {};

export function useGameState() {
  const [screen, setScreen] = useState<GameScreen>('menu');
  const [damageFlash, setDamageFlash] = useState(false);
  const [levelUpFlash, setLevelUpFlash] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [wasmState, setWasmState] = useState<WasmGameState | null>(null);

  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const screenRef = useRef<GameScreen>('menu');
  const attackCooldownRef = useRef(false);
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

  const gameLoop = useCallback((time: number) => {
    if (screenRef.current !== 'playing') return;

    const delta = lastTimeRef.current ? Math.min((time - lastTimeRef.current) / 1000, 0.1) : 0.016;
    lastTimeRef.current = time;

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

    // Read state
    const state = wasmGetState();
    setWasmState(state);

    animFrameRef.current = requestAnimationFrame(gameLoop);
  }, [processEvents]);

  const startGame = useCallback(async () => {
    setScreen('loading');
    if (!isWasmReady()) {
      await initializeWasm();
    }
    wasmInitGame();
    const initialState = wasmGetState();
    setWasmState(initialState);
    setScreen('playing');
    setDamageFlash(false);
    setLevelUpFlash(false);
    const events = wasmDrainEvents();
    processEvents(events);
    lastTimeRef.current = 0;
    animFrameRef.current = requestAnimationFrame(gameLoop);
  }, [gameLoop, processEvents]);

  const backToMenu = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    setScreen('menu');
  }, []);

  useEffect(() => {
    if (screen !== 'playing') {
      cancelAnimationFrame(animFrameRef.current);
    }
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [screen]);

  const stats: GameStats = wasmState ? {
    kills: wasmState.playerKills,
    xp: wasmState.playerXp,
    level: wasmState.playerLevel,
    xpToNext: wasmState.playerXpToNext,
    maxHealth: wasmState.playerMaxHealth,
    attackPower: wasmState.playerAttackPower,
    realmsVisited: wasmState.realmsVisited,
  } : {
    kills: 0, xp: 0, level: 1, xpToNext: 80,
    maxHealth: 100, attackPower: 20, realmsVisited: new Set(['fire'] as Realm[]),
  };

  return {
    screen,
    activeElement: wasmState?.playerElement || 'fire' as Element,
    health: wasmState?.playerHealth || 100,
    currentRealm: wasmState?.currentRealm || 'fire' as Realm,
    enemies: wasmState?.enemies || [],
    collectibles: wasmState?.collectibles || [],
    stats,
    damageFlash,
    levelUpFlash,
    notification,
    startGame,
    backToMenu,
    wasmState,
  };
}
