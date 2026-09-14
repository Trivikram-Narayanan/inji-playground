import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

export type Credential3DState = 'blank' | 'sealed' | 'transit' | 'verified' | 'rejected' | 'expired';

interface CredentialCard3DProps {
  state?: Credential3DState;
  format?: string;
  className?: string;
}

function CardMesh({ state = 'blank' }: { state: Credential3DState; format?: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.PointLight>(null);

  // Dynamic color grading based on credential state aligned with token palette
  const stateColor = React.useMemo(() => {
    switch (state) {
      case 'verified':
        return { emissive: '#3FCC8F', color: '#09291B', light: '#3FCC8F', intensity: 1.8 };
      case 'rejected':
        return { emissive: '#E4574F', color: '#2B0E0C', light: '#E4574F', intensity: 2.0 };
      case 'expired':
        return { emissive: '#D8A63D', color: '#2E2007', light: '#D8A63D', intensity: 1.6 };
      case 'transit':
        return { emissive: '#5B7FFF', color: '#10172A', light: '#5B7FFF', intensity: 1.5 };
      case 'sealed':
        return { emissive: '#C9A24B', color: '#1F190B', light: '#C9A24B', intensity: 1.5 };
      case 'blank':
      default:
        return { emissive: '#242A33', color: '#101318', light: '#5B7FFF', intensity: 0.8 };
    }
  }, [state]);

  useFrame((_, delta) => {
    if (meshRef.current) {
      // Gentle idle tilting
      meshRef.current.rotation.y += delta * 0.35;
      meshRef.current.rotation.x = Math.sin(Date.now() * 0.001) * 0.08;
    }
  });

  return (
    <group>
      <pointLight
        ref={glowRef}
        position={[0, 0, 1.8]}
        color={stateColor.light}
        intensity={stateColor.intensity}
        distance={6}
      />
      <Float speed={1.8} rotationIntensity={0.3} floatIntensity={0.5}>
        <mesh ref={meshRef}>
          <RoundedBox args={[3.2, 2.0, 0.12]} radius={0.08} smoothness={4}>
            <meshPhysicalMaterial
              color={stateColor.color}
              emissive={stateColor.emissive}
              emissiveIntensity={state === 'blank' ? 0.2 : 0.65}
              roughness={0.2}
              metalness={0.7}
              clearcoat={0.9}
              clearcoatRoughness={0.1}
              transparent
              opacity={0.92}
            />
          </RoundedBox>

          {/* Core Chip / Holographic Emblem */}
          <mesh position={[-1.0, 0.4, 0.08]}>
            <planeGeometry args={[0.6, 0.5]} />
            <meshStandardMaterial
              color="#fbbf24"
              metalness={0.95}
              roughness={0.25}
              emissive="#d97706"
              emissiveIntensity={0.3}
            />
          </mesh>

          {/* Digital Guilloche / Seal Accent Line */}
          <mesh position={[0.4, -0.45, 0.08]}>
            <planeGeometry args={[1.8, 0.06]} />
            <meshBasicMaterial color={stateColor.light} />
          </mesh>
          <mesh position={[0.4, -0.65, 0.08]}>
            <planeGeometry args={[1.4, 0.04]} />
            <meshBasicMaterial color={stateColor.light} transparent opacity={0.6} />
          </mesh>
        </mesh>
      </Float>
    </group>
  );
}

export const CredentialCard3D: React.FC<CredentialCard3DProps> = ({ state = 'blank', format, className = '' }) => {
  return (
    <div className={`relative w-full h-full min-h-[280px] select-none ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 4.5], fov: 42 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} />
        <directionalLight position={[-5, -5, -3]} intensity={0.4} color="#6366f1" />
        <CardMesh state={state} format={format} />
      </Canvas>
    </div>
  );
};

export default CredentialCard3D;
