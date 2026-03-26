import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { Terrain, FloatingIslands, RealmDecorations } from './Terrain';
import { Player } from './Player';
import { Enemies } from './Enemies';
import { Collectibles } from './Collectibles';
import { Portals } from './Portals';
import { Element, Realm, EnemyData, CollectibleData, ELEMENTS, REALM_CONFIGS } from './types';
import { WasmGameState } from './wasmBridge';
import * as THREE from 'three';

interface GameSceneProps {
  activeElement: Element;
  currentRealm: Realm;
  wasmStateRef: React.MutableRefObject<WasmGameState | null>;
}

/** Inner component that reads wasmStateRef every frame via useFrame */
function GameWorld({ wasmStateRef, activeElement, currentRealm }: {
  wasmStateRef: React.MutableRefObject<WasmGameState | null>;
  activeElement: Element;
  currentRealm: Realm;
}) {
  const playerRef = useRef<THREE.Group>(null);
  const enemiesRef = useRef<EnemyData[]>([]);
  const collectiblesRef = useRef<CollectibleData[]>([]);
  const playerPosRef = useRef({ x: 0, y: 0.8, z: 0 });

  useFrame(() => {
    const state = wasmStateRef.current;
    if (!state) return;
    playerPosRef.current = { x: state.playerX, y: state.playerY, z: state.playerZ };
    enemiesRef.current = state.enemies;
    collectiblesRef.current = state.collectibles;
  });

  return (
    <>
      <Terrain currentRealm={currentRealm} />
      <FloatingIslands currentRealm={currentRealm} />
      <RealmDecorations currentRealm={currentRealm} />
      <Portals currentRealm={currentRealm} />
      <EnemiesRenderer wasmStateRef={wasmStateRef} />
      <CollectiblesRenderer wasmStateRef={wasmStateRef} />
      <Player
        activeElement={activeElement}
        playerRef={playerRef}
        wasmStateRef={wasmStateRef}
      />
    </>
  );
}

/** Reads enemy data from ref each frame */
function EnemiesRenderer({ wasmStateRef }: { wasmStateRef: React.MutableRefObject<WasmGameState | null> }) {
  const meshRefs = useRef<Map<string, THREE.Group>>(new Map());
  const dataRef = useRef<EnemyData[]>([]);

  useFrame(() => {
    const state = wasmStateRef.current;
    if (!state) return;
    dataRef.current = state.enemies;
    // Update mesh positions directly
    for (const enemy of state.enemies) {
      const mesh = meshRefs.current.get(enemy.id);
      if (mesh && !enemy.dead) {
        mesh.position.set(enemy.position[0], enemy.position[1], enemy.position[2]);
      }
    }
  });

  // We still need React to create the meshes, so use the Enemies component
  // but pass enemies from wasmStateRef
  const enemies = wasmStateRef.current?.enemies || [];
  return <Enemies enemies={enemies} />;
}

/** Reads collectible data from ref each frame */
function CollectiblesRenderer({ wasmStateRef }: { wasmStateRef: React.MutableRefObject<WasmGameState | null> }) {
  const collectibles = wasmStateRef.current?.collectibles || [];
  return <Collectibles collectibles={collectibles} />;
}

export function GameScene({ activeElement, currentRealm, wasmStateRef }: GameSceneProps) {
  const realmConfig = REALM_CONFIGS[currentRealm];
  const elConfig = ELEMENTS[activeElement];

  return (
    <Canvas
      shadows
      camera={{ position: [0, 10, 14], fov: 55 }}
      style={{ width: '100vw', height: '100vh' }}
      onCreated={({ scene }) => {
        scene.fog = new THREE.FogExp2(realmConfig.fogColor, 0.028);
      }}
    >
      <color attach="background" args={[realmConfig.fogColor]} />
      <ambientLight color={realmConfig.ambientColor} intensity={0.5} />
      <directionalLight
        position={[10, 15, 5]}
        intensity={1.2}
        color={elConfig.glowColor}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <hemisphereLight color={elConfig.glowColor} groundColor={realmConfig.groundColor} intensity={0.3} />

      <Stars radius={60} depth={40} count={3000} factor={3} saturation={0.2} fade speed={0.3} />

      <GameWorld wasmStateRef={wasmStateRef} activeElement={activeElement} currentRealm={currentRealm} />

      <OrbitControls
        target={[0, 1, 0]}
        maxPolarAngle={Math.PI / 2.2}
        minDistance={5}
        maxDistance={25}
        enablePan={false}
        enableRotate={true}
      />
    </Canvas>
  );
}
