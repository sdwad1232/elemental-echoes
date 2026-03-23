import { useState, useCallback, useRef } from 'react';
import { Element, Realm, GameStats, EnemyData, CollectibleData, calcXpToNext, calcDamage } from './types';

export type GameScreen = 'menu' | 'playing' | 'gameover';

function spawnEnemies(realm: Realm, count: number): EnemyData[] {
  const enemies: EnemyData[] = [];
  const elements: Element[] = ['fire', 'water', 'earth', 'air'];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 5 + Math.random() * 12;
    const el = elements[Math.floor(Math.random() * 4)];
    enemies.push({
      id: `${realm}-enemy-${i}-${Date.now()}`,
      element: el,
      position: [Math.cos(angle) * dist, 0.6, Math.sin(angle) * dist],
      health: 30 + Math.floor(Math.random() * 20),
      maxHealth: 50,
      speed: 1.5 + Math.random() * 1.5,
      damage: 8 + Math.floor(Math.random() * 7),
      xpReward: 15 + Math.floor(Math.random() * 15),
      dead: false,
      attackCooldown: 1200,
      lastAttackTime: 0,
    });
    enemies[enemies.length - 1].maxHealth = enemies[enemies.length - 1].health;
  }
  return enemies;
}

function spawnCollectibles(realm: Realm, count: number): CollectibleData[] {
  const items: CollectibleData[] = [];
  const types: Array<'health' | 'xp' | 'element_shard'> = ['health', 'xp', 'element_shard'];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 3 + Math.random() * 14;
    items.push({
      id: `${realm}-collect-${i}-${Date.now()}`,
      type: types[Math.floor(Math.random() * 3)],
      element: realm,
      position: [Math.cos(angle) * dist, 0.8 + Math.sin(i) * 0.3, Math.sin(angle) * dist],
      collected: false,
    });
  }
  return items;
}

export function useGameState() {
  const [screen, setScreen] = useState<GameScreen>('menu');
  const [activeElement, setActiveElement] = useState<Element>('fire');
  const [health, setHealth] = useState(100);
  const [currentRealm, setCurrentRealm] = useState<Realm>('fire');
  const [enemies, setEnemies] = useState<EnemyData[]>([]);
  const [collectibles, setCollectibles] = useState<CollectibleData[]>([]);
  const [stats, setStats] = useState<GameStats>({
    kills: 0, xp: 0, level: 1, xpToNext: calcXpToNext(1),
    maxHealth: 100, attackPower: 20, realmsVisited: new Set(['fire']),
  });
  const [damageFlash, setDamageFlash] = useState(false);
  const [levelUpFlash, setLevelUpFlash] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = useCallback((msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2000);
  }, []);

  const startGame = useCallback(() => {
    setScreen('playing');
    setHealth(100);
    setCurrentRealm('fire');
    setActiveElement('fire');
    setEnemies(spawnEnemies('fire', 8));
    setCollectibles(spawnCollectibles('fire', 6));
    setStats({
      kills: 0, xp: 0, level: 1, xpToNext: calcXpToNext(1),
      maxHealth: 100, attackPower: 20, realmsVisited: new Set(['fire']),
    });
    showNotification('Welcome to the Ember Wastes');
  }, [showNotification]);

  const backToMenu = useCallback(() => {
    setScreen('menu');
    setHealth(100);
  }, []);

  const switchElement = useCallback((el: Element) => setActiveElement(el), []);

  const enterRealm = useCallback((realm: Realm) => {
    setCurrentRealm(realm);
    setEnemies(spawnEnemies(realm, 8 + stats.level * 2));
    setCollectibles(spawnCollectibles(realm, 6));
    setStats(prev => {
      const visited = new Set(prev.realmsVisited);
      visited.add(realm);
      return { ...prev, realmsVisited: visited };
    });
    const names = { fire: 'Ember Wastes', water: 'Tidal Depths', earth: 'Verdant Wilds', air: 'Sky Citadel' };
    showNotification(`Entered ${names[realm]}`);
  }, [stats.level, showNotification]);

  const gainXp = useCallback((amount: number) => {
    setStats(prev => {
      let newXp = prev.xp + amount;
      let newLevel = prev.level;
      let toNext = prev.xpToNext;
      let newMaxHp = prev.maxHealth;
      let newAtk = prev.attackPower;

      while (newXp >= toNext) {
        newXp -= toNext;
        newLevel++;
        toNext = calcXpToNext(newLevel);
        newMaxHp += 15;
        newAtk += 5;
        setLevelUpFlash(true);
        setTimeout(() => setLevelUpFlash(false), 1500);
        showNotification(`Level Up! Level ${newLevel}`);
      }

      return { ...prev, xp: newXp, level: newLevel, xpToNext: toNext, maxHealth: newMaxHp, attackPower: newAtk };
    });
  }, [showNotification]);

  const takeDamage = useCallback((amount: number) => {
    setHealth(prev => {
      const newHp = Math.max(0, prev - amount);
      if (newHp <= 0) {
        setTimeout(() => setScreen('gameover'), 500);
      }
      return newHp;
    });
    setDamageFlash(true);
    setTimeout(() => setDamageFlash(false), 300);
  }, []);

  const heal = useCallback((amount: number) => {
    setHealth(prev => Math.min(stats.maxHealth, prev + amount));
  }, [stats.maxHealth]);

  const attackEnemy = useCallback((enemyId: string) => {
    setEnemies(prev => prev.map(e => {
      if (e.id !== enemyId || e.dead) return e;
      const dmg = calcDamage(stats.attackPower, activeElement, e.element);
      const newHp = e.health - dmg;
      if (newHp <= 0) {
        gainXp(e.xpReward);
        setStats(s => ({ ...s, kills: s.kills + 1 }));
        return { ...e, health: 0, dead: true, deathTime: Date.now() };
      }
      return { ...e, health: newHp };
    }));
  }, [stats.attackPower, activeElement, gainXp]);

  const collectItem = useCallback((itemId: string) => {
    setCollectibles(prev => prev.map(c => {
      if (c.id !== itemId || c.collected) return c;
      if (c.type === 'health') heal(25);
      if (c.type === 'xp') gainXp(20);
      if (c.type === 'element_shard') gainXp(30);
      return { ...c, collected: true };
    }));
  }, [heal, gainXp]);

  return {
    screen, activeElement, health, currentRealm, enemies, collectibles, stats,
    damageFlash, levelUpFlash, notification,
    startGame, backToMenu, switchElement, enterRealm,
    takeDamage, attackEnemy, collectItem, setEnemies,
  };
}
