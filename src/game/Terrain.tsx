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
      let height = Math.sin(x * 0.3) * Math.cos(z * 0.3) * 0.8 +
        Math.sin(x * 0.7 + 1) * 0.3 +
        Math.cos(z * 0.5 + 2) * 0.4;
      // Realm-specific terrain variation
      if (currentRealm === 'ice') height *= 0.4; // flatter icy terrain
      if (currentRealm === 'crystal') height = Math.abs(height) * 1.5; // spiky crystals
      if (currentRealm === 'shadow') height *= 0.2; // nearly flat void
      if (currentRealm === 'lightning') height += Math.sin(x * 2) * 0.3; // jagged peaks
      pos.setZ(i, height);
    }
    geo.computeVertexNormals();
    return geo;
  }, [currentRealm]);

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

  const islands = useMemo(() => {
    const base = [
      [8, 4, 5], [-6, 5, -8], [10, 6, -4], [-9, 3, 6],
      [3, 7, -10], [-4, 8, 3], [12, 5, 8], [-11, 6, -3],
    ];
    return base.map(([x, y, z]) => [x, y * config.gravity, z]);
  }, [config.gravity]);

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

export function RealmDecorations({ currentRealm }: { currentRealm: Realm }) {
  const structures = useMemo(() => {
    const items: Array<{ pos: [number, number, number]; scale: number; seed: number }> = [];
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const dist = 7 + ((i * 7919) % 100) / 100 * 8;
      items.push({
        pos: [Math.cos(angle) * dist, 0, Math.sin(angle) * dist],
        scale: 0.5 + ((i * 3571) % 100) / 100 * 1.5,
        seed: i,
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
          {currentRealm === 'shadow' && (
            <group>
              <mesh position={[0, s.scale * 0.5, 0]}>
                <octahedronGeometry args={[0.3 + s.scale * 0.2, 0]} />
                <meshStandardMaterial color="#1a0030" emissive="#8b00ff" emissiveIntensity={0.4} transparent opacity={0.6} />
              </mesh>
              <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.5, 0.8 + s.scale * 0.3, 6]} />
                <meshStandardMaterial color="#2a0050" emissive="#6600aa" emissiveIntensity={0.3} transparent opacity={0.3} side={THREE.DoubleSide} />
              </mesh>
            </group>
          )}
          {currentRealm === 'lightning' && (
            <group>
              <mesh position={[0, s.scale * 0.6, 0]} castShadow>
                <cylinderGeometry args={[0.05, 0.2, s.scale * 1.2, 4]} />
                <meshStandardMaterial color="#3a3a50" emissive="#ffff00" emissiveIntensity={0.5} metalness={0.8} roughness={0.2} />
              </mesh>
              <mesh position={[0, s.scale * 1.2, 0]}>
                <sphereGeometry args={[0.12, 8, 8]} />
                <meshStandardMaterial color="#ffff44" emissive="#ffff00" emissiveIntensity={1.0} />
              </mesh>
            </group>
          )}
          {currentRealm === 'ice' && (
            <group>
              <mesh position={[0, s.scale * 0.4, 0]} castShadow rotation={[0, s.seed * 0.8, 0.1]}>
                <boxGeometry args={[0.3, s.scale * 0.8, 0.2]} />
                <meshStandardMaterial color="#88ccee" emissive="#44aadd" emissiveIntensity={0.15} transparent opacity={0.7} metalness={0.3} roughness={0.1} />
              </mesh>
              <mesh position={[0.15, s.scale * 0.3, 0.1]} castShadow rotation={[0.2, s.seed, -0.15]}>
                <boxGeometry args={[0.15, s.scale * 0.5, 0.12]} />
                <meshStandardMaterial color="#aaddff" emissive="#88ddff" emissiveIntensity={0.1} transparent opacity={0.6} />
              </mesh>
            </group>
          )}
          {currentRealm === 'crystal' && (
            <group>
              <mesh position={[0, s.scale * 0.5, 0]} castShadow rotation={[0.1, s.seed * 1.2, 0.15]}>
                <coneGeometry args={[0.2, s.scale, 5]} />
                <meshStandardMaterial color="#cc22cc" emissive="#ff44ff" emissiveIntensity={0.4} metalness={0.9} roughness={0.05} />
              </mesh>
              <mesh position={[-0.2, s.scale * 0.3, 0.1]} castShadow rotation={[-0.2, s.seed * 0.7, -0.3]}>
                <coneGeometry args={[0.12, s.scale * 0.6, 5]} />
                <meshStandardMaterial color="#aa11aa" emissive="#dd33dd" emissiveIntensity={0.3} metalness={0.9} roughness={0.05} />
              </mesh>
            </group>
          )}
        </group>
      ))}
    </group>
  );
}
