import React, { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface AmbientParticlesProps {
  count?: number;
  theme?: 'light' | 'dark';
}

export const AmbientParticles: React.FC<AmbientParticlesProps> = ({ 
  count = 70, 
  theme = 'dark' 
}) => {
  const pointsRef = useRef<THREE.Points>(null);
  const { viewport, pointer } = useThree();

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  // Respect performance and accessibility preferences
  const actualCount = isMobile ? Math.floor(count * 0.4) : count;

  const { positions, colors, sizes, phases, velocities } = useMemo(() => {
    const positions = new Float32Array(actualCount * 3);
    const colors = new Float32Array(actualCount * 3);
    const sizes = new Float32Array(actualCount);
    const phases = new Float32Array(actualCount);
    const velocities = [];

    const colorPink = new THREE.Color('#F472B6');
    const colorBlue = new THREE.Color('#38BDF8');

    for (let i = 0; i < actualCount; i++) {
      // Behind the heart (z between -4 and -15) to not compete with the focal point
      positions[i * 3] = (Math.random() - 0.5) * 30; 
      positions[i * 3 + 1] = (Math.random() - 0.5) * 30; 
      positions[i * 3 + 2] = -4 - Math.random() * 11;

      // Existing pink and sky-blue accent colors only
      const c = Math.random() > 0.5 ? colorPink : colorBlue;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      // Noticeable but delicate motes
      sizes[i] = Math.random() * 3.0 + 1.5;
      phases[i] = Math.random() * Math.PI * 2;
      
      // Gentle, slow upward/ambient drift velocity
      velocities.push(new THREE.Vector3(
        (Math.random() - 0.5) * 0.12,
        Math.random() * 0.15 + 0.05,
        (Math.random() - 0.5) * 0.1
      ));
    }

    return { positions, colors, sizes, phases, velocities };
  }, [actualCount]);

  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        // Low opacity max (approx 15-35%)
        uOpacityRatio: { value: 0.35 }, 
      },
      vertexShader: `
        attribute float size;
        attribute float phase;
        varying vec3 vColor;
        varying float vAlpha;
        uniform float uTime;
        uniform float uOpacityRatio;
        
        void main() {
          vColor = color;
          // Soft organic pulsing
          float pulse = (sin(uTime * 0.4 + phase) + 1.0) * 0.5;
          vAlpha = (0.2 + 0.8 * pulse) * uOpacityRatio;
          
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          
          // Subtle scale pulse alongside opacity
          float scalePulse = 0.9 + 0.2 * pulse;
          gl_PointSize = size * scalePulse * (150.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        
        void main() {
          // Circular particle shape with soft edge
          vec2 xy = gl_PointCoord.xy - vec2(0.5);
          float ll = length(xy);
          if(ll > 0.5) discard;
          
          float edgeAlpha = pow(1.0 - (ll * 2.0), 1.5);
          
          gl_FragColor = vec4(vColor, vAlpha * edgeAlpha);
        }
      `,
      transparent: true,
      blending: THREE.NormalBlending,
      depthWrite: false,
      vertexColors: true
    });
  }, []);

  const mouseWorld = new THREE.Vector3();

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    const material = pointsRef.current.material as THREE.ShaderMaterial;
    material.uniforms.uTime.value = state.clock.getElapsedTime();

    if (prefersReducedMotion) return;

    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    
    // Only process interactivity and exact positions if not mobile
    const interact = !isMobile;
    if (interact) {
      // Map pointer to approximate world position, assuming a plane at z=-5
      mouseWorld.set(
        (pointer.x * viewport.width) / 2,
        (pointer.y * viewport.height) / 2,
        -5
      );
    }

    for (let i = 0; i < actualCount; i++) {
      let x = positions[i * 3];
      let y = positions[i * 3 + 1];
      let z = positions[i * 3 + 2];
      
      const vel = velocities[i];
      x += vel.x * delta;
      y += vel.y * delta;
      z += vel.z * delta;

      // Wrap vertically and horizontally to keep a continuous flow
      if (y > 15) y = -15;
      if (y < -15) y = 15;
      if (x > 15) x = -15;
      if (x < -15) x = 15;
      if (z > 0) z = -15;
      if (z < -15) z = -4;

      if (interact) {
         const dx = x - mouseWorld.x;
         const dy = y - mouseWorld.y;
         const distSq = dx*dx + dy*dy;
         
         // Subtle elegant cursor reaction (drift away gently)
         if (distSq < 20) { 
            const dist = Math.sqrt(distSq);
            // Non-linear gentle falloff force
            const force = (4.47 - dist) * 0.04; 
            x += (dx / dist) * force;
            y += (dy / dist) * force;
         }
      }

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }
    
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} key={actualCount}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={actualCount}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={actualCount}
          array={colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={actualCount}
          array={sizes}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-phase"
          count={actualCount}
          array={phases}
          itemSize={1}
        />
      </bufferGeometry>
      <primitive object={shaderMaterial} attach="material" />
    </points>
  );
};
