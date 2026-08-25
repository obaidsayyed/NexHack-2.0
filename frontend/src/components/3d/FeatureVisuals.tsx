import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Shared material settings for the glossy look
const getGlossyMaterial = (color: string) => {
  return new THREE.MeshStandardMaterial({
    color: color,
    roughness: 0.1,
    metalness: 0.4,
    envMapIntensity: 1.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
  });
};

export const AnalyticsVisual = ({ isLight }: { isLight: boolean }) => {
  const groupRef = useRef<THREE.Group>(null);
  const bars = useRef<THREE.Mesh[]>([]);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.2;
      groupRef.current.position.y = Math.sin(state.clock.getElapsedTime()) * 0.2;
    }
    bars.current.forEach((bar, i) => {
      if (bar) {
        bar.scale.y = 1 + Math.sin(state.clock.getElapsedTime() * 2 + i) * 0.3;
      }
    });
  });

  const matPink = getGlossyMaterial('#F472B6');
  const matBlue = getGlossyMaterial('#38BDF8');

  return (
    <group ref={groupRef}>
      <ambientLight intensity={isLight ? 1.5 : 0.8} />
      <directionalLight position={[5, 10, 5]} intensity={isLight ? 2 : 1.5} />
      
      {/* 3 Bars */}
      <mesh ref={el => bars.current[0] = el!} position={[-1.2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.4, 0.4, 2, 32]} />
        <primitive object={matPink} attach="material" />
      </mesh>
      
      <mesh ref={el => bars.current[1] = el!} position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.4, 0.4, 3, 32]} />
        <primitive object={matBlue} attach="material" />
      </mesh>
      
      <mesh ref={el => bars.current[2] = el!} position={[1.2, -0.5, 0]} castShadow>
        <cylinderGeometry args={[0.4, 0.4, 1, 32]} />
        <primitive object={matPink} attach="material" />
      </mesh>
    </group>
  );
};

export const IntegrationVisual = ({ isLight }: { isLight: boolean }) => {
  const groupRef = useRef<THREE.Group>(null);
  const ring1 = useRef<THREE.Mesh>(null);
  const ring2 = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.1;
      groupRef.current.position.y = Math.sin(state.clock.getElapsedTime() + 1) * 0.2;
    }
    if (ring1.current && ring2.current) {
      ring1.current.rotation.x += delta * 0.5;
      ring1.current.rotation.y += delta * 0.8;
      
      ring2.current.rotation.x -= delta * 0.3;
      ring2.current.rotation.y -= delta * 0.6;
    }
  });

  const matPink = getGlossyMaterial('#F472B6');
  const matBlue = getGlossyMaterial('#38BDF8');

  return (
    <group ref={groupRef}>
      <ambientLight intensity={isLight ? 1.5 : 0.8} />
      <directionalLight position={[5, 10, 5]} intensity={isLight ? 2 : 1.5} />
      
      {/* Center Sphere */}
      <mesh>
        <sphereGeometry args={[1, 64, 64]} />
        <primitive object={matBlue} attach="material" />
      </mesh>
      
      {/* Orbiting Rings */}
      <mesh ref={ring1}>
        <torusGeometry args={[1.6, 0.08, 16, 100]} />
        <primitive object={matPink} attach="material" />
      </mesh>
      
      <mesh ref={ring2} rotation={[Math.PI/4, Math.PI/4, 0]}>
        <torusGeometry args={[2.2, 0.05, 16, 100]} />
        <primitive object={matBlue} attach="material" />
      </mesh>
    </group>
  );
};

export const AlertsVisual = ({ isLight }: { isLight: boolean }) => {
  const groupRef = useRef<THREE.Group>(null);
  const ripples = useRef<THREE.Mesh[]>([]);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(state.clock.getElapsedTime() + 2) * 0.2;
    }
    
    ripples.current.forEach((ripple, i) => {
      if (ripple) {
        // Expand and fade out
        let scale = ripple.scale.x + delta * 1.5;
        let opacity = 1 - (scale / 4);
        
        if (scale > 4) {
          scale = 1;
          opacity = 1;
        }
        
        ripple.scale.setScalar(scale);
        (ripple.material as THREE.MeshStandardMaterial).opacity = Math.max(0, opacity);
      }
    });
  });

  const matPinkSolid = getGlossyMaterial('#F472B6');
  
  // Custom transparent material for ripples
  const getRippleMat = () => new THREE.MeshStandardMaterial({
    color: '#F472B6',
    transparent: true,
    opacity: 0.8,
    roughness: 0.2,
    metalness: 0.1,
  });

  return (
    <group ref={groupRef}>
      <ambientLight intensity={isLight ? 1.5 : 0.8} />
      <directionalLight position={[5, 10, 5]} intensity={isLight ? 2 : 1.5} />
      
      {/* Core */}
      <mesh>
        <icosahedronGeometry args={[0.8, 2]} />
        <primitive object={matPinkSolid} attach="material" />
      </mesh>
      
      {/* Ripples */}
      <mesh ref={el => ripples.current[0] = el!} scale={1}>
        <torusGeometry args={[1, 0.03, 16, 64]} />
        <primitive object={getRippleMat()} attach="material" />
      </mesh>
      
      <mesh ref={el => ripples.current[1] = el!} scale={2.5}>
        <torusGeometry args={[1, 0.03, 16, 64]} />
        <primitive object={getRippleMat()} attach="material" />
      </mesh>
    </group>
  );
};
