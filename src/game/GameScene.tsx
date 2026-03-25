import { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { Terrain, FloatingIslands, RealmDecorations } from './Terrain';
import { Player } from './Player';
import { Enemies } from './Enemies';
import { Collectibles } from './Collectibles';
import { Portals } from './Portals';
import { Element, Realm, EnemyData, CollectibleData, ELEMENTS, REALM_CONFIGS } from './types';
import * as THREE from 'three';

interface GameSceneProps {
  activeElement: Element;
  currentRealm: Realm;
  enemies: EnemyData[];
  collectibles: CollectibleData[];
  onSwitchElement: (el: Element) => void;
  onAttack: () => void;
  onMove: (dx: number, dz: number, delta: number) => void;
  playerX: number;
  playerY: number;
  playerZ: number;
}

export function GameScene({
  activeElement, currentRealm, enemies, collectibles,
  onSwitchElement, onAttack, onMove,
  playerX, playerY, playerZ,
}: GameSceneProps) {
  const playerRef = useRef<THREE.Group>(null);
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

      <Terrain currentRealm={currentRealm} />
      <FloatingIslands currentRealm={currentRealm} />
      <RealmDecorations currentRealm={currentRealm} />
      <Portals currentRealm={currentRealm} />
      <Enemies enemies={enemies} />
      <Collectibles collectibles={collectibles} />
      <Player
        activeElement={activeElement}
        onSwitchElement={onSwitchElement}
        onAttack={onAttack}
        onMove={onMove}
        playerRef={playerRef}
        playerX={playerX}
        playerY={playerY}
        playerZ={playerZ}
      />

      <OrbitControls
        target={[0, 1, 0]}
        maxPolarAngle={Math.PI / 2.2}
        minDistance={5}
        maxDistance={25}
        enablePan={false}
      />
    </Canvas>
  );
}
