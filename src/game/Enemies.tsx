import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { EnemyData, ELEMENTS } from './types';

interface EnemiesProps {
  enemies: EnemyData[];
  playerRef: React.MutableRefObject<THREE.Group | null>;
  onEnemyAttackPlayer: (damage: number) => void;
  setEnemies: React.Dispatch<React.SetStateAction<EnemyData[]>>;
}

function Enemy({ enemy, playerRef, onEnemyAttackPlayer, updateEnemy }: {
  enemy: EnemyData;
  playerRef: React.MutableRefObject<THREE.Group | null>;
  onEnemyAttackPlayer: (damage: number) => void;
  updateEnemy: (id: string, updates: Partial<EnemyData>) => void;
}) {
  const meshRef = useRef<THREE.Group>(null);
  const config = ELEMENTS[enemy.element];

  useFrame((_, delta) => {
    if (!meshRef.current || enemy.dead || !playerRef.current) return;

    const playerPos = playerRef.current.position;
    const enemyPos = meshRef.current.position;
    const dir = new THREE.Vector3().subVectors(playerPos, enemyPos);
    const dist = dir.length();

    // Chase player if within range
    if (dist < 12 && dist > 1.5) {
      dir.normalize().multiplyScalar(enemy.speed * delta);
      dir.y = 0;
      meshRef.current.position.add(dir);
      meshRef.current.lookAt(playerPos.x, meshRef.current.position.y, playerPos.z);
    }

    // Attack player if close
    if (dist < 2) {
      const now = Date.now();
      if (now - enemy.lastAttackTime > enemy.attackCooldown) {
        onEnemyAttackPlayer(enemy.damage);
        updateEnemy(enemy.id, { lastAttackTime: now });
      }
    }

    // Bobbing
    meshRef.current.position.y = 0.6 + Math.sin(Date.now() * 0.004 + enemy.position[0]) * 0.15;
  });

  if (enemy.dead) {
    // Death particles - show briefly then remove
    const elapsed = Date.now() - (enemy.deathTime || Date.now());
    if (elapsed > 1500) return null;
    const fade = 1 - elapsed / 1500;
    return (
      <mesh position={enemy.position}>
        <sphereGeometry args={[0.5 + (1 - fade) * 2, 8, 8]} />
        <meshStandardMaterial
          color={config.glowColor}
          emissive={config.glowColor}
          emissiveIntensity={3 * fade}
          transparent
          opacity={fade * 0.5}
        />
      </mesh>
    );
  }

  const healthPercent = enemy.health / enemy.maxHealth;

  return (
    <group ref={meshRef} position={enemy.position}>
      {/* Body - spiky for enemies */}
      <mesh castShadow>
        <octahedronGeometry args={[0.4, 0]} />
        <meshStandardMaterial
          color={config.color}
          emissive={config.color}
          emissiveIntensity={0.4}
          roughness={0.4}
          metalness={0.5}
        />
      </mesh>
      {/* Rotating ring */}
      <mesh rotation={[Math.PI / 4, Date.now() * 0.002, 0]}>
        <torusGeometry args={[0.6, 0.05, 8, 16]} />
        <meshStandardMaterial color={config.glowColor} emissive={config.glowColor} emissiveIntensity={1} transparent opacity={0.6} />
      </mesh>
      {/* Health bar */}
      <group position={[0, 1, 0]}>
        <mesh>
          <planeGeometry args={[0.8, 0.08]} />
          <meshBasicMaterial color="#333" transparent opacity={0.8} />
        </mesh>
        <mesh position={[(healthPercent - 1) * 0.4, 0, 0.01]}>
          <planeGeometry args={[0.8 * healthPercent, 0.08]} />
          <meshBasicMaterial color={healthPercent > 0.5 ? '#4ade80' : healthPercent > 0.25 ? '#fbbf24' : '#ef4444'} />
        </mesh>
      </group>
      {/* Element indicator */}
      <mesh position={[0, -0.5, 0]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color={config.glowColor} emissive={config.glowColor} emissiveIntensity={2} />
      </mesh>
      <pointLight color={config.glowColor} intensity={0.8} distance={4} />
    </group>
  );
}

export function Enemies({ enemies, playerRef, onEnemyAttackPlayer, setEnemies }: EnemiesProps) {
  const updateEnemy = (id: string, updates: Partial<EnemyData>) => {
    setEnemies(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  return (
    <group>
      {enemies.map(enemy => (
        <Enemy
          key={enemy.id}
          enemy={enemy}
          playerRef={playerRef}
          onEnemyAttackPlayer={onEnemyAttackPlayer}
          updateEnemy={updateEnemy}
        />
      ))}
    </group>
  );
}
