import React, { useRef, useMemo, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface LivingHeartProps {
  scale?: number;
  beatSpeed?: number;
  interactionEnabled?: boolean;
  scrollProgress?: number;
  theme: 'light' | 'dark';
  onLoginSuccess?: boolean;
}

/* ── Heart shape parametric curve ── */
function createHeartShape(): THREE.Shape {
  const shape = new THREE.Shape();
  // Abstract heart using bezier curves
  shape.moveTo(0, -0.8);
  shape.bezierCurveTo(0, -1.2, -0.7, -1.6, -1.2, -1.2);
  shape.bezierCurveTo(-1.8, -0.7, -1.8, 0.2, -1.2, 0.7);
  shape.bezierCurveTo(-0.7, 1.2, 0, 1.6, 0, 2.0);
  shape.bezierCurveTo(0, 1.6, 0.7, 1.2, 1.2, 0.7);
  shape.bezierCurveTo(1.8, 0.2, 1.8, -0.7, 1.2, -1.2);
  shape.bezierCurveTo(0.7, -1.6, 0, -1.2, 0, -0.8);
  return shape;
}

/* ── EKG waveform ── */
function generateEKGPoints(count: number, width: number): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / count;
    const x = (t - 0.5) * width;
    let y = 0;

    // PQRST pattern (one cycle centered at t=0.5)
    const cycle = (t * 2) % 1; // repeating pattern
    if (cycle > 0.35 && cycle < 0.38) {
      y = 0.15; // P wave
    } else if (cycle > 0.40 && cycle < 0.42) {
      y = -0.1; // Q dip
    } else if (cycle > 0.42 && cycle < 0.46) {
      y = 0.8; // R spike (the big one)
    } else if (cycle > 0.46 && cycle < 0.48) {
      y = -0.2; // S dip
    } else if (cycle > 0.52 && cycle < 0.58) {
      y = 0.2; // T wave
    }
    points.push(new THREE.Vector3(x, y, 0));
  }
  return points;
}

/* ── Heartbeat timing (lub-dub at ~65bpm ≈ 920ms cycle) ── */
function getHeartbeatScale(time: number, speed: number): number {
  const period = 0.92 / speed;
  const phase = (time % period) / period;

  // lub (0.0–0.12): quick scale up
  if (phase < 0.12) {
    const t = phase / 0.12;
    return 1 + 0.06 * Math.sin(t * Math.PI);
  }
  // brief pause (0.12–0.20)
  if (phase < 0.20) return 1.0;
  // dub (0.20–0.30): smaller scale up
  if (phase < 0.30) {
    const t = (phase - 0.20) / 0.10;
    return 1 + 0.03 * Math.sin(t * Math.PI);
  }
  // rest
  return 1.0;
}

function getHeartbeatGlow(time: number, speed: number): number {
  const period = 0.92 / speed;
  const phase = (time % period) / period;
  if (phase < 0.12) {
    return 0.3 + 0.7 * Math.sin((phase / 0.12) * Math.PI);
  }
  if (phase < 0.20) return 0.3;
  if (phase < 0.30) {
    return 0.3 + 0.4 * Math.sin(((phase - 0.20) / 0.10) * Math.PI);
  }
  return 0.3;
}

export const LivingHeart: React.FC<LivingHeartProps> = ({
  scale = 2.5,
  beatSpeed = 1.0,
  interactionEnabled = true,
  scrollProgress = 0,
  theme = 'light',
  onLoginSuccess = false,
}) => {
  const heartRef = useRef<THREE.Mesh>(null);
  const ekgRef = useRef<THREE.Line>(null);
  const glowRef = useRef<THREE.PointLight>(null);

  const mouse = useRef(new THREE.Vector2(0, 0));
  const targetMouse = useRef(new THREE.Vector2(0, 0));
  const extraBeatTime = useRef(-1);
  const loginBeatTime = useRef(-1);

  const isLight = theme === 'light';

  // Colors
  const heartColor = useMemo(() => new THREE.Color(isLight ? '#F0D5D3' : '#3D2A2E'), [isLight]);
  const glowColor = useMemo(() => new THREE.Color(isLight ? '#D4736C' : '#E8918B'), [isLight]);
  const ekgColor = useMemo(() => new THREE.Color(isLight ? '#D4736C' : '#E8918B'), [isLight]);

  // Heart geometry
  const heartGeometry = useMemo(() => {
    const shape = createHeartShape();
    const extrudeSettings = {
      depth: 0.8,
      bevelEnabled: true,
      bevelThickness: 0.25,
      bevelSize: 0.2,
      bevelOffset: 0,
      bevelSegments: 12,
      curveSegments: 32,
    };
    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.center();
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Store base positions for vertex displacement
  const basePositions = useMemo(() => {
    return new Float32Array(heartGeometry.attributes.position.array);
  }, [heartGeometry]);

  // EKG line
  const ekgPointCount = 200;
  const ekgWidth = 12;
  const ekgGeometry = useMemo(() => {
    const points = generateEKGPoints(ekgPointCount, ekgWidth);
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    return geo;
  }, []);

  const ekgMaterial = useMemo(() => {
    return new THREE.LineBasicMaterial({
      color: ekgColor,
      transparent: true,
      opacity: 0.7,
      linewidth: 1,
    });
  }, [ekgColor]);

  // Event listeners
  useEffect(() => {
    if (!interactionEnabled) return;

    const handleMouseMove = (e: MouseEvent) => {
      targetMouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      targetMouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    const handleClick = () => {
      extraBeatTime.current = 0;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
    };
  }, [interactionEnabled]);

  // Login success trigger
  useEffect(() => {
    if (onLoginSuccess) {
      loginBeatTime.current = 0;
    }
  }, [onLoginSuccess]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    // Smooth mouse
    mouse.current.lerp(targetMouse.current, 0.06);

    // Extra beat fade
    if (extraBeatTime.current >= 0) {
      extraBeatTime.current += 0.04;
      if (extraBeatTime.current > 0.5) extraBeatTime.current = -1;
    }

    // Login beat
    if (loginBeatTime.current >= 0) {
      loginBeatTime.current += 0.02;
      if (loginBeatTime.current > 1.5) loginBeatTime.current = -1;
    }

    const effectiveSpeed = loginBeatTime.current >= 0 ? beatSpeed * 1.5 : beatSpeed;

    if (heartRef.current) {
      // ── Heartbeat scale ──
      let beatScale = getHeartbeatScale(time, effectiveSpeed);

      // Extra click beat
      if (extraBeatTime.current >= 0 && extraBeatTime.current < 0.3) {
        const t = extraBeatTime.current / 0.3;
        beatScale += 0.08 * Math.sin(t * Math.PI);
      }

      // Scroll-driven shrink and reposition
      const scrollScale = 1 - scrollProgress * 0.6;
      const scrollX = scrollProgress * 4;
      const scrollY = scrollProgress * 2;
      const scrollOpacity = 1 - scrollProgress * 0.7;

      heartRef.current.scale.setScalar(scale * beatScale * scrollScale);
      heartRef.current.position.x = THREE.MathUtils.lerp(heartRef.current.position.x, scrollX, 0.08);
      heartRef.current.position.y = THREE.MathUtils.lerp(heartRef.current.position.y, scrollY, 0.08);

      // Gentle idle rotation
      heartRef.current.rotation.y = Math.sin(time * 0.3) * 0.15;
      heartRef.current.rotation.z = Math.PI; // Heart upright (tip down)

      // ── Cursor proximity vertex displacement ──
      if (interactionEnabled) {
        const positions = heartGeometry.attributes.position;
        const count = positions.count;
        const mouse3D = new THREE.Vector3(mouse.current.x * 4, mouse.current.y * 4, 0);

        for (let i = 0; i < count; i++) {
          const bx = basePositions[i * 3];
          const by = basePositions[i * 3 + 1];
          const bz = basePositions[i * 3 + 2];

          const worldX = bx * scale * beatScale;
          const worldY = by * scale * beatScale;
          const dx = worldX - mouse3D.x;
          const dy = worldY - mouse3D.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          const pushRadius = scale * 1.5;
          let displacement = 0;
          if (dist < pushRadius) {
            displacement = (1 - dist / pushRadius) * 0.08;
          }

          // Displacement along approximate normal (from center)
          const len = Math.sqrt(bx * bx + by * by + bz * bz) || 1;
          positions.setXYZ(
            i,
            bx + (bx / len) * displacement,
            by + (by / len) * displacement,
            bz + (bz / len) * displacement
          );
        }
        positions.needsUpdate = true;
      }

      // Material updates
      const mat = heartRef.current.material as THREE.MeshPhysicalMaterial;
      if (mat) {
        const glowIntensity = getHeartbeatGlow(time, effectiveSpeed);
        let extraGlow = 0;
        if (extraBeatTime.current >= 0 && extraBeatTime.current < 0.3) {
          extraGlow = 0.5 * Math.sin((extraBeatTime.current / 0.3) * Math.PI);
        }
        mat.emissiveIntensity = THREE.MathUtils.lerp(
          mat.emissiveIntensity,
          (glowIntensity + extraGlow) * (isLight ? 0.6 : 1.0),
          0.15
        );
        mat.opacity = THREE.MathUtils.lerp(mat.opacity, scrollOpacity * (isLight ? 0.88 : 0.82), 0.08);
      }
    }

    // ── Glow light synced to heartbeat ──
    if (glowRef.current) {
      const glowIntensity = getHeartbeatGlow(time, effectiveSpeed);
      let extra = 0;
      if (extraBeatTime.current >= 0 && extraBeatTime.current < 0.3) {
        extra = 3 * Math.sin((extraBeatTime.current / 0.3) * Math.PI);
      }
      glowRef.current.intensity = THREE.MathUtils.lerp(
        glowRef.current.intensity,
        (isLight ? 2 : 4) * glowIntensity + extra,
        0.15
      );
    }

    // ── EKG line animation ──
    if (ekgRef.current) {
      const positions = ekgGeometry.attributes.position;
      const count = positions.count;
      const scrollOffset = time * 3 * beatSpeed;

      for (let i = 0; i < count; i++) {
        const t = i / count;
        const x = (t - 0.5) * ekgWidth;

        // Shift the waveform pattern over time
        const cycle = ((t + scrollOffset * 0.08) * 2) % 1;
        let y = 0;

        if (cycle > 0.35 && cycle < 0.38) y = 0.15;
        else if (cycle > 0.40 && cycle < 0.42) y = -0.1;
        else if (cycle > 0.42 && cycle < 0.46) y = 0.8;
        else if (cycle > 0.46 && cycle < 0.48) y = -0.2;
        else if (cycle > 0.52 && cycle < 0.58) y = 0.2;

        // Extra beat spike injection
        if (extraBeatTime.current >= 0 && extraBeatTime.current < 0.3) {
          const spikeLoc = 0.5;
          const dist = Math.abs(t - spikeLoc);
          if (dist < 0.03) {
            y += 0.6 * (1 - dist / 0.03) * Math.sin((extraBeatTime.current / 0.3) * Math.PI);
          }
        }

        positions.setXYZ(i, x, y, 0);
      }
      positions.needsUpdate = true;

      // Position EKG below the heart
      ekgRef.current.position.y = -scale * 1.3;
      ekgRef.current.position.z = 0.5;

      // Fade with scroll
      ekgMaterial.opacity = 0.7 * (1 - scrollProgress * 0.8);
    }
  });

  return (
    <group>
      {/* Lighting */}
      <ambientLight intensity={isLight ? 1.5 : 0.8} />
      <directionalLight
        position={[3, 5, 5]}
        intensity={isLight ? 1.5 : 1.0}
        color={isLight ? '#FFF5EE' : '#F5F0F1'}
      />
      <directionalLight
        position={[-3, -2, 2]}
        intensity={0.6}
        color={isLight ? '#D4736C' : '#E8918B'}
      />

      {/* Heart core glow */}
      <pointLight
        ref={glowRef}
        position={[0, 0, 1]}
        color={isLight ? '#D4736C' : '#E8918B'}
        intensity={isLight ? 2 : 4}
        distance={scale * 4}
        decay={2}
      />

      {/* The Heart */}
      <mesh ref={heartRef} geometry={heartGeometry} scale={scale} rotation={[0, 0, Math.PI]}>
        <meshPhysicalMaterial
          color={heartColor}
          emissive={glowColor}
          emissiveIntensity={0.4}
          transparent
          opacity={isLight ? 0.88 : 0.82}
          roughness={0.15}
          metalness={0.05}
          transmission={0.6}
          thickness={2.0}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* EKG Line */}
      <primitive object={new THREE.Line(ekgGeometry, ekgMaterial)} ref={ekgRef} />

      {/* Soft shadow/glow beneath */}
      <mesh position={[0, -scale * 1.5, -0.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[scale * 1.2, 32]} />
        <meshBasicMaterial
          color={isLight ? '#D4736C' : '#E8918B'}
          transparent
          opacity={isLight ? 0.05 : 0.08}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};
