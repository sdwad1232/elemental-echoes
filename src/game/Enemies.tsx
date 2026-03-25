import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { EnemyData, ELEMENTS } from './types';

interface EnemiesProps {
  enemies: EnemyData[];
}

function Enemy({ enemy }: { enemy: EnemyData }) {
  const meshRef = useRef<THREE.Group>(null);
  const config = ELEMENTS[enemy.element];

  useFrame(() => {
    if (!meshRef.current || enemy.dead) return;
    // Position is driven by WASM, just sync
    meshRef.current.position.set(enemy.position[0], enemy.position[1], enemy.position[2]);
  });

  if (enemy.dead) {
    const elapsed = Date.now() - (enemy.deathTime || Date.now());
    if (elapsed > 1500) return null;
    const fade = 1 - elapsed / 1500;
    return (
      <mesh position={enemy.position}>
        <sphereGeometry args={[0.5 + (1 - fade) * 2, 8, 8]} />
        <meshStandardMaterial color={config.glowColor} emissive={config.glowColor} emissiveIntensity={3 * fade} transparent opacity={fade * 0.5} />
      </mesh>
    );
  }

  const healthPercent = enemy.health / enemy.maxHealth;

  return (
    <group ref={meshRef} position={enemy.position}>
      <mesh castShadow>
        <octahedronGeometry args={[0.4, 0]} />
        <meshStandardMaterial color={config.color} emissive={config.color} emissiveIntensity={0.4} roughness={0.4} metalness={0.5} />
      </mesh>
      <mesh rotation={[Math.PI / 4, Date.now() * 0.002, 0]}>
        <torusGeometry args={[0.6, 0.05, 8, 16]} />
        <meshStandardMaterial color={config.glowColor} emissive={config.glowColor} emissiveIntensity={1} transparent opacity={0.6} />
      </mesh>
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
      <mesh position={[0, -0.5, 0]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color={config.glowColor} emissive={config.glowColor} emissiveIntensity={2} />
      </mesh>
      <pointLight color={config.glowColor} intensity={0.8} distance={4} />
    </group>
  );
}

export function Enemies({ enemies }: EnemiesProps) {
  return (
    <group>
      {enemies.map(enemy => (
        <Enemy key={enemy.id} enemy={enemy} />
      ))}
    </group>
  );
}
