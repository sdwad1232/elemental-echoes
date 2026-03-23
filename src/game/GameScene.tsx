import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Environment } from '@react-three/drei';
import { Terrain, FloatingIslands } from './Terrain';
import { Player } from './Player';
import { Element, ELEMENTS } from './types';
import * as THREE from 'three';

interface GameSceneProps {
  activeElement: Element;
  onSwitchElement: (el: Element) => void;
}

const FOG_COLORS: Record<Element, string> = {
  fire: '#1a0a05',
  water: '#050a1a',
  earth: '#0a1a05',
  air: '#0a0f1a',
};

const AMB_COLORS: Record<Element, string> = {
  fire: '#4a2010',
  water: '#102030',
  earth: '#203010',
  air: '#202830',
};

export function GameScene({ activeElement, onSwitchElement }: GameSceneProps) {
  const elConfig = ELEMENTS[activeElement];

  return (
    <Canvas
      shadows
      camera={{ position: [0, 8, 12], fov: 55 }}
      style={{ width: '100vw', height: '100vh' }}
      onCreated={({ scene }) => {
        scene.fog = new THREE.FogExp2(FOG_COLORS[activeElement], 0.035);
      }}
    >
      <color attach="background" args={[FOG_COLORS[activeElement]]} />

      <ambientLight color={AMB_COLORS[activeElement]} intensity={0.4} />
      <directionalLight
        position={[10, 15, 5]}
        intensity={1.2}
        color={elConfig.glowColor}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />

      <Stars radius={50} depth={30} count={2000} factor={3} saturation={0.2} fade speed={0.5} />

      <Terrain activeElement={activeElement} />
      <FloatingIslands activeElement={activeElement} />
      <Player activeElement={activeElement} onSwitchElement={onSwitchElement} />

      <OrbitControls
        target={[0, 1, 0]}
        maxPolarAngle={Math.PI / 2.2}
        minDistance={5}
        maxDistance={20}
        enablePan={false}
      />
    </Canvas>
  );
}
