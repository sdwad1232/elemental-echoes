import { useRef, useEffect, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Element, ELEMENTS } from './types';

interface PlayerProps {
  activeElement: Element;
  onSwitchElement: (el: Element) => void;
  onAttack: () => void;
  playerRef: React.MutableRefObject<THREE.Group | null>;
}

const SPEED = 5;
const keys: Record<string, boolean> = {};

export function Player({ activeElement, onSwitchElement, onAttack, playerRef }: PlayerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const [attacking, setAttacking] = useState(false);
  const attackCooldown = useRef(false);

  // Sync ref
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
    const dir = new THREE.Vector3();
    if (keys['w'] || keys['arrowup']) dir.z -= 1;
    if (keys['s'] || keys['arrowdown']) dir.z += 1;
    if (keys['a'] || keys['arrowleft']) dir.x -= 1;
    if (keys['d'] || keys['arrowright']) dir.x += 1;

    if (dir.length() > 0) {
      dir.normalize().multiplyScalar(SPEED * delta);
      groupRef.current.position.add(dir);
      groupRef.current.rotation.y = Math.atan2(dir.x, dir.z);
      groupRef.current.position.x = THREE.MathUtils.clamp(groupRef.current.position.x, -18, 18);
      groupRef.current.position.z = THREE.MathUtils.clamp(groupRef.current.position.z, -18, 18);
    }

    groupRef.current.position.y = 0.8 + Math.sin(Date.now() * 0.003) * 0.1;

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
    <group ref={groupRef} position={[0, 0.8, 0]}>
      {/* Body */}
      <mesh castShadow>
        <capsuleGeometry args={[0.25, 0.5, 8, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={attacking ? 1.5 : 0.3} roughness={0.3} metalness={0.6} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.65, 0]} castShadow>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color={color} emissive={glow} emissiveIntensity={0.5} roughness={0.2} metalness={0.7} />
      </mesh>
      {/* Element orb */}
      <mesh position={[0, 1.1, 0]}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshStandardMaterial color={glow} emissive={glow} emissiveIntensity={2} transparent opacity={0.8} />
      </mesh>
      {/* Particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={30} array={particlePositions} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial color={glow} size={0.08} transparent opacity={0.7} />
      </points>
      {/* Attack effect */}
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
