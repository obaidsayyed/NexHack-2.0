import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';

interface PulseLoaderProps {
  theme?: 'light' | 'dark';
}

export const PulseLoader: React.FC<PulseLoaderProps> = ({ theme = 'dark' }) => {
  const isLight = theme === 'light';
  
  // Reuse the existing heart asset (will hit cache)
  const { scene } = useGLTF('/models/realistic_human_heart/scene.gltf');
  const clonedScene = useMemo(() => scene.clone(), [scene]);
  
  const heartGroup = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const traceRef = useRef<THREE.Mesh>(null);
  
  const scaleObj = useRef({ s: 1 });
  const beatTl = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    // Setup heart materials
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (mat) {
          mat.roughness = 0.35;
          mat.metalness = 0.1;
          mat.envMapIntensity = 1.0;
          mat.emissive = new THREE.Color('#ff3333');
          mat.emissiveIntensity = 0;
        }
      }
    });

    // Elevated pulse (120 bpm = 0.5s cycle)
    const cycleDuration = 0.5;
    
    beatTl.current = gsap.timeline({ repeat: -1 });
    gsap.set(scaleObj.current, { s: 1 });

    beatTl.current
      // "Lub"
      .to(scaleObj.current, { s: 1.15, duration: 0.08, ease: 'power1.out' }, 0)
      // "Dub"
      .to(scaleObj.current, { s: 1.03, duration: 0.05, ease: 'power1.inOut' }, 0.08)
      .to(scaleObj.current, { s: 1.1, duration: 0.06, ease: 'power1.out' }, 0.13)
      // Rest
      .to(scaleObj.current, { s: 1, duration: cycleDuration - 0.19, ease: 'power2.out' }, 0.19);

    return () => {
      beatTl.current?.kill();
    };
  }, [clonedScene]);

  useFrame((state, delta) => {
    // Apply GSAP scale to the heart
    if (heartGroup.current) {
      heartGroup.current.scale.setScalar(scaleObj.current.s * 0.7); // 0.7 is the base scale (small 60-100px equivalent)
      // Slow rotation for ambient feel
      heartGroup.current.rotation.y += delta * 0.2;
    }
    
    // Rotate the glowing ring
    if (ringRef.current) {
      ringRef.current.rotation.z -= delta * 3.0; // Fast spin
      ringRef.current.rotation.x = Math.PI / 2.2; // Tilted
    }

    if (traceRef.current) {
       // Slow counter-rotation for contrast
       traceRef.current.rotation.z += delta * 0.5;
       traceRef.current.rotation.x = Math.PI / 1.9;
    }
  });

  // Provide a 2D fallback via HTML in case 3D takes a moment
  // We'll use Html from drei if we wanted, but since this is inside a Canvas, 
  // the simple meshes will load almost instantly.

  return (
    <group>
      <ambientLight intensity={isLight ? 1.5 : 0.8} />
      <directionalLight position={[5, 10, 5]} intensity={isLight ? 1.5 : 1} color={isLight ? '#FFF5EE' : '#E8918B'} />
      
      {/* 3D Heart */}
      <group ref={heartGroup} rotation={[0, -Math.PI / 8, 0]}>
        <primitive object={clonedScene} />
      </group>
      
      {/* Glowing Ring / Progress Indicator (Sky Blue Arc) */}
      <mesh ref={ringRef}>
        <torusGeometry args={[1.5, 0.04, 16, 64, Math.PI * 1.3]} />
        <meshBasicMaterial 
          color="#38BDF8" 
          transparent 
          opacity={0.9} 
          side={THREE.DoubleSide} 
        />
      </mesh>
      
      {/* Subtle secondary trace (Pink full ring) */}
      <mesh ref={traceRef}>
        <torusGeometry args={[1.7, 0.015, 16, 64]} />
        <meshBasicMaterial 
          color="#F472B6" 
          transparent 
          opacity={0.4} 
        />
      </mesh>
    </group>
  );
};
