import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Realm, REALM_CONFIGS } from './types';

interface TerrainProps {
  currentRealm: Realm;
}

export function Terrain({ currentRealm }: TerrainProps) {
  const config = REALM_CONFIGS[currentRealm];

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(50, 50, 40, 40);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getY(i);
      const height = Math.sin(x * 0.3) * Math.cos(z * 0.3) * 0.8 +
        Math.sin(x * 0.7 + 1) * 0.3 +
        Math.cos(z * 0.5 + 2) * 0.4;
      pos.setZ(i, height);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <meshStandardMaterial color={config.groundColor} roughness={0.9} metalness={0.1} />
    </mesh>
  );
}

export function FloatingIslands({ currentRealm }: { currentRealm: Realm }) {
  const groupRef = useRef<THREE.Group>(null);
  const config = REALM_CONFIGS[currentRealm];

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.015;
  });

  const islands = useMemo(() => [
    [8, 4, 5], [-6, 5, -8], [10, 6, -4], [-9, 3, 6],
    [3, 7, -10], [-4, 8, 3], [12, 5, 8], [-11, 6, -3],
  ], []);

  return (
    <group ref={groupRef}>
      {islands.map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]} castShadow>
          <dodecahedronGeometry args={[0.5 + (i * 0.15), 0]} />
          <meshStandardMaterial color={config.groundColor} roughness={0.7} emissive={config.ambientColor} emissiveIntensity={0.2} />
        </mesh>
      ))}
    </group>
  );
}

// Decorative structures per realm
export function RealmDecorations({ currentRealm }: { currentRealm: Realm }) {
  const structures = useMemo(() => {
    const items: Array<{ pos: [number, number, number]; scale: number }> = [];
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const dist = 7 + Math.random() * 8;
      items.push({
        pos: [Math.cos(angle) * dist, 0, Math.sin(angle) * dist],
        scale: 0.5 + Math.random() * 1.5,
      });
    }
    return items;
  }, []);

  const config = REALM_CONFIGS[currentRealm];

  return (
    <group>
      {structures.map((s, i) => (
        <group key={i} position={s.pos}>
          {currentRealm === 'fire' && (
            <mesh position={[0, s.scale / 2, 0]} castShadow>
              <coneGeometry args={[0.3, s.scale, 6]} />
              <meshStandardMaterial color="#4a1a0a" emissive="#ff4400" emissiveIntensity={0.15} roughness={0.8} />
            </mesh>
          )}
          {currentRealm === 'water' && (
            <mesh position={[0, s.scale * 0.3, 0]} castShadow>
              <cylinderGeometry args={[0.15, 0.4, s.scale * 0.6, 6]} />
              <meshStandardMaterial color="#1a4a6a" emissive="#0088ff" emissiveIntensity={0.2} transparent opacity={0.7} roughness={0.2} />
            </mesh>
          )}
          {currentRealm === 'earth' && (
            <mesh position={[0, s.scale * 0.4, 0]} castShadow>
              <cylinderGeometry args={[0.1, 0.15, s.scale * 0.8, 5]} />
              <meshStandardMaterial color="#2a4a1a" roughness={0.95} />
            </mesh>
          )}
          {currentRealm === 'air' && (
            <mesh position={[0, s.scale, 0]}>
              <sphereGeometry args={[0.2 + s.scale * 0.1, 8, 8]} />
              <meshStandardMaterial color="#8899aa" emissive="#aabbcc" emissiveIntensity={0.3} transparent opacity={0.4} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}
