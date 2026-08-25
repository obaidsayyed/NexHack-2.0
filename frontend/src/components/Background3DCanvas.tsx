import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const Background3DCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    let width = container.clientWidth;
    let height = container.clientHeight;

    // Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x090d16, 0.018);

    // Camera
    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);
    camera.position.set(0, 0, 28);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Master World Group for Parallax
    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    // 1. ROTATING 3D NEURAL & CARDIAC CONSTELLATION
    const particleCount = 340;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const colorBlue = new THREE.Color(0x38bdf8); // Sky Blue
    const colorIndigo = new THREE.Color(0x6366f1); // Indigo
    const colorEmerald = new THREE.Color(0x10b981); // Emerald Green
    const colorCrimson = new THREE.Color(0xef4444); // Crimson Highlight

    const particleCoords: THREE.Vector3[] = [];

    for (let i = 0; i < particleCount; i++) {
      const radius = 14 + Math.random() * 26;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      particleCoords.push(new THREE.Vector3(x, y, z));

      // Color distribution
      let c = colorBlue;
      const rand = Math.random();
      if (rand > 0.7) c = colorIndigo;
      else if (rand > 0.88) c = colorEmerald;
      else if (rand > 0.96) c = colorCrimson;

      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.38,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });

    const particleSystem = new THREE.Points(geometry, particleMaterial);
    worldGroup.add(particleSystem);

    // 2. CONNECTING NETWORK SYNAPSE LINES
    const linePositions: number[] = [];
    const lineColors: number[] = [];
    const maxDistance = 8.0;

    for (let i = 0; i < particleCount; i++) {
      for (let j = i + 1; j < particleCount; j++) {
        const dist = particleCoords[i].distanceTo(particleCoords[j]);
        if (dist < maxDistance) {
          linePositions.push(
            particleCoords[i].x, particleCoords[i].y, particleCoords[i].z,
            particleCoords[j].x, particleCoords[j].y, particleCoords[j].z
          );

          const alpha = 1 - dist / maxDistance;
          lineColors.push(
            0.15, 0.45 * alpha, 0.85 * alpha,
            0.15, 0.45 * alpha, 0.85 * alpha
          );
        }
      }
    }

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    lineGeometry.setAttribute('color', new THREE.Float32BufferAttribute(lineColors, 3));

    const lineMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
    });

    const linesMesh = new THREE.LineSegments(lineGeometry, lineMaterial);
    worldGroup.add(linesMesh);

    // 3. CENTRAL 3D FLOATING TORUS KNOT (Abstract AI Core)
    const torusKnotGeo = new THREE.TorusKnotGeometry(7.5, 2.0, 120, 16, 2, 3);
    const torusKnotMat = new THREE.MeshBasicMaterial({
      color: 0x3b82f6,
      wireframe: true,
      transparent: true,
      opacity: 0.12,
    });
    const torusKnot = new THREE.Mesh(torusKnotGeo, torusKnotMat);
    worldGroup.add(torusKnot);

    // 4. FLOATING 3D ORBITAL TELEMETRY RINGS
    const ringGeo = new THREE.TorusGeometry(15, 0.12, 16, 120);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.15,
    });
    const ring1 = new THREE.Mesh(ringGeo, ringMat1);
    ring1.rotation.x = Math.PI / 3;
    worldGroup.add(ring1);

    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0x818cf8,
      wireframe: true,
      transparent: true,
      opacity: 0.15,
    });
    const ring2 = new THREE.Mesh(ringGeo, ringMat2);
    ring2.rotation.y = Math.PI / 4;
    worldGroup.add(ring2);

    // 5. GLOWING 3D TELEMETRY NODES
    const nodeCount = 8;
    const nodeGroup = new THREE.Group();
    const nodeGeo = new THREE.SphereGeometry(0.5, 16, 16);
    const nodeMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x1d4ed8,
      emissiveIntensity: 0.8,
      roughness: 0.2,
    });

    for (let i = 0; i < nodeCount; i++) {
      const node = new THREE.Mesh(nodeGeo, nodeMat);
      const angle = (i / nodeCount) * Math.PI * 2;
      node.position.set(Math.cos(angle) * 15, Math.sin(angle) * 15, 0);
      nodeGroup.add(node);
    }
    nodeGroup.rotation.x = Math.PI / 3;
    worldGroup.add(nodeGroup);

    // Ambient Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x38bdf8, 2, 30);
    pointLight.position.set(0, 0, 10);
    scene.add(pointLight);

    // Mouse Parallax Interaction
    let targetMouseX = 0;
    let targetMouseY = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Smooth Interpolation
      currentMouseX += (targetMouseX - currentMouseX) * 0.04;
      currentMouseY += (targetMouseY - currentMouseY) * 0.04;

      // World Group Continuous 3D Rotation
      worldGroup.rotation.y = elapsedTime * 0.05 + currentMouseX * 0.3;
      worldGroup.rotation.x = Math.sin(elapsedTime * 0.03) * 0.12 + currentMouseY * 0.2;

      // Inner Core & Ring Rotations
      torusKnot.rotation.x = elapsedTime * 0.08;
      torusKnot.rotation.z = elapsedTime * 0.06;

      ring1.rotation.z = elapsedTime * 0.04;
      ring2.rotation.z = -elapsedTime * 0.05;

      nodeGroup.rotation.z = elapsedTime * 0.09;

      // Pulsing effect
      const pulse = 1 + Math.sin(elapsedTime * 1.8) * 0.04;
      torusKnot.scale.set(pulse, pulse, pulse);

      renderer.render(scene, camera);
    };

    animate();

    // Window Resize
    const handleResize = () => {
      if (!containerRef.current) return;
      width = containerRef.current.clientWidth;
      height = containerRef.current.clientHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      geometry.dispose();
      lineGeometry.dispose();
      torusKnotGeo.dispose();
      ringGeo.dispose();
      nodeGeo.dispose();
      particleMaterial.dispose();
      lineMaterial.dispose();
      torusKnotMat.dispose();
      ringMat1.dispose();
      ringMat2.dispose();
      nodeMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      aria-hidden="true"
    />
  );
};
