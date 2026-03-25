import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Element, ELEMENTS } from './types';

interface PlayerProps {
  activeElement: Element;
  onSwitchElement: (el: Element) => void;
  onAttack: () => void;
  onMove: (dx: number, dz: number, delta: number) => void;
  playerRef: React.MutableRefObject<THREE.Group | null>;
  playerX: number;
  playerY: number;
  playerZ: number;
}

const keys: Record<string, boolean> = {};

export function Player({ activeElement, onSwitchElement, onAttack, onMove, playerRef, playerX, playerY, playerZ }: PlayerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const [attacking, setAttacking] = useState(false);
  const attackCooldown = useRef(false);
  const lastDirRef = useRef({ x: 0, z: 0 });

  useEffect(() => {
    if (groupRef.current) playerRef.current = groupRef.current;
  });

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = true;
      if (['1', '2', '3', '4'].includes(e.key)) {
        const els: Element[] = ['fire', 'water', 'earth', 'air'];
        onSwitchElement(els[parseInt(e.key) - 1]);
      }
      if (e.key === ' ' && !attackCooldown.current) {
        e.preventDefault();
        attackCooldown.current = true;
        setAttacking(true);
        onAttack();
        setTimeout(() => setAttacking(false), 300);
        setTimeout(() => { attackCooldown.current = false; }, 500);
      }
    };
    const onUp = (e: KeyboardEvent) => { keys[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); };
  }, [onSwitchElement, onAttack]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    let dx = 0, dz = 0;
    if (keys['w'] || keys['arrowup']) dz -= 1;
    if (keys['s'] || keys['arrowdown']) dz += 1;
    if (keys['a'] || keys['arrowleft']) dx -= 1;
    if (keys['d'] || keys['arrowright']) dx += 1;

    if (dx !== 0 || dz !== 0) {
      lastDirRef.current = { x: dx, z: dz };
      onMove(dx, dz, delta);
    }

    // Sync position from WASM
    groupRef.current.position.set(playerX, playerY + Math.sin(Date.now() * 0.003) * 0.1, playerZ);

    if (lastDirRef.current.x !== 0 || lastDirRef.current.z !== 0) {
      groupRef.current.rotation.y = Math.atan2(lastDirRef.current.x, lastDirRef.current.z);
    }

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
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={attacking ? 1.5 : 0.3} roughness={0.3} metalness={0.6} />
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
      {attacking && (
        <mesh position={[0, 0.3, -1.5]} scale={[2, 2, 3]}>
          <sphereGeometry args={[0.5, 8, 8]} />
          <meshStandardMaterial color={glow} emissive={glow} emissiveIntensity={3} transparent opacity={0.6} />
        </mesh>
      )}
      <pointLight color={glow} intensity={2} distance={8} />
    </group>
  );
}
