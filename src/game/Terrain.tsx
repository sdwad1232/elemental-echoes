import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';
import { Realm, REALM_CONFIGS } from './types';

interface TerrainProps {
  currentRealm: Realm;
}

const noise2D = createNoise2D();

function sampleHeight(x: number, z: number, currentRealm: Realm): number {
  // Large hills
  let h = noise2D(x * 0.04, z * 0.04) * 3.0;
  // Medium detail
  h += noise2D(x * 0.15, z * 0.15) * 0.8;
  // Fine detail
  h += noise2D(x * 0.5, z * 0.5) * 0.2;

  // Realm-specific modifiers
  if (currentRealm === 'ice') h *= 0.5;
  if (currentRealm === 'crystal') h = Math.abs(h) * 1.3;
  if (currentRealm === 'shadow') h *= 0.25;
  if (currentRealm === 'lightning') h += Math.sin(x * 0.8) * 0.6;

  return h;
}

function terrainColor(h: number, maxH: number): THREE.Color {
  const t = (h - (-maxH)) / (2 * maxH); // normalize 0..1
  const soil = new THREE.Color('#3d2b1f');
  const grass = new THREE.Color('#7a8c4e');
  const rock = new THREE.Color('#9e9e9e');
  if (t < 0.45) return soil.clone().lerp(grass, t / 0.45);
  return grass.clone().lerp(rock, (t - 0.45) / 0.55);
}

export function Terrain({ currentRealm }: TerrainProps) {
  const { geometry, normalTex } = useMemo(() => {
    const seg = 200; // keep <=256
    const size = 80;
    const geo = new THREE.PlaneGeometry(size, size, seg, seg);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    let maxH = 1;

    // First pass: set heights
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getY(i);
      const h = sampleHeight(x, z, currentRealm);
      pos.setZ(i, h);
      if (Math.abs(h) > maxH) maxH = Math.abs(h);
    }

    // Second pass: vertex colors
    for (let i = 0; i < pos.count; i++) {
      const h = pos.getZ(i);
      const c = terrainColor(h, maxH);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    // Generate a simple normal map from noise
    const nSize = 128;
    const data = new Uint8Array(nSize * nSize * 4);
    for (let y = 0; y < nSize; y++) {
      for (let x = 0; x < nSize; x++) {
        const idx = (y * nSize + x) * 4;
        const scale = 0.3;
        const nx = (noise2D((x + 1) * scale, y * scale) - noise2D((x - 1) * scale, y * scale)) * 0.5;
        const ny = (noise2D(x * scale, (y + 1) * scale) - noise2D(x * scale, (y - 1) * scale)) * 0.5;
        data[idx] = Math.floor((nx * 0.5 + 0.5) * 255);
        data[idx + 1] = Math.floor((ny * 0.5 + 0.5) * 255);
        data[idx + 2] = 255;
        data[idx + 3] = 255;
      }
    }
    const nTex = new THREE.DataTexture(data, nSize, nSize, THREE.RGBAFormat);
    nTex.wrapS = nTex.wrapT = THREE.RepeatWrapping;
    nTex.repeat.set(8, 8);
    nTex.needsUpdate = true;

    return { geometry: geo, normalTex: nTex };
  }, [currentRealm]);

  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <meshStandardMaterial
        vertexColors
        roughness={0.9}
        metalness={0.0}
        normalMap={normalTex}
        normalScale={new THREE.Vector2(0.6, 0.6)}
      />
    </mesh>
  );
}

export function FloatingIslands({ currentRealm }: { currentRealm: Realm }) {
  const groupRef = useRef<THREE.Group>(null);
  const config = REALM_CONFIGS[currentRealm];

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.015;
  });

  const islands = useMemo(() => {
    const base = [
      [8, 4, 5], [-6, 5, -8], [10, 6, -4], [-9, 3, 6],
      [3, 7, -10], [-4, 8, 3], [12, 5, 8], [-11, 6, -3],
    ];
    return base.map(([x, y, z]) => [x, y * config.gravity, z]);
  }, [config.gravity]);

  return (
    <group ref={groupRef}>
      {islands.map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]} castShadow>
          <dodecahedronGeometry args={[0.5 + (i * 0.15), 0]} />
          <meshStandardMaterial color={config.groundColor} roughness={0.7} emissive={config.ambientColor} emissiveIntensity={0.2} />
        </mesh>
      ))}
    </group>
  );
}

export function RealmDecorations({ currentRealm }: { currentRealm: Realm }) {
  const structures = useMemo(() => {
    const items: Array<{ pos: [number, number, number]; scale: number; seed: number }> = [];
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const dist = 7 + ((i * 7919) % 100) / 100 * 8;
      items.push({
        pos: [Math.cos(angle) * dist, 0, Math.sin(angle) * dist],
        scale: 0.5 + ((i * 3571) % 100) / 100 * 1.5,
        seed: i,
      });
    }
    return items;
  }, []);

  const config = REALM_CONFIGS[currentRealm];

  return (
    <group>
      {structures.map((s, i) => (
        <group key={i} position={s.pos}>
          {currentRealm === 'fire' && (
            <mesh position={[0, s.scale / 2, 0]} castShadow>
              <coneGeometry args={[0.3, s.scale, 6]} />
              <meshStandardMaterial color="#4a1a0a" emissive="#ff4400" emissiveIntensity={0.15} roughness={0.8} />
            </mesh>
          )}
          {currentRealm === 'water' && (
            <mesh position={[0, s.scale * 0.3, 0]} castShadow>
              <cylinderGeometry args={[0.15, 0.4, s.scale * 0.6, 6]} />
              <meshStandardMaterial color="#1a4a6a" emissive="#0088ff" emissiveIntensity={0.2} transparent opacity={0.7} roughness={0.2} />
            </mesh>
          )}
          {currentRealm === 'earth' && (
            <mesh position={[0, s.scale * 0.4, 0]} castShadow>
              <cylinderGeometry args={[0.1, 0.15, s.scale * 0.8, 5]} />
              <meshStandardMaterial color="#2a4a1a" roughness={0.95} />
            </mesh>
          )}
          {currentRealm === 'air' && (
            <mesh position={[0, s.scale, 0]}>
              <sphereGeometry args={[0.2 + s.scale * 0.1, 8, 8]} />
              <meshStandardMaterial color="#8899aa" emissive="#aabbcc" emissiveIntensity={0.3} transparent opacity={0.4} />
            </mesh>
          )}
          {currentRealm === 'shadow' && (
            <group>
              <mesh position={[0, s.scale * 0.5, 0]}>
                <octahedronGeometry args={[0.3 + s.scale * 0.2, 0]} />
                <meshStandardMaterial color="#1a0030" emissive="#8b00ff" emissiveIntensity={0.4} transparent opacity={0.6} />
              </mesh>
              <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.5, 0.8 + s.scale * 0.3, 6]} />
                <meshStandardMaterial color="#2a0050" emissive="#6600aa" emissiveIntensity={0.3} transparent opacity={0.3} side={THREE.DoubleSide} />
              </mesh>
            </group>
          )}
          {currentRealm === 'lightning' && (
            <group>
              <mesh position={[0, s.scale * 0.6, 0]} castShadow>
                <cylinderGeometry args={[0.05, 0.2, s.scale * 1.2, 4]} />
                <meshStandardMaterial color="#3a3a50" emissive="#ffff00" emissiveIntensity={0.5} metalness={0.8} roughness={0.2} />
              </mesh>
              <mesh position={[0, s.scale * 1.2, 0]}>
                <sphereGeometry args={[0.12, 8, 8]} />
                <meshStandardMaterial color="#ffff44" emissive="#ffff00" emissiveIntensity={1.0} />
              </mesh>
            </group>
          )}
          {currentRealm === 'ice' && (
            <group>
              <mesh position={[0, s.scale * 0.4, 0]} castShadow rotation={[0, s.seed * 0.8, 0.1]}>
                <boxGeometry args={[0.3, s.scale * 0.8, 0.2]} />
                <meshStandardMaterial color="#88ccee" emissive="#44aadd" emissiveIntensity={0.15} transparent opacity={0.7} metalness={0.3} roughness={0.1} />
              </mesh>
              <mesh position={[0.15, s.scale * 0.3, 0.1]} castShadow rotation={[0.2, s.seed, -0.15]}>
                <boxGeometry args={[0.15, s.scale * 0.5, 0.12]} />
                <meshStandardMaterial color="#aaddff" emissive="#88ddff" emissiveIntensity={0.1} transparent opacity={0.6} />
              </mesh>
            </group>
          )}
          {currentRealm === 'crystal' && (
            <group>
              <mesh position={[0, s.scale * 0.5, 0]} castShadow rotation={[0.1, s.seed * 1.2, 0.15]}>
                <coneGeometry args={[0.2, s.scale, 5]} />
                <meshStandardMaterial color="#cc22cc" emissive="#ff44ff" emissiveIntensity={0.4} metalness={0.9} roughness={0.05} />
              </mesh>
              <mesh position={[-0.2, s.scale * 0.3, 0.1]} castShadow rotation={[-0.2, s.seed * 0.7, -0.3]}>
                <coneGeometry args={[0.12, s.scale * 0.6, 5]} />
                <meshStandardMaterial color="#aa11aa" emissive="#dd33dd" emissiveIntensity={0.3} metalness={0.9} roughness={0.05} />
              </mesh>
            </group>
          )}
        </group>
      ))}
    </group>
  );
}
