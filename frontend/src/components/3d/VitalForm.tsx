import React, { useRef, useEffect, useMemo, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF, ContactShadows, Environment } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { AmbientParticles } from './AmbientParticles';

interface VitalFormProps {
  scale?: number;
  theme?: 'light' | 'dark';
  interactionEnabled?: boolean;
  ambientDensity?: number;
}

export const VitalForm: React.FC<VitalFormProps> = ({
  scale = 1.0,
  theme = 'light',
  interactionEnabled = true,
  ambientDensity = 1.0,
}) => {
  // Load the realistic heart model
  const { scene } = useGLTF('/models/realistic_human_heart/scene.gltf');
  
  // Clone the scene so multiple instances can render independently
  const clonedScene = useMemo(() => scene.clone(), [scene]);
  
  const groupRef = useRef<THREE.Group>(null);
  const heartMesh = useRef<THREE.Mesh | null>(null);
  const { pointer, viewport } = useThree();
  const baseTime = useRef(0);
  
  // For interactions and animations
  const beatTl = useRef<gsap.core.Timeline | null>(null);
  const scaleObj = useRef({ s: 1 });
  const materialProxy = useRef({ emissiveIntensity: 0 });
  const [hovered, setHovered] = useState(false);
  
  // Setup materials on the cloned scene
  useEffect(() => {
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (mat) {
          // Adjust for soft organic look
          mat.roughness = 0.35;
          mat.metalness = 0.1;
          mat.envMapIntensity = 1.0;
          // Set a subtle red emissive color for the pulse glow
          mat.emissive = new THREE.Color('#ff3333');
          mat.emissiveIntensity = 0;
          
          if (!heartMesh.current) {
            heartMesh.current = mesh;
          }
        }
      }
    });

    // Center and scale the model
    clonedScene.scale.setScalar(scale * 1.5);
    clonedScene.position.set(0, 0, 0);
    clonedScene.rotation.set(0, -Math.PI / 8, 0);
  }, [clonedScene, scale]);

  // GSAP Beating Animation
  useEffect(() => {
    const cycleDuration = 0.9;
    
    // Create the timeline
    beatTl.current = gsap.timeline({ repeat: -1 });
    
    gsap.set(scaleObj.current, { s: 1 });
    gsap.set(materialProxy.current, { emissiveIntensity: 0 });

    beatTl.current
      // "Lub" - Quick scale up (100ms)
      .to(scaleObj.current, { s: 1.05, duration: 0.1, ease: 'power1.out' }, 0)
      .to(materialProxy.current, { emissiveIntensity: 0.4, duration: 0.1, ease: 'power1.out' }, 0)
      
      // Brief hold / small drop
      .to(scaleObj.current, { s: 1.02, duration: 0.1, ease: 'power1.inOut' }, 0.1)
      .to(materialProxy.current, { emissiveIntensity: 0.1, duration: 0.1, ease: 'power1.inOut' }, 0.1)
      
      // "Dub" - Second scale up (80ms)
      .to(scaleObj.current, { s: 1.04, duration: 0.08, ease: 'power1.out' }, 0.2)
      .to(materialProxy.current, { emissiveIntensity: 0.25, duration: 0.08, ease: 'power1.out' }, 0.2)
      
      // Rest
      .to(scaleObj.current, { s: 1, duration: cycleDuration - 0.28, ease: 'power2.out' }, 0.28)
      .to(materialProxy.current, { emissiveIntensity: 0, duration: cycleDuration - 0.28, ease: 'power2.out' }, 0.28);

    return () => {
      beatTl.current?.kill();
    };
  }, []);

  // Extra beat on click
  const handlePointerDown = (e: any) => {
    if (!interactionEnabled) return;
    e.stopPropagation();
    
    // Extra out-of-rhythm pulse
    const extraBeat = gsap.timeline();
    extraBeat
      .to(scaleObj.current, { s: 1.08, duration: 0.1, ease: 'power2.out' }, 0)
      .to(materialProxy.current, { emissiveIntensity: 0.6, duration: 0.1, ease: 'power2.out' }, 0)
      .to(scaleObj.current, { s: 1, duration: 0.4, ease: 'bounce.out' }, 0.1)
      .to(materialProxy.current, { emissiveIntensity: 0, duration: 0.4, ease: 'power2.out' }, 0.1);
  };

  useFrame((state, delta) => {
    baseTime.current += delta;
    
    if (groupRef.current) {
      // Apply base GSAP scale
      const currentScale = scaleObj.current.s;
      groupRef.current.scale.setScalar(currentScale);

      // Interactions
      if (interactionEnabled) {
        // Idle sway / rotation
        const swayX = Math.sin(baseTime.current * 0.5) * 0.05;
        const swayY = Math.cos(baseTime.current * 0.3) * 0.05;
        
        // Mouse follow mapping
        const targetX = (pointer.x * viewport.width) * 0.02;
        const targetY = (pointer.y * viewport.height) * 0.02;

        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetX + swayY, 0.05);
        groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -targetY + swayX, 0.05);
        
        // Gentle float
        groupRef.current.position.y = Math.sin(baseTime.current * 2) * 0.05;
      } else {
        // Just idle rotation
        groupRef.current.rotation.y = Math.sin(baseTime.current * 0.3) * 0.1;
      }

      // Apply material emissive intensity
      if (heartMesh.current) {
        const mat = heartMesh.current.material as THREE.MeshStandardMaterial;
        // Increase base glow slightly when hovered
        const hoverGlow = hovered && interactionEnabled ? 0.2 : 0;
        mat.emissiveIntensity = materialProxy.current.emissiveIntensity + hoverGlow;
      }
    }
  });

  return (
    <>
      <group 
        ref={groupRef} 
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onPointerDown={handlePointerDown}
        position={[0, 0, 0]}
      >
        <primitive object={clonedScene} />
      </group>

      {/* Background Atmosphere */}
      <AmbientParticles 
        count={Math.floor(70 * ambientDensity)} 
        theme={theme} 
      />

      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight 
        position={[5, 5, 5]} 
        intensity={2.5} 
        color="#ffffff" 
        castShadow 
      />
      <directionalLight 
        position={[-5, 2, 5]} 
        intensity={1.0} 
        color="#ffe6e6"
      />
      <directionalLight 
        position={[0, 5, -5]} 
        intensity={1.5} 
        color="#e6f7ff" 
      />

      <Environment preset="city" />

      {/* Ground Shadow */}
      <ContactShadows 
        position={[0, -2.5, 0]} 
        opacity={0.5} 
        scale={10} 
        blur={2.5} 
        far={5} 
        color="#000000" 
      />
    </>
  );
};

useGLTF.preload('/models/realistic_human_heart/scene.gltf');
