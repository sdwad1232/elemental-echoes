import { useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { EnemyData, ELEMENTS } from './types';

interface EnemiesProps {
  enemies: EnemyData[];
}

const _camPos = new THREE.Vector3();
const _enemyPos = new THREE.Vector3();

// LOD thresholds
const LOD_HIGH = 15;   // full detail within 15 units
const LOD_MED = 30;    // medium detail 15-30
const LOD_LOW = 50;    // low detail 30-50, culled beyond 50

function Enemy({ enemy }: { enemy: EnemyData }) {
  const meshRef = useRef<THREE.Group>(null);
  const torusRef = useRef<THREE.Mesh>(null);
  const config = ELEMENTS[enemy.element];
  const lodRef = useRef<'high' | 'med' | 'low' | 'cull'>('high');
  const [visible, setVisible] = useState(true);
  const frameSkip = useRef(0);

  useFrame(({ camera }, delta) => {
    if (!meshRef.current || enemy.dead) return;
    meshRef.current.position.set(enemy.position[0], enemy.position[1], enemy.position[2]);

    // Check LOD every 10 frames
    frameSkip.current++;
    if (frameSkip.current % 10 === 0) {
      _camPos.copy(camera.position);
      _enemyPos.set(enemy.position[0], enemy.position[1], enemy.position[2]);
      const dist = _camPos.distanceTo(_enemyPos);

      const newLod = dist > LOD_LOW ? 'cull' : dist > LOD_MED ? 'low' : dist > LOD_HIGH ? 'med' : 'high';
      if (newLod !== lodRef.current) {
        lodRef.current = newLod;
        setVisible(newLod !== 'cull');
      }
    }

    // Only animate torus for high LOD
    if (torusRef.current && lodRef.current === 'high') {
      torusRef.current.rotation.x += delta * 1.2;
      torusRef.current.rotation.y += delta * 0.8;
    }
  });

  if (enemy.dead) {
    const elapsed = Date.now() - (enemy.deathTime || Date.now());
    if (elapsed > 1500) return null;
    const fade = 1 - elapsed / 1500;
    return (
      <mesh position={enemy.position}>
        <sphereGeometry args={[0.5 + (1 - fade) * 2, 4, 4]} />
        <meshStandardMaterial color={config.glowColor} emissive={config.glowColor} emissiveIntensity={3 * fade} transparent opacity={fade * 0.5} />
      </mesh>
    );
  }

  if (!visible) return <group ref={meshRef} position={enemy.position} />;

  const lod = lodRef.current;
  const healthPercent = enemy.health / enemy.maxHealth;

  return (
    <group ref={meshRef} position={enemy.position}>
      {/* Main body - detail varies by LOD */}
      <mesh castShadow={lod === 'high'}>
        <octahedronGeometry args={[0.4, lod === 'high' ? 0 : 0]} />
        <meshStandardMaterial
          color={config.color}
          emissive={config.color}
          emissiveIntensity={lod === 'low' ? 0.3 : 0.6}
          roughness={0.4}
          metalness={0.5}
        />
      </mesh>

      {/* Torus ring - only for high/med LOD */}
      {lod !== 'low' && (
        <mesh ref={torusRef}>
          <torusGeometry args={[0.6, 0.05, lod === 'high' ? 6 : 3, lod === 'high' ? 12 : 6]} />
          <meshStandardMaterial color={config.glowColor} emissive={config.glowColor} emissiveIntensity={1} transparent opacity={0.6} />
        </mesh>
      )}

      {/* Health bar - only for high/med LOD */}
      {lod !== 'low' && (
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
      )}
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
