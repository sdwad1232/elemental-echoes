import { useRef, useMemo, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Sky } from 'three/examples/jsm/objects/Sky.js';

const DAY_CYCLE_SPEED = 0.015; // full cycle ~420s (~7 min)

function getSunElevation(t: number): number {
  // t in [0,1]: 0=dawn, 0.25=noon, 0.5=dusk, 0.75=midnight
  return Math.sin(t * Math.PI * 2) * 60 + 10; // range: -50 to 70
}

function getSkyParams(elevation: number) {
  const dayFactor = Math.max(0, Math.min(1, (elevation + 5) / 40)); // 0=night, 1=day
  return {
    turbidity: THREE.MathUtils.lerp(1, 8, dayFactor),
    rayleigh: THREE.MathUtils.lerp(0.1, 1.5, dayFactor),
    mieCoefficient: THREE.MathUtils.lerp(0.001, 0.005, dayFactor),
    mieDirectionalG: THREE.MathUtils.lerp(0.99, 0.7, dayFactor),
  };
}

function getFogColor(elevation: number): THREE.Color {
  const dayFactor = Math.max(0, Math.min(1, (elevation + 5) / 40));
  const day = new THREE.Color('#c9d8e8');
  const night = new THREE.Color('#0a0a1a');
  const dusk = new THREE.Color('#4a3050');
  if (dayFactor > 0.5) return day.clone().lerp(dusk, (1 - dayFactor) * 2);
  return night.clone().lerp(dusk, dayFactor * 2);
}

const _sunDir = new THREE.Vector3();

export function RealisticSky() {
  const { scene } = useThree();
  const skyRef = useRef<Sky | null>(null);
  const timeRef = useRef(0.15); // start at early morning

  useEffect(() => {
    const sky = new Sky();
    sky.scale.setScalar(450000);
    scene.add(sky);
    skyRef.current = sky;
    return () => {
      scene.remove(sky);
      sky.material.dispose();
      (sky.geometry as THREE.BufferGeometry).dispose();
      skyRef.current = null;
    };
  }, [scene]);

  useFrame((_, delta) => {
    timeRef.current = (timeRef.current + delta * DAY_CYCLE_SPEED) % 1;
    const sky = skyRef.current;
    if (!sky) return;

    const elevation = getSunElevation(timeRef.current);
    const phi = THREE.MathUtils.degToRad(90 - elevation);
    const theta = THREE.MathUtils.degToRad(180 + timeRef.current * 360 * 0.1);
    _sunDir.setFromSphericalCoords(1, phi, theta);

    const p = getSkyParams(elevation);
    const u = sky.material.uniforms;
    u['turbidity'].value = p.turbidity;
    u['rayleigh'].value = p.rayleigh;
    u['mieCoefficient'].value = p.mieCoefficient;
    u['mieDirectionalG'].value = p.mieDirectionalG;
    u['sunPosition'].value.copy(_sunDir);

    if (scene.fog instanceof THREE.FogExp2) {
      scene.fog.color.copy(getFogColor(elevation));
    }
  });

  return null;
}

const _lightDir = new THREE.Vector3();

export function SunLight() {
  const lightRef = useRef<THREE.DirectionalLight>(null);
  const timeRef = useRef(0.15);

  const dayColor = useMemo(() => new THREE.Color('#fff5e0'), []);
  const duskColor = useMemo(() => new THREE.Color('#ff7b3a'), []);
  const nightColor = useMemo(() => new THREE.Color('#1a1a3a'), []);

  useFrame((_, delta) => {
    timeRef.current = (timeRef.current + delta * DAY_CYCLE_SPEED) % 1;
    const light = lightRef.current;
    if (!light) return;

    const elevation = getSunElevation(timeRef.current);
    const phi = THREE.MathUtils.degToRad(90 - elevation);
    const theta = THREE.MathUtils.degToRad(180 + timeRef.current * 360 * 0.1);
    _lightDir.setFromSphericalCoords(20, phi, theta);
    light.position.copy(_lightDir);

    const dayFactor = Math.max(0, Math.min(1, (elevation + 5) / 40));
    if (dayFactor > 0.5) {
      light.color.copy(dayColor).lerp(duskColor, (1 - dayFactor) * 2);
    } else {
      light.color.copy(nightColor).lerp(duskColor, dayFactor * 2);
    }
    light.intensity = THREE.MathUtils.lerp(0.1, 2.5, dayFactor);
  });

  return (
    <directionalLight
      ref={lightRef}
      color="#fff5e0"
      intensity={2.5}
      castShadow
      shadow-mapSize={[1024, 1024]}
      shadow-camera-near={0.5}
      shadow-camera-far={80}
      shadow-camera-left={-30}
      shadow-camera-right={30}
      shadow-camera-top={30}
      shadow-camera-bottom={-30}
    />
  );
}
