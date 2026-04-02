import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Element, ELEMENTS } from './types';
import { WasmGameState } from './wasmBridge';

interface PlayerProps {
  activeElement: Element;
  playerRef: React.MutableRefObject<THREE.Group | null>;
  wasmStateRef: React.MutableRefObject<WasmGameState | null>;
}

export function Player({ activeElement, playerRef, wasmStateRef }: PlayerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const prevPosRef = useRef({ x: 0, z: 0 });

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    if (playerRef) playerRef.current = groupRef.current;

    const state = wasmStateRef.current;
    if (!state) return;

    const { playerX, playerY, playerZ } = state;

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

  const particlePositions = useMemo(() => {
    const arr = new Float32Array(15 * 3);
    for (let i = 0; i < 15; i++) {
      const angle = (i / 15) * Math.PI * 2;
      const r = 1.2 + Math.sin(i * 0.5) * 0.3;
      arr[i * 3] = Math.cos(angle) * r;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 1.5;
      arr[i * 3 + 2] = Math.sin(angle) * r;
    }
    return arr;
  }, []);

  return (
    <group ref={groupRef}>
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
          <bufferAttribute attach="attributes-position" count={15} array={particlePositions} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial color={glow} size={0.08} transparent opacity={0.7} />
      </points>
      <pointLight color={glow} intensity={1.5} distance={5} />
    </group>
  );
}
