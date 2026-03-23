import { useRef, useCallback } from 'react';
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
  onAttackEnemy: (id: string) => void;
  onCollectItem: (id: string) => void;
  onEnemyAttackPlayer: (damage: number) => void;
  onEnterRealm: (realm: Realm) => void;
  setEnemies: React.Dispatch<React.SetStateAction<EnemyData[]>>;
}

export function GameScene({
  activeElement, currentRealm, enemies, collectibles,
  onSwitchElement, onAttackEnemy, onCollectItem, onEnemyAttackPlayer, onEnterRealm, setEnemies,
}: GameSceneProps) {
  const playerRef = useRef<THREE.Group>(null);
  const realmConfig = REALM_CONFIGS[currentRealm];
  const elConfig = ELEMENTS[activeElement];

  const handleAttack = useCallback(() => {
    if (!playerRef.current) return;
    const playerPos = playerRef.current.position;
    // Find enemies within attack range
    enemies.forEach(e => {
      if (e.dead) return;
      const dist = new THREE.Vector3(...e.position).distanceTo(playerPos);
      // Also check enemies that moved (approximate)
      if (dist < 3) {
        onAttackEnemy(e.id);
      }
    });
  }, [enemies, onAttackEnemy]);

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
      <Portals currentRealm={currentRealm} playerRef={playerRef} onEnterRealm={onEnterRealm} />
      <Enemies enemies={enemies} playerRef={playerRef} onEnemyAttackPlayer={onEnemyAttackPlayer} setEnemies={setEnemies} />
      <Collectibles collectibles={collectibles} playerRef={playerRef} onCollect={onCollectItem} />
      <Player activeElement={activeElement} onSwitchElement={onSwitchElement} onAttack={handleAttack} playerRef={playerRef} />

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
