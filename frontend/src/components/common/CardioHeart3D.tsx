import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, Environment, Float, Center } from '@react-three/drei';
import * as THREE from 'three';

const AnimatedSphere = () => {
  const sphereRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (sphereRef.current) {
      sphereRef.current.rotation.x = state.clock.getElapsedTime() * 0.2;
      sphereRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <Center>
        <Sphere ref={sphereRef} args={[1, 64, 64]} scale={1.5}>
          <MeshDistortMaterial
            color="#8b5cf6"
            attach="material"
            distort={0.4}
            speed={2}
            roughness={0.2}
            metalness={0.8}
            wireframe={false}
            emissive="#4c1d95"
            emissiveIntensity={0.5}
          />
        </Sphere>
        {/* Core glowing center */}
        <Sphere args={[0.8, 32, 32]}>
          <meshBasicMaterial color="#ffffff" transparent opacity={0.2} />
        </Sphere>
      </Center>
    </Float>
  );
};

export const CardioHeart3D: React.FC = () => {
  return (
    <div className="w-full h-full min-h-[300px] sm:min-h-[400px] lg:min-h-[500px]">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }} dpr={[1, 2]}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} color="#ffffff" />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} color="#f43f5e" />
        <AnimatedSphere />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
};
