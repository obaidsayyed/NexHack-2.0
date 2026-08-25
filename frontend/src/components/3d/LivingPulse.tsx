import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, ContactShadows, Environment } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import gsap from 'gsap';

export type PulsePhase = 'landing' | 'login' | 'dashboard';

interface LivingPulseProps {
  phase: PulsePhase;
  theme?: 'light' | 'dark';
}

export const LivingPulse: React.FC<LivingPulseProps> = ({ phase, theme = 'dark' }) => {
  const group = useRef<THREE.Group>(null);
  const heartMesh = useRef<THREE.Mesh>(null);
  
  // Load the downloaded heart model
  const { scene } = useGLTF('/heart.glb');
  
  const material = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: '#6e0000', // Deep rich red base
      emissive: '#14b8a6', // Mint/teal accent for glow
      emissiveIntensity: 0, // Starts at 0, driven by animation
      roughness: 0.1, // Glossy/wet look
      metalness: 0.1,
      clearcoat: 0.8, // Extra sheen
      clearcoatRoughness: 0.2,
    });
  }, []);

  // Traverse the loaded scene and apply our custom material to all meshes
  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.material = material;
        // Optional: save a ref to the first/main mesh if needed for targeted effects
        if (!heartMesh.current) {
            heartMesh.current = mesh;
        }
      }
    });
    
    // Auto-center and scale the model
    const box = new THREE.Box3().setFromObject(scene);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    
    // Normalize scale to ~4 units
    const targetScale = 4 / maxDim;
    scene.scale.setScalar(targetScale);
    scene.position.copy(center).multiplyScalar(-targetScale);
    
  }, [scene, material]);

  // GSAP Animation Timeline
  const beatTimeline = useRef<gsap.core.Timeline>(null);
  
  useEffect(() => {
    if (!group.current) return;
    
    // The "lub-dub" heartbeat rhythm
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.6 });
    
    // Initial state
    gsap.set(group.current.scale, { x: 1, y: 1, z: 1 });
    gsap.set(material, { emissiveIntensity: 0 });

    // "Lub" - First big beat
    tl.to(group.current.scale, { x: 1.06, y: 1.06, z: 1.06, duration: 0.1, ease: 'power1.out' }, 0)
      .to(material, { emissiveIntensity: 0.8, duration: 0.1, ease: 'power1.out' }, 0)
      // Small hold
      .to(group.current.scale, { x: 1.02, y: 1.02, z: 1.02, duration: 0.1, ease: 'power1.inOut' }, 0.1)
      .to(material, { emissiveIntensity: 0.2, duration: 0.1, ease: 'power1.inOut' }, 0.1)
      // "Dub" - Second smaller beat
      .to(group.current.scale, { x: 1.04, y: 1.04, z: 1.04, duration: 0.08, ease: 'power1.out' }, 0.2)
      .to(material, { emissiveIntensity: 0.5, duration: 0.08, ease: 'power1.out' }, 0.2)
      // Rest
      .to(group.current.scale, { x: 1, y: 1, z: 1, duration: 0.3, ease: 'power2.out' }, 0.28)
      .to(material, { emissiveIntensity: 0, duration: 0.3, ease: 'power2.out' }, 0.28);

    beatTimeline.current = tl;

    return () => {
      tl.kill();
    };
  }, [material]);

  // Idle floating animation
  useFrame((state) => {
    if (group.current) {
      const time = state.clock.getElapsedTime();
      group.current.position.y = Math.sin(time * 1.5) * 0.1; // Gentle float
      // Very slow idle rotation
      group.current.rotation.y = Math.sin(time * 0.5) * 0.1;
    }
  });

  return (
    <>
      <group ref={group}>
        <primitive object={scene} />
      </group>

      {/* Lighting setup */}
      <ambientLight intensity={0.4} />
      {/* Key Light */}
      <directionalLight position={[5, 5, 5]} intensity={2.5} color="#ffffff" castShadow />
      {/* Fill Light */}
      <directionalLight position={[-5, 0, 5]} intensity={1.5} color="#14b8a6" />
      {/* Rim Light */}
      <pointLight position={[0, 5, -5]} intensity={4} color="#ff3333" />

      {/* Contact Shadow to ground the heart */}
      <ContactShadows 
        position={[0, -2.5, 0]} 
        opacity={0.6} 
        scale={10} 
        blur={2} 
        far={4} 
        color="#000000" 
      />

      <EffectComposer disableNormalPass>
        <Bloom 
          luminanceThreshold={0.2} 
          mipmapBlur 
          intensity={1.5} 
          radius={0.8}
        />
      </EffectComposer>
    </>
  );
};

// Preload the model
useGLTF.preload('/heart.glb');
