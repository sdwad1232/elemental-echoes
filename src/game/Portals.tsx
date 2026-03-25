import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Realm, ELEMENTS } from './types';

const PORTAL_POSITIONS: Record<Realm, [number, number, number]> = {
  fire: [15, 1.5, 0],
  water: [-15, 1.5, 0],
  earth: [0, 1.5, 15],
  air: [0, 1.5, -15],
};

function Portal({ realm, position, isCurrent }: {
  realm: Realm;
  position: [number, number, number];
  isCurrent: boolean;
}) {
  const ringRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const config = ELEMENTS[realm];

  useFrame(() => {
    if (ringRef.current) {
      ringRef.current.rotation.z += 0.02;
      ringRef.current.rotation.x = Math.sin(Date.now() * 0.001) * 0.1;
    }
    if (innerRef.current) {
      innerRef.current.rotation.y += 0.05;
    }
  });

  return (
    <group position={position}>
      <mesh ref={ringRef}>
        <torusGeometry args={[1.2, 0.1, 16, 32]} />
        <meshStandardMaterial
          color={config.color}
          emissive={config.glowColor}
          emissiveIntensity={isCurrent ? 0.3 : 1.5}
          transparent
          opacity={isCurrent ? 0.3 : 0.9}
        />
      </mesh>
      <mesh ref={innerRef}>
        <circleGeometry args={[1, 32]} />
        <meshStandardMaterial
          color={config.glowColor}
          emissive={config.glowColor}
          emissiveIntensity={isCurrent ? 0.2 : 2}
          transparent
          opacity={isCurrent ? 0.1 : 0.4}
          side={THREE.DoubleSide}
        />
      </mesh>
      <pointLight color={config.glowColor} intensity={isCurrent ? 0.5 : 3} distance={8} />
      {!isCurrent && (
        <points>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={20}
              array={new Float32Array(
                Array.from({ length: 60 }, (_, i) => {
                  const a = (i / 20) * Math.PI * 2;
                  const idx = i % 3;
                  if (idx === 0) return Math.cos(a) * 1.5;
                  if (idx === 1) return (Math.random() - 0.5) * 2;
                  return Math.sin(a) * 1.5;
                })
              )}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial color={config.glowColor} size={0.1} transparent opacity={0.6} />
        </points>
      )}
    </group>
  );
}

export function Portals({ currentRealm }: { currentRealm: Realm }) {
  const realms: Realm[] = ['fire', 'water', 'earth', 'air'];

  return (
    <group>
      {realms.map(realm => (
        <Portal
          key={realm}
          realm={realm}
          position={PORTAL_POSITIONS[realm]}
          isCurrent={realm === currentRealm}
        />
      ))}
    </group>
  );
}
