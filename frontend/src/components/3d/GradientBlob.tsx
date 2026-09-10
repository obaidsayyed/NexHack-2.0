import React, { useRef, useMemo, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface GradientBlobProps {
  scale?: number;
  speed?: number;
  noiseAmplitude?: number;
  interactionEnabled?: boolean;
  theme: 'light' | 'dark';
}

// Simple 3D noise-like function using sin/cos combinations
function fbm(x: number, y: number, z: number, t: number): number {
  let value = 0;
  value += Math.sin(x * 1.2 + t * 0.7) * 0.5;
  value += Math.sin(y * 1.8 + t * 0.5) * 0.35;
  value += Math.cos(z * 1.5 + x * 0.8 + t * 0.6) * 0.25;
  value += Math.sin(x * 2.5 + y * 2.0 + t * 0.3) * 0.15;
  value += Math.cos(z * 3.0 + t * 0.8) * 0.1;
  return value;
}

// Vertex shader for gradient coloring
const vertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Fragment shader for the teal-to-coral gradient
const fragmentShader = `
  uniform vec3 uColorStart;
  uniform vec3 uColorEnd;
  uniform float uOpacity;
  
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  
  void main() {
    // Gradient from bottom (teal) to top (coral), with some noise
    float gradient = smoothstep(-1.5, 1.5, vPosition.y);
    vec3 color = mix(uColorStart, uColorEnd, gradient);
    
    // Soft fresnel/rim lighting for depth
    vec3 viewDir = normalize(cameraPosition - vPosition);
    float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), 2.0);
    color += fresnel * 0.15;
    
    // Subtle specular highlight
    vec3 lightDir = normalize(vec3(1.0, 2.0, 1.5));
    float spec = pow(max(dot(reflect(-lightDir, vNormal), viewDir), 0.0), 16.0);
    color += spec * 0.3;
    
    gl_FragColor = vec4(color, uOpacity);
  }
`;

export const GradientBlob: React.FC<GradientBlobProps> = ({
  scale = 3,
  speed = 1.0,
  noiseAmplitude = 0.35,
  interactionEnabled = true,
  theme = 'light',
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const geoRef = useRef<THREE.IcosahedronGeometry>(null);
  
  // Interaction refs
  const mouse = useRef(new THREE.Vector2(0, 0));
  const targetMouse = useRef(new THREE.Vector2(0, 0));
  const rippleOrigin = useRef(new THREE.Vector3(0, 0, 0));
  const rippleTime = useRef(-1);
  const scrollProgress = useRef(0);

  const { camera } = useThree();

  const isLight = theme === 'light';

  // Colors from CSS tokens
  const colorStart = useMemo(() => new THREE.Color(isLight ? '#3D8B7A' : '#4FBEAA'), [isLight]);
  const colorEnd = useMemo(() => new THREE.Color(isLight ? '#E8956A' : '#F0A878'), [isLight]);

  // Store base positions
  const basePositions = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(1, 48);
    const positions = geo.attributes.position.array.slice();
    geo.dispose();
    return new Float32Array(positions);
  }, []);

  // Shader material uniforms
  const uniforms = useMemo(() => ({
    uColorStart: { value: colorStart },
    uColorEnd: { value: colorEnd },
    uOpacity: { value: isLight ? 0.92 : 0.85 },
  }), [colorStart, colorEnd, isLight]);

  // Event listeners
  useEffect(() => {
    if (!interactionEnabled) return;

    const handleMouseMove = (e: MouseEvent) => {
      targetMouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      targetMouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    const handleClick = (e: MouseEvent) => {
      // Project click into 3D space for ripple origin
      const clickNDC = new THREE.Vector2(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(clickNDC, camera);
      // Use a point on the ray at distance ~scale as the ripple origin
      rippleOrigin.current.copy(raycaster.ray.at(10, new THREE.Vector3()));
      rippleTime.current = 0;
    };

    const handleScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      scrollProgress.current = maxScroll > 0 ? window.scrollY / maxScroll : 0;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [interactionEnabled, camera]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    // Smooth mouse interpolation
    mouse.current.lerp(targetMouse.current, 0.06);

    // Advance ripple
    if (rippleTime.current >= 0) {
      rippleTime.current += 0.03;
      if (rippleTime.current > 2.0) rippleTime.current = -1;
    }

    if (!meshRef.current || !geoRef.current) return;

    const positions = geoRef.current.attributes.position;
    const count = positions.count;

    // Mouse in 3D (rough projection)
    const mouse3D = new THREE.Vector3(
      mouse.current.x * scale * 2,
      mouse.current.y * scale * 2,
      0
    );

    for (let i = 0; i < count; i++) {
      const bx = basePositions[i * 3];
      const by = basePositions[i * 3 + 1];
      const bz = basePositions[i * 3 + 2];

      // Normal direction (unit sphere)
      const len = Math.sqrt(bx * bx + by * by + bz * bz);
      const nx = bx / len;
      const ny = by / len;
      const nz = bz / len;

      // 1. Organic noise displacement
      const noise = fbm(bx * 1.5, by * 1.5, bz * 1.5, time * speed * 0.8);
      let displacement = noise * noiseAmplitude;

      // 2. Cursor proximity push
      if (interactionEnabled) {
        const worldX = bx * scale;
        const worldY = by * scale;
        const worldZ = bz * scale;
        const dx = worldX - mouse3D.x;
        const dy = worldY - mouse3D.y;
        const dz = worldZ - mouse3D.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const pushRadius = scale * 1.5;
        if (dist < pushRadius) {
          const pushStrength = (1 - dist / pushRadius) * 0.2;
          displacement += pushStrength;
        }
      }

      // 3. Click ripple
      if (rippleTime.current >= 0) {
        const worldX = bx * scale;
        const worldY = by * scale;
        const worldZ = bz * scale;
        const rdx = worldX - rippleOrigin.current.x;
        const rdy = worldY - rippleOrigin.current.y;
        const rdz = worldZ - rippleOrigin.current.z;
        const rDist = Math.sqrt(rdx * rdx + rdy * rdy + rdz * rdz);
        const rippleRadius = rippleTime.current * scale * 3;
        const rippleWidth = scale * 0.8;
        const rippleEffect = Math.exp(-Math.pow(rDist - rippleRadius, 2) / (rippleWidth * rippleWidth));
        const fade = Math.max(0, 1 - rippleTime.current / 2.0);
        displacement += rippleEffect * 0.25 * fade;
      }

      // Apply displacement along normal
      const s = 1 + displacement;
      positions.setXYZ(i, bx * s, by * s, bz * s);
    }

    positions.needsUpdate = true;
    geoRef.current.computeVertexNormals();

    // Scroll-driven scale/position shift
    const scrollScale = 1 - scrollProgress.current * 0.3;
    const scrollY = scrollProgress.current * -2;
    meshRef.current.scale.setScalar(scale * scrollScale);
    meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, scrollY, 0.05);

    // Very gentle rotation
    meshRef.current.rotation.y = time * 0.08 * speed;
    meshRef.current.rotation.x = Math.sin(time * 0.1 * speed) * 0.1;

    // Update uniforms for smooth theme transitions
    (uniforms.uColorStart.value as THREE.Color).lerp(colorStart, 0.05);
    (uniforms.uColorEnd.value as THREE.Color).lerp(colorEnd, 0.05);
  });

  return (
    <group>
      {/* Lighting */}
      <ambientLight intensity={isLight ? 1.2 : 0.6} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={isLight ? 1.8 : 1.2}
        color={isLight ? '#FFF5EE' : '#4FBEAA'}
      />
      <directionalLight
        position={[-3, -5, -3]}
        intensity={0.5}
        color={isLight ? '#E8956A' : '#F0A878'}
      />

      {/* The Blob */}
      <mesh ref={meshRef} scale={scale}>
        <icosahedronGeometry ref={geoRef} args={[1, 48]} />
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Soft shadow/glow plane beneath */}
      <mesh position={[0, -scale * 1.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[scale * 1.5, 32]} />
        <meshBasicMaterial
          color={isLight ? '#3D8B7A' : '#4FBEAA'}
          transparent
          opacity={isLight ? 0.06 : 0.1}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};
