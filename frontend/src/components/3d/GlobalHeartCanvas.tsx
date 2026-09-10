import React, { useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { VitalForm } from './VitalForm';
import gsap from 'gsap';
import * as THREE from 'three';

interface SceneProps {
  phase: 'landing' | 'login' | 'landing-v2';
  theme: 'light' | 'dark';
}

const GlobalScene: React.FC<SceneProps> = ({ phase, theme }) => {
  const groupRef = useRef<THREE.Group>(null);
  const { viewport } = useThree();

  useEffect(() => {
    if (!groupRef.current) return;
    
    const isMobile = window.innerWidth < 1024; // Use lg breakpoint for desktop

    let targetX = 0;
    let targetY = 0;
    let targetScale = 1;

    if (phase === 'landing') {
      if (!isMobile) {
        // Landing page hero right column
        targetX = viewport.width * 0.25; 
        targetY = 0;
        targetScale = 2.8; 
      } else {
        // Landing page mobile center
        targetX = 0;
        targetY = 0;
        targetScale = 2.0; 
      }
    } else if (phase === 'login') {
      if (!isMobile) {
        // Login page left column split (Heart upper center, text below)
        targetX = -viewport.width * 0.25; 
        targetY = viewport.height * 0.12; 
        targetScale = 1.7; 
      } else {
        // Login page mobile top
        targetX = 0;
        targetY = viewport.height * 0.25; 
        targetScale = 1.4;
      }
    } else if (phase === 'landing-v2') {
      targetX = 0;
      targetY = 0;
      targetScale = isMobile ? 1.5 : 2.0; // Perfectly centered, slightly smaller than V1 hero
    }

    gsap.to(groupRef.current.position, {
      x: targetX,
      y: targetY,
      duration: 1.2,
      ease: 'power3.inOut'
    });
    
    gsap.to(groupRef.current.scale, {
      x: targetScale,
      y: targetScale,
      z: targetScale,
      duration: 1.2,
      ease: 'power3.inOut'
    });

  }, [phase, viewport.width, viewport.height]);

  return (
    <group ref={groupRef}>
       <VitalForm scale={1.0} theme={theme} ambientDensity={phase === 'login' ? 1.2 : 1.0} />
    </group>
  );
};

interface GlobalHeartCanvasProps {
  phase: 'landing' | 'login' | 'landing-v2';
  theme: 'light' | 'dark';
}

export const GlobalHeartCanvas: React.FC<GlobalHeartCanvasProps> = ({ phase, theme }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-0 pointer-events-none"
    >
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 8], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
        eventSource={typeof document !== 'undefined' ? document.body : undefined}
        eventPrefix="client"
      >
        <React.Suspense fallback={null}>
          <GlobalScene phase={phase} theme={theme} />
        </React.Suspense>
      </Canvas>
    </div>
  );
};
