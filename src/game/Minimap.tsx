import { useMemo } from 'react';
import { Realm, Element, ELEMENTS, REALM_CONFIGS, ALL_REALMS, EnemyData } from './types';
import { PORTAL_POSITIONS } from './Portals';

interface MinimapProps {
  playerX: number;
  playerZ: number;
  currentRealm: Realm;
  activeElement: Element;
  enemies: EnemyData[];
}

const MAP_SIZE = 140; // px
const WORLD_RANGE = 20; // game units visible radius
const DOT = 3;

function worldToMap(wx: number, wz: number, px: number, pz: number): [number, number] | null {
  const rx = wx - px;
  const rz = wz - pz;
  const mx = (rx / WORLD_RANGE) * (MAP_SIZE / 2) + MAP_SIZE / 2;
  const my = (rz / WORLD_RANGE) * (MAP_SIZE / 2) + MAP_SIZE / 2;
  if (mx < -4 || mx > MAP_SIZE + 4 || my < -4 || my > MAP_SIZE + 4) return null;
  return [mx, my];
}

const PORTAL_ICONS: Record<Realm, string> = {
  fire: '🔥', water: '💧', earth: '🌿', air: '💨',
  shadow: '🌑', lightning: '⚡', ice: '❄️', crystal: '💎',
};

export function Minimap({ playerX, playerZ, currentRealm, activeElement, enemies }: MinimapProps) {
  const realmConfig = REALM_CONFIGS[currentRealm];
  const elConfig = ELEMENTS[activeElement];

  const portalDots = useMemo(() => {
    return ALL_REALMS.filter(r => r !== currentRealm).map(realm => {
      const pos = PORTAL_POSITIONS[realm];
      return { realm, x: pos[0], z: pos[2] };
    });
  }, [currentRealm]);

  const aliveEnemies = enemies.filter(e => !e.dead);

  return (
    <div
      className="pointer-events-auto"
      style={{
        width: MAP_SIZE,
        height: MAP_SIZE,
        borderRadius: '50%',
        border: `2px solid ${elConfig.color}60`,
        backgroundColor: `${realmConfig.groundColor}cc`,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: `0 0 12px ${realmConfig.fogColor}, inset 0 0 20px ${realmConfig.fogColor}`,
      }}
    >
      {/* Grid lines */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `
          linear-gradient(${elConfig.color}08 1px, transparent 1px),
          linear-gradient(90deg, ${elConfig.color}08 1px, transparent 1px)
        `,
        backgroundSize: `${MAP_SIZE / 4}px ${MAP_SIZE / 4}px`,
        backgroundPosition: `${MAP_SIZE / 2}px ${MAP_SIZE / 2}px`,
      }} />

      {/* Range circle */}
      <div style={{
        position: 'absolute',
        left: MAP_SIZE / 2 - MAP_SIZE * 0.35,
        top: MAP_SIZE / 2 - MAP_SIZE * 0.35,
        width: MAP_SIZE * 0.7,
        height: MAP_SIZE * 0.7,
        borderRadius: '50%',
        border: `1px solid ${elConfig.color}15`,
      }} />

      {/* Enemies */}
      {aliveEnemies.map(enemy => {
        const mapped = worldToMap(enemy.position[0], enemy.position[2], playerX, playerZ);
        if (!mapped) return null;
        const eColor = ELEMENTS[enemy.element]?.color || '#ff0000';
        return (
          <div
            key={enemy.id}
            style={{
              position: 'absolute',
              left: mapped[0] - DOT / 2,
              top: mapped[1] - DOT / 2,
              width: DOT + 1,
              height: DOT + 1,
              borderRadius: '50%',
              backgroundColor: eColor,
              boxShadow: `0 0 4px ${eColor}`,
              opacity: 0.9,
            }}
          />
        );
      })}

      {/* Portals */}
      {portalDots.map(portal => {
        const mapped = worldToMap(portal.x, portal.z, playerX, playerZ);
        if (!mapped) return null;
        return (
          <div
            key={portal.realm}
            style={{
              position: 'absolute',
              left: mapped[0] - 6,
              top: mapped[1] - 6,
              width: 12,
              height: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 8,
              lineHeight: 1,
              filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.5))',
            }}
          >
            {PORTAL_ICONS[portal.realm]}
          </div>
        );
      })}

      {/* Player (center) */}
      <div style={{
        position: 'absolute',
        left: MAP_SIZE / 2 - 3,
        top: MAP_SIZE / 2 - 3,
        width: 6,
        height: 6,
        borderRadius: '50%',
        backgroundColor: elConfig.glowColor,
        border: '1px solid white',
        boxShadow: `0 0 8px ${elConfig.glowColor}`,
        zIndex: 10,
      }} />

      {/* Cardinal labels */}
      <span style={{ position: 'absolute', top: 2, left: '50%', transform: 'translateX(-50%)', fontSize: 7, color: '#ffffff40' }}>N</span>
      <span style={{ position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)', fontSize: 7, color: '#ffffff40' }}>S</span>
      <span style={{ position: 'absolute', left: 4, top: '50%', transform: 'translateY(-50%)', fontSize: 7, color: '#ffffff40' }}>W</span>
      <span style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', fontSize: 7, color: '#ffffff40' }}>E</span>
    </div>
  );
}
