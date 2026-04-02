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

/** Camera that follows the player with cinematic smoothing */
function CameraFollower({ wasmStateRef }: { wasmStateRef: React.MutableRefObject<WasmGameState | null> }) {
  const { camera } = useThree();
  const smoothPos = useRef(new THREE.Vector3(0, 8, 12));
  const smoothLookAt = useRef(new THREE.Vector3(0, 1, 0));
  const prevPlayerPos = useRef(new THREE.Vector3(0, 0, 0));
  const velocityDir = useRef(new THREE.Vector3(0, 0, 1));

  useFrame((_, delta) => {
    const state = wasmStateRef.current;
    if (!state) return;

    const playerPos = new THREE.Vector3(state.playerX, state.playerY, state.playerZ);

    // Track movement direction for dynamic offset
    const movement = new THREE.Vector3(
      state.playerX - prevPlayerPos.current.x,
      0,
      state.playerZ - prevPlayerPos.current.z
    );
    if (movement.length() > 0.01) {
      velocityDir.current.lerp(movement.normalize(), 0.05);
    }
    prevPlayerPos.current.copy(playerPos);

    // Dynamic offset: camera pulls back slightly in movement direction
    const baseOffset = new THREE.Vector3(0, 8, 10);
    const moveBias = velocityDir.current.clone().multiplyScalar(-3);
    moveBias.y = 0;
    const desiredOffset = baseOffset.clone().add(moveBias);

    // Target camera position
    const targetPos = playerPos.clone().add(desiredOffset);

    // Smooth follow with variable speed (faster catch-up when far)
    const dist = smoothPos.current.distanceTo(targetPos);
    const lerpSpeed = THREE.MathUtils.clamp(0.03 + dist * 0.015, 0.03, 0.15);
    smoothPos.current.lerp(targetPos, lerpSpeed);
    camera.position.copy(smoothPos.current);

    // Smooth look-at target (slightly ahead of player)
    const lookAhead = velocityDir.current.clone().multiplyScalar(2);
    const targetLookAt = new THREE.Vector3(
      state.playerX + lookAhead.x,
      state.playerY + 1.5,
      state.playerZ + lookAhead.z
    );
    smoothLookAt.current.lerp(targetLookAt, 0.06);
    camera.lookAt(smoothLookAt.current);
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
