import { useState, useCallback, useEffect, useRef } from 'react';
import { Element, Realm, GameStats } from './types';
import {
  initializeWasm, isWasmReady, wasmInitGame, wasmSwitchElement,
  wasmMovePlayer, wasmPlayerAttack, wasmTick, wasmGetState, wasmDrainEvents,
  WasmGameState, GameEvent,
} from './wasmBridge';

export type GameScreen = 'menu' | 'playing' | 'gameover' | 'loading';

export function useGameState() {
  const [screen, setScreen] = useState<GameScreen>('menu');
  const [damageFlash, setDamageFlash] = useState(false);
  const [levelUpFlash, setLevelUpFlash] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Cached state from WASM (updated each frame)
  const [wasmState, setWasmState] = useState<WasmGameState | null>(null);

  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const screenRef = useRef<GameScreen>('menu');
  screenRef.current = screen;

  // Process events from WASM
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

  // Game loop
  const gameLoop = useCallback((time: number) => {
    if (screenRef.current !== 'playing') return;

    const delta = lastTimeRef.current ? Math.min((time - lastTimeRef.current) / 1000, 0.1) : 0.016;
    lastTimeRef.current = time;

    // Tick WASM (handles AI, combat, pickups, portals)
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
    // Drain the welcome notification
    const events = wasmDrainEvents();
    processEvents(events);
    lastTimeRef.current = 0;
    animFrameRef.current = requestAnimationFrame(gameLoop);
  }, [gameLoop, processEvents]);

  const backToMenu = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    setScreen('menu');
  }, []);

  const switchElement = useCallback((el: Element) => {
    wasmSwitchElement(el);
  }, []);

  const attack = useCallback(() => {
    wasmPlayerAttack();
  }, []);

  const movePlayer = useCallback((dx: number, dz: number, delta: number) => {
    wasmMovePlayer(dx, dz, delta);
  }, []);

  // Stop loop when leaving playing screen
  useEffect(() => {
    if (screen !== 'playing') {
      cancelAnimationFrame(animFrameRef.current);
    }
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [screen]);

  // Build stats from WASM state
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
    switchElement,
    attack,
    movePlayer,
    wasmState,
  };
}
