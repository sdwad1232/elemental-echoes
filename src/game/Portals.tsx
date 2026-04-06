import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Realm, ELEMENTS, REALM_CONFIGS, REALM_BASE_ELEMENT, ALL_REALMS } from './types';

// 8 portals: cardinals + diagonals
const PORTAL_POSITIONS: Record<Realm, [number, number, number]> = {
  fire: [15, 1.5, 0],
  water: [-15, 1.5, 0],
  earth: [0, 1.5, 15],
  air: [0, 1.5, -15],
  shadow: [11, 1.5, 11],
  lightning: [-11, 1.5, -11],
  ice: [-11, 1.5, 11],
  crystal: [11, 1.5, -11],
};

// Visual configs for extended realms
const REALM_PORTAL_COLORS: Record<Realm, { color: string; glow: string }> = {
  fire: { color: '#e8541a', glow: '#ff8533' },
  water: { color: '#0ea5c9', glow: '#38bdf8' },
  earth: { color: '#22915a', glow: '#4ade80' },
  air: { color: '#94a8be', glow: '#bfcfdf' },
  shadow: { color: '#6b00b3', glow: '#9b30ff' },
  lightning: { color: '#cccc00', glow: '#ffff44' },
  ice: { color: '#44aadd', glow: '#88ddff' },
  crystal: { color: '#cc22cc', glow: '#ff66ff' },
};

function Portal({ realm, position, isCurrent }: {
  realm: Realm;
  position: [number, number, number];
  isCurrent: boolean;
}) {
  const ringRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const colors = REALM_PORTAL_COLORS[realm];
  const config = REALM_CONFIGS[realm];

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
          color={colors.color}
          emissive={colors.glow}
          emissiveIntensity={isCurrent ? 0.3 : 1.5}
          transparent
          opacity={isCurrent ? 0.3 : 0.9}
        />
      </mesh>
      <mesh ref={innerRef}>
        <circleGeometry args={[1, 32]} />
        <meshStandardMaterial
          color={colors.glow}
          emissive={colors.glow}
          emissiveIntensity={isCurrent ? 0.2 : 2}
          transparent
          opacity={isCurrent ? 0.1 : 0.4}
          side={THREE.DoubleSide}
        />
      </mesh>
      {!isCurrent && (
        <pointLight color={colors.glow} intensity={3} distance={8} />
      )}
    </group>
  );
}

export function Portals({ currentRealm }: { currentRealm: Realm }) {
  return (
    <group>
      {ALL_REALMS.map(realm => (
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

export { PORTAL_POSITIONS };
