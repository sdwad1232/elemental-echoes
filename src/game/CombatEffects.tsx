import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Element, ELEMENTS } from './types';

export interface AttackEffect {
  id: number;
  type: 'slash' | 'projectile' | 'aoe' | 'dash_trail';
  element: Element;
  position: [number, number, number];
  direction: [number, number, number];
  startTime: number;
  duration: number;
  combo: number;
}

interface CombatEffectsProps {
  effects: AttackEffect[];
}

const _pos = new THREE.Vector3();

function SlashEffect({ effect }: { effect: AttackEffect }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const config = ELEMENTS[effect.element];
  const startTime = useRef(effect.startTime);

  useFrame(() => {
    if (!meshRef.current) return;
    const elapsed = Date.now() - startTime.current;
    const t = elapsed / effect.duration;
    if (t > 1) {
      meshRef.current.visible = false;
      return;
    }
    const scale = 1 + t * (1 + effect.combo * 0.3);
    meshRef.current.scale.set(scale, scale, 0.1);
    meshRef.current.rotation.z += 0.3;
    (meshRef.current.material as THREE.MeshBasicMaterial).opacity = (1 - t) * 0.8;
  });

  return (
    <mesh ref={meshRef} position={effect.position} rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.3, 0.8 + effect.combo * 0.2, 6 + effect.combo * 2]} />
      <meshBasicMaterial
        color={config.glowColor}
        transparent
        opacity={0.8}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

function ProjectileEffect({ effect }: { effect: AttackEffect }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const config = ELEMENTS[effect.element];
  const startTime = useRef(effect.startTime);

  useFrame(() => {
    if (!meshRef.current) return;
    const elapsed = Date.now() - startTime.current;
    const t = elapsed / effect.duration;
    if (t > 1) {
      meshRef.current.visible = false;
      return;
    }
    // Move along direction
    const speed = 12;
    meshRef.current.position.set(
      effect.position[0] + effect.direction[0] * speed * t,
      effect.position[1] + 0.5,
      effect.position[2] + effect.direction[2] * speed * t,
    );
    meshRef.current.rotation.y += 0.2;
    meshRef.current.rotation.x += 0.15;
    const fade = 1 - t * t;
    (meshRef.current.material as THREE.MeshStandardMaterial).opacity = fade;
  });

  return (
    <mesh ref={meshRef} position={effect.position}>
      <icosahedronGeometry args={[0.2 + effect.combo * 0.05, 0]} />
      <meshStandardMaterial
        color={config.glowColor}
        emissive={config.glowColor}
        emissiveIntensity={3}
        transparent
        opacity={0.9}
        depthWrite={false}
      />
    </mesh>
  );
}

function AoeEffect({ effect }: { effect: AttackEffect }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const config = ELEMENTS[effect.element];
  const startTime = useRef(effect.startTime);

  useFrame(() => {
    if (!meshRef.current) return;
    const elapsed = Date.now() - startTime.current;
    const t = elapsed / effect.duration;
    if (t > 1) {
      meshRef.current.visible = false;
      return;
    }
    const radius = t * (4 + effect.combo);
    meshRef.current.scale.set(radius, radius, 1);
    (meshRef.current.material as THREE.MeshBasicMaterial).opacity = (1 - t) * 0.5;
  });

  return (
    <mesh ref={meshRef} position={[effect.position[0], 0.1, effect.position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.8, 1.0, 24]} />
      <meshBasicMaterial
        color={config.glowColor}
        transparent
        opacity={0.5}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

function DashTrailEffect({ effect }: { effect: AttackEffect }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const config = ELEMENTS[effect.element];
  const startTime = useRef(effect.startTime);

  useFrame(() => {
    if (!meshRef.current) return;
    const elapsed = Date.now() - startTime.current;
    const t = elapsed / effect.duration;
    if (t > 1) {
      meshRef.current.visible = false;
      return;
    }
    meshRef.current.scale.set(1, 1 - t * 0.5, 1);
    (meshRef.current.material as THREE.MeshBasicMaterial).opacity = (1 - t) * 0.4;
  });

  return (
    <mesh ref={meshRef} position={effect.position}>
      <capsuleGeometry args={[0.15, 0.4, 4, 8]} />
      <meshBasicMaterial
        color={config.glowColor}
        transparent
        opacity={0.4}
        depthWrite={false}
      />
    </mesh>
  );
}

export function CombatEffects({ effects }: CombatEffectsProps) {
  return (
    <group>
      {effects.map((effect) => {
        switch (effect.type) {
          case 'slash':
            return <SlashEffect key={effect.id} effect={effect} />;
          case 'projectile':
            return <ProjectileEffect key={effect.id} effect={effect} />;
          case 'aoe':
            return <AoeEffect key={effect.id} effect={effect} />;
          case 'dash_trail':
            return <DashTrailEffect key={effect.id} effect={effect} />;
          default:
            return null;
        }
      })}
    </group>
  );
}
