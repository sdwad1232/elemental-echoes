import { useRef, MutableRefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Terrain, FloatingIslands, RealmDecorations } from './Terrain';
import { RealisticSky, SunLight } from './RealisticSky';
import { Player } from './Player';
import { Enemies } from './Enemies';
import { Collectibles } from './Collectibles';
import { Portals } from './Portals';
import { CombatEffects, AttackEffect } from './CombatEffects';
import { CombatState } from './useGameState';
import { Element, Realm, ELEMENTS, REALM_CONFIGS } from './types';
import { WasmGameState } from './wasmBridge';
import * as THREE from 'three';

interface GameSceneProps {
  activeElement: Element;
  currentRealm: Realm;
  wasmStateRef: React.MutableRefObject<WasmGameState | null>;
  tickGame: (delta: number) => void;
  combatRef: MutableRefObject<CombatState>;
}

const _targetPos = new THREE.Vector3();
const _targetLookAt = new THREE.Vector3();

function CameraFollower({ wasmStateRef }: { wasmStateRef: React.MutableRefObject<WasmGameState | null> }) {
  const { camera } = useThree();
  const smoothPos = useRef(new THREE.Vector3(0, 8, 12));
  const smoothLookAt = useRef(new THREE.Vector3(0, 1, 0));
  const prevX = useRef(0);
  const prevZ = useRef(0);
  const velX = useRef(0);
  const velZ = useRef(1);

  useFrame(() => {
    const state = wasmStateRef.current;
    if (!state) return;

    const mx = state.playerX - prevX.current;
    const mz = state.playerZ - prevZ.current;
    const mLen = Math.sqrt(mx * mx + mz * mz);
    if (mLen > 0.01) {
      velX.current += (mx / mLen - velX.current) * 0.05;
      velZ.current += (mz / mLen - velZ.current) * 0.05;
    }
    prevX.current = state.playerX;
    prevZ.current = state.playerZ;

    _targetPos.set(
      state.playerX - velX.current * 3,
      state.playerY + 8,
      state.playerZ - velZ.current * 3 + 10
    );

    const dist = smoothPos.current.distanceTo(_targetPos);
    const lerpSpeed = Math.min(0.03 + dist * 0.015, 0.15);
    smoothPos.current.lerp(_targetPos, lerpSpeed);
    camera.position.copy(smoothPos.current);

    _targetLookAt.set(
      state.playerX + velX.current * 2,
      state.playerY + 1.5,
      state.playerZ + velZ.current * 2
    );
    smoothLookAt.current.lerp(_targetLookAt, 0.06);
    camera.lookAt(smoothLookAt.current);
  });

  return null;
}

function GameWorld({ wasmStateRef, activeElement, currentRealm, tickGame, combatRef }: {
  wasmStateRef: React.MutableRefObject<WasmGameState | null>;
  activeElement: Element;
  currentRealm: Realm;
  tickGame: (delta: number) => void;
  combatRef: MutableRefObject<CombatState>;
}) {
  const playerRef = useRef<THREE.Group>(null);

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
      <CombatEffects effects={combatRef.current.effects} />
      <Player
        activeElement={activeElement}
        playerRef={playerRef}
        wasmStateRef={wasmStateRef}
      />
    </>
  );
}

export function GameScene({ activeElement, currentRealm, wasmStateRef, tickGame, combatRef }: GameSceneProps) {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 10, 14], fov: 55 }}
      style={{ width: '100vw', height: '100vh' }}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
      onCreated={({ scene, gl }) => {
        scene.fog = new THREE.FogExp2('#c9d8e8', 0.008);
        gl.shadowMap.type = THREE.BasicShadowMap;
      }}
    >
      {/* Sky shader replaces solid background color */}
      <RealisticSky />
      <SunLight />
      <ambientLight color="#b0c4de" intensity={0.4} />

      <GameWorld
        wasmStateRef={wasmStateRef}
        activeElement={activeElement}
        currentRealm={currentRealm}
        tickGame={tickGame}
        combatRef={combatRef}
      />

      <CameraFollower wasmStateRef={wasmStateRef} />
    </Canvas>
  );
}
