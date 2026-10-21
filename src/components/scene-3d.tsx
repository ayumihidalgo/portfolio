'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

/* Tracks normalized page scroll (0–1) so the scene can drift with it. */
function useScrollProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        setProgress(max > 0 ? window.scrollY / max : 0);
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);
  return progress;
}

/* Tracks mouse position in normalized device coordinates for parallax. */
function useMouseNDC() {
  const pos = useRef({ x: 0, y: 0 });
  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    const onMove = (e: MouseEvent) => {
      pos.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pos.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);
  return pos;
}

type ShapeKind = 'ico' | 'torus' | 'octa';

function FloatingBlob({
  position,
  color,
  speed,
  scale,
  shape,
  mouse,
}: {
  position: [number, number, number];
  color: string;
  speed: number;
  scale: number;
  shape: ShapeKind;
  mouse: React.MutableRefObject<{ x: number; y: number }>;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime();
    ref.current.rotation.x = t * speed * 0.15 + mouse.current.y * 0.25;
    ref.current.rotation.y = t * speed * 0.2 + mouse.current.x * 0.35;
    ref.current.position.y = position[1] + Math.sin(t * speed) * 0.4;
    ref.current.position.x = position[0] + mouse.current.x * 0.3;
  });

  const material = (
    <MeshDistortMaterial
      color={color}
      distort={0.45}
      speed={1.6}
      roughness={0.1}
      metalness={0.1}
      transparent
      opacity={0.42}
      blending={THREE.AdditiveBlending}
      depthWrite={false}
    />
  );

  if (shape === 'torus') {
    return (
      <mesh ref={ref} position={position} scale={scale}>
        <torusGeometry args={[1, 0.38, 32, 100]} />
        {material}
      </mesh>
    );
  }
  if (shape === 'octa') {
    return (
      <mesh ref={ref} position={position} scale={scale}>
        <octahedronGeometry args={[1, 2]} />
        {material}
      </mesh>
    );
  }
  return (
    <mesh ref={ref} position={position} scale={scale}>
      <icosahedronGeometry args={[1, 4]} />
      {material}
    </mesh>
  );
}

function ParticleField() {
  const ref = useRef<THREE.Points>(null);
  const count = 900;
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 26;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 44 - 6;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 14 - 4;
    }
    return arr;
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.getElapsedTime() * 0.015;
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#a78bfa"
        size={0.032}
        sizeAttenuation
        depthWrite={false}
        opacity={0.55}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

function Rig({
  scrollProgress,
  mouse,
}: {
  scrollProgress: number;
  mouse: React.MutableRefObject<{ x: number; y: number }>;
}) {
  useFrame((state) => {
    const targetY = -scrollProgress * 30;
    state.camera.position.y += (targetY - state.camera.position.y) * 0.08;
    state.camera.position.x += (mouse.current.x * 0.9 - state.camera.position.x) * 0.03;
    state.camera.rotation.z += (mouse.current.x * -0.025 - state.camera.rotation.z) * 0.03;
    state.camera.lookAt(0, state.camera.position.y, 0);
  });
  return null;
}

export default function Scene3D() {
  const scrollProgress = useScrollProgress();
  const mouse = useMouseNDC();

  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 8], fov: 50 }}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        onCreated={({ gl, scene }) => {
          gl.setClearColor(0x000000, 0);
          scene.background = null;
          scene.fog = new THREE.Fog(0x05070d, 12, 34);
        }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[5, 5, 5]} intensity={1.4} color="#8b5cf6" />
        <pointLight position={[-5, -3, 5]} intensity={1.1} color="#22d3ee" />

        <Rig scrollProgress={scrollProgress} mouse={mouse} />

        <FloatingBlob position={[3, -1, -2]} color="#8b5cf6" speed={0.4} scale={1.7} shape="ico" mouse={mouse} />
        <FloatingBlob position={[-3.5, -9, -3]} color="#22d3ee" speed={0.3} scale={1.3} shape="torus" mouse={mouse} />
        <FloatingBlob position={[2.5, -18, -3]} color="#f472b6" speed={0.5} scale={1.5} shape="octa" mouse={mouse} />
        <FloatingBlob position={[-3, -27, -3]} color="#8b5cf6" speed={0.35} scale={1.2} shape="ico" mouse={mouse} />

        <ParticleField />
      </Canvas>
    </div>
  );
}
