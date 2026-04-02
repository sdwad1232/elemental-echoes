import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CollectibleData, ELEMENTS } from './types';

interface CollectiblesProps {
  collectibles: CollectibleData[];
}

function Collectible({ item }: { item: CollectibleData }) {
  const meshRef = useRef<THREE.Mesh>(null);

  const colors = {
    health: '#4ade80',
    xp: '#facc15',
    element_shard: item.element ? ELEMENTS[item.element].glowColor : '#fff',
  };
  const color = colors[item.type];

  useFrame((_, delta) => {
    if (!meshRef.current || item.collected) return;
    meshRef.current.rotation.y += delta * 1.8;
    meshRef.current.position.y = item.position[1] + Math.sin(Date.now() * 0.003 + item.position[0]) * 0.2;
  });

  if (item.collected) return null;

  return (
    <mesh ref={meshRef} position={item.position}>
      {item.type === 'health' ? (
        <dodecahedronGeometry args={[0.2, 0]} />
      ) : item.type === 'xp' ? (
        <octahedronGeometry args={[0.18, 0]} />
      ) : (
        <icosahedronGeometry args={[0.22, 0]} />
      )}
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} transparent opacity={0.85} />
    </mesh>
  );
}

export function Collectibles({ collectibles }: CollectiblesProps) {
  return (
    <group>
      {collectibles.map(item => (
        <Collectible key={item.id} item={item} />
      ))}
    </group>
  );
}
