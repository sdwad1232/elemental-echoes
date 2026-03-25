import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Element, ELEMENTS } from './types';

interface PlayerProps {
  activeElement: Element;
  playerRef: React.MutableRefObject<THREE.Group | null>;
  playerX: number;
  playerY: number;
  playerZ: number;
  isAttacking?: boolean;
}

export function Player({ activeElement, playerRef, playerX, playerY, playerZ }: PlayerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const prevPosRef = useRef({ x: 0, z: 0 });

  useEffect(() => {
    if (groupRef.current) playerRef.current = groupRef.current;
  });

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Compute rotation from movement direction
    const dx = playerX - prevPosRef.current.x;
    const dz = playerZ - prevPosRef.current.z;
    if (Math.abs(dx) > 0.001 || Math.abs(dz) > 0.001) {
      groupRef.current.rotation.y = Math.atan2(dx, dz);
    }
    prevPosRef.current = { x: playerX, z: playerZ };

    // Sync position from WASM
    groupRef.current.position.set(playerX, playerY + Math.sin(Date.now() * 0.003) * 0.1, playerZ);

    if (particlesRef.current) {
      particlesRef.current.rotation.y += delta * 2;
    }
  });

  const color = ELEMENTS[activeElement].color;
  const glow = ELEMENTS[activeElement].glowColor;

  const particlePositions = new Float32Array(30 * 3);
  for (let i = 0; i < 30; i++) {
    const angle = (i / 30) * Math.PI * 2;
    const r = 1.2 + Math.sin(i * 0.5) * 0.3;
    particlePositions[i * 3] = Math.cos(angle) * r;
    particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 1.5;
    particlePositions[i * 3 + 2] = Math.sin(angle) * r;
  }

  return (
    <group ref={groupRef} position={[playerX, playerY, playerZ]}>
      <mesh castShadow>
        <capsuleGeometry args={[0.25, 0.5, 8, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} roughness={0.3} metalness={0.6} />
      </mesh>
      <mesh position={[0, 0.65, 0]} castShadow>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color={color} emissive={glow} emissiveIntensity={0.5} roughness={0.2} metalness={0.7} />
      </mesh>
      <mesh position={[0, 1.1, 0]}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshStandardMaterial color={glow} emissive={glow} emissiveIntensity={2} transparent opacity={0.8} />
      </mesh>
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={30} array={particlePositions} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial color={glow} size={0.08} transparent opacity={0.7} />
      </points>
      <pointLight color={glow} intensity={2} distance={8} />
    </group>
  );
}
