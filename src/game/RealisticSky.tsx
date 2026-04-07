import { useRef, useMemo, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Sky } from 'three/examples/jsm/objects/Sky.js';

export function RealisticSky() {
  const { scene } = useThree();
  const skyRef = useRef<any>(null);

  const sunPosition = useMemo(() => {
    const phi = THREE.MathUtils.degToRad(90 - 15); // elevation 15°
    const theta = THREE.MathUtils.degToRad(180);    // azimuth 180°
    return new THREE.Vector3().setFromSphericalCoords(1, phi, theta);
  }, []);

  useEffect(() => {
    const sky = new Sky();
    sky.scale.setScalar(450000);
    const uniforms = sky.material.uniforms;
    uniforms['turbidity'].value = 8;
    uniforms['rayleigh'].value = 1.5;
    uniforms['mieCoefficient'].value = 0.005;
    uniforms['mieDirectionalG'].value = 0.7;
    uniforms['sunPosition'].value.copy(sunPosition);
    scene.add(sky);
    skyRef.current = sky;

    return () => {
      scene.remove(sky);
      sky.material.dispose();
      (sky.geometry as THREE.BufferGeometry).dispose();
    };
  }, [scene, sunPosition]);

  return null;
}

export function SunLight() {
  const sunPosition = useMemo(() => {
    const phi = THREE.MathUtils.degToRad(90 - 15);
    const theta = THREE.MathUtils.degToRad(180);
    const dir = new THREE.Vector3().setFromSphericalCoords(1, phi, theta);
    return dir.multiplyScalar(20);
  }, []);

  return (
    <directionalLight
      position={[sunPosition.x, sunPosition.y, sunPosition.z]}
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
