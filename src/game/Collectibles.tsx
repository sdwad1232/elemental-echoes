import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CollectibleData, ELEMENTS, Element } from './types';

interface CollectiblesProps {
  collectibles: CollectibleData[];
  playerRef: React.MutableRefObject<THREE.Group | null>;
  onCollect: (id: string) => void;
}

function Collectible({ item, playerRef, onCollect }: {
  item: CollectibleData;
  playerRef: React.MutableRefObject<THREE.Group | null>;
  onCollect: (id: string) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  const colors = {
    health: '#4ade80',
    xp: '#facc15',
    element_shard: item.element ? ELEMENTS[item.element].glowColor : '#fff',
  };
  const color = colors[item.type];

  useFrame(() => {
    if (!meshRef.current || item.collected || !playerRef.current) return;

    // Spin
    meshRef.current.rotation.y += 0.03;
    meshRef.current.position.y = item.position[1] + Math.sin(Date.now() * 0.003 + item.position[0]) * 0.2;

    // Check pickup distance
    const dist = meshRef.current.position.distanceTo(playerRef.current.position);
    if (dist < 1.5) {
      onCollect(item.id);
    }
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
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={1.5}
        transparent
        opacity={0.85}
      />
      <pointLight color={color} intensity={0.5} distance={3} />
    </mesh>
  );
}

export function Collectibles({ collectibles, playerRef, onCollect }: CollectiblesProps) {
  return (
    <group>
      {collectibles.map(item => (
        <Collectible key={item.id} item={item} playerRef={playerRef} onCollect={onCollect} />
      ))}
    </group>
  );
}
