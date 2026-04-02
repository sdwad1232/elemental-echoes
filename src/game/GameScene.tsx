import { useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
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
  tickGame: (delta: number) => void;
}

/** Camera that follows the player */
function CameraFollower({ wasmStateRef }: { wasmStateRef: React.MutableRefObject<WasmGameState | null> }) {
  const { camera } = useThree();
  const offset = useRef(new THREE.Vector3(0, 10, 14));

  useFrame(() => {
    const state = wasmStateRef.current;
    if (!state) return;

    const targetX = state.playerX + offset.current.x;
    const targetY = state.playerY + offset.current.y;
    const targetZ = state.playerZ + offset.current.z;

    // Smooth follow with lerp
    camera.position.x += (targetX - camera.position.x) * 0.08;
    camera.position.y += (targetY - camera.position.y) * 0.08;
    camera.position.z += (targetZ - camera.position.z) * 0.08;

    // Look at player
    camera.lookAt(state.playerX, state.playerY + 1, state.playerZ);
  });

  return null;
}

/** Inner component – runs game tick + renders */
function GameWorld({ wasmStateRef, activeElement, currentRealm, tickGame }: {
  wasmStateRef: React.MutableRefObject<WasmGameState | null>;
  activeElement: Element;
  currentRealm: Realm;
  tickGame: (delta: number) => void;
}) {
  const playerRef = useRef<THREE.Group>(null);

  // Single unified game loop: input → WASM tick → read state
  useFrame((_, delta) => {
    tickGame(Math.min(delta, 0.1));
  });

  const enemies = wasmStateRef.current?.enemies || [];
  const collectibles = wasmStateRef.current?.collectibles || [];

  return (
    <>
      <Terrain currentRealm={currentRealm} />
      <FloatingIslands currentRealm={currentRealm} />
      <RealmDecorations currentRealm={currentRealm} />
      <Portals currentRealm={currentRealm} />
      <Enemies enemies={enemies} />
      <Collectibles collectibles={collectibles} />
      <Player
        activeElement={activeElement}
        playerRef={playerRef}
        wasmStateRef={wasmStateRef}
      />
    </>
  );
}

export function GameScene({ activeElement, currentRealm, wasmStateRef, tickGame }: GameSceneProps) {
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

      <GameWorld
        wasmStateRef={wasmStateRef}
        activeElement={activeElement}
        currentRealm={currentRealm}
        tickGame={tickGame}
      />

      <CameraFollower wasmStateRef={wasmStateRef} />
    </Canvas>
  );
}
