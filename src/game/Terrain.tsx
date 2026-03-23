import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Element } from './types';

interface TerrainProps {
  activeElement: Element;
}

const ELEMENT_GROUND: Record<Element, string> = {
  fire: '#3d1a0a',
  water: '#0a2a3d',
  earth: '#1a3d0a',
  air: '#1a2a3d',
};

export function Terrain({ activeElement }: TerrainProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(40, 40, 64, 64);
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
    <mesh ref={meshRef} geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <meshStandardMaterial color={ELEMENT_GROUND[activeElement]} roughness={0.9} metalness={0.1} />
    </mesh>
  );
}

export function FloatingIslands({ activeElement }: { activeElement: Element }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.02;
    }
  });

  const colors: Record<Element, string> = {
    fire: '#8b3a1a',
    water: '#1a5a7a',
    earth: '#3a6a2a',
    air: '#5a6a7a',
  };

  return (
    <group ref={groupRef}>
      {[
        [8, 4, 5], [-6, 5, -8], [10, 6, -4], [-9, 3, 6],
        [3, 7, -10], [-4, 8, 3],
      ].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]} castShadow>
          <dodecahedronGeometry args={[0.6 + Math.random() * 0.8, 0]} />
          <meshStandardMaterial color={colors[activeElement]} roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}
