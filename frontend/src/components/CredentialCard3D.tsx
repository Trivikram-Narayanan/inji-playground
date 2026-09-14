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

function CardMesh({ state = 'blank', format: _format }: { state: Credential3DState; format?: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.PointLight>(null);
  const sealMeshRef = useRef<THREE.Mesh>(null);

  // Dynamic color grading based on credential state aligned with token palette
  // 1:1 correspondence to protocol verification lifecycle
  const stateColor = React.useMemo(() => {
    switch (state) {
      case 'verified':
        return { emissive: '#3FCC8F', color: '#071F14', light: '#3FCC8F', intensity: 2.2, sealColor: '#3FCC8F' };
      case 'rejected':
        return { emissive: '#E4574F', color: '#240B0A', light: '#E4574F', intensity: 2.2, sealColor: '#E4574F' };
      case 'expired':
        return { emissive: '#D8A63D', color: '#241804', light: '#D8A63D', intensity: 1.8, sealColor: '#D8A63D' };
      case 'transit':
        return { emissive: '#5B7FFF', color: '#0C1322', light: '#5B7FFF', intensity: 1.6, sealColor: '#C9A24B' };
      case 'sealed':
        return { emissive: '#C9A24B', color: '#1B1407', light: '#C9A24B', intensity: 2.0, sealColor: '#C9A24B' };
      case 'blank':
      default:
        return { emissive: '#171B22', color: '#0B0D11', light: '#242A33', intensity: 0.4, sealColor: '#242A33' };
    }
  }, [state]);

  const isSealedOrBeyond = state !== 'blank';

  useFrame(({ camera }, delta) => {
    if (meshRef.current) {
      // Idle rotation - tilts slightly more during transit to show movement toward verifier
      const rotSpeed = state === 'transit' ? 0.6 : 0.25;
      meshRef.current.rotation.y += delta * rotSpeed;
      meshRef.current.rotation.x = Math.sin(Date.now() * 0.001) * 0.06;

      // Transit posture: slight forward pitch
      if (state === 'transit') {
        meshRef.current.rotation.z = Math.sin(Date.now() * 0.0015) * 0.05;
      } else {
        meshRef.current.rotation.z = 0;
      }
    }

    // GQ × Audemars Piguet technique: camera centers and subtly pushes in during the ceremonial seal moment
    const targetZ = state === 'sealed' ? 3.7 : 4.4;
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, delta * 2.5);

    // Physical seal stamp scale-in upon issuance
    if (sealMeshRef.current) {
      const targetScale = isSealedOrBeyond ? 1 : 0.001;
      sealMeshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 5);
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
      <Float speed={state === 'transit' ? 2.5 : 1.4} rotationIntensity={0.2} floatIntensity={0.4}>
        <mesh ref={meshRef}>
          <RoundedBox args={[3.2, 2.0, 0.12]} radius={0.08} smoothness={4}>
            <meshPhysicalMaterial
              color={stateColor.color}
              emissive={stateColor.emissive}
              emissiveIntensity={state === 'blank' ? 0.1 : 0.7}
              roughness={0.2}
              metalness={0.75}
              clearcoat={0.9}
              clearcoatRoughness={0.1}
              transparent
              opacity={0.94}
            />
          </RoundedBox>

          {/* Core Chip / Holographic Cryptographic Secure Element */}
          <mesh position={[-1.0, 0.4, 0.08]}>
            <planeGeometry args={[0.6, 0.5]} />
            <meshStandardMaterial
              color={state === 'blank' ? '#333A44' : '#C9A24B'}
              metalness={0.95}
              roughness={0.25}
              emissive={state === 'blank' ? '#171B22' : '#C9A24B'}
              emissiveIntensity={state === 'blank' ? 0.1 : 0.4}
            />
          </mesh>

          {/* Signature Seal Stamp: Appears strictly upon credential_issued (Worldcoin / Audemars Piguet technique) */}
          <mesh ref={sealMeshRef} position={[0.9, -0.3, 0.08]} scale={0.001}>
            <ringGeometry args={[0.26, 0.36, 32]} />
            <meshBasicMaterial color={stateColor.sealColor} transparent opacity={0.9} />
          </mesh>

          {/* Micro-inscribed Guilloche Linework */}
          <mesh position={[0.1, -0.45, 0.07]}>
            <planeGeometry args={[1.2, 0.02]} />
            <meshBasicMaterial color={stateColor.light} transparent opacity={0.4} />
          </mesh>
          <mesh position={[0.1, -0.55, 0.07]}>
            <planeGeometry args={[0.9, 0.02]} />
            <meshBasicMaterial color={stateColor.light} transparent opacity={0.3} />
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
        camera={{ position: [0, 0, 4.4], fov: 42 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1.0} />
        <directionalLight position={[-5, -5, -3]} intensity={0.3} color="#242A33" />
        <CardMesh state={state} format={format} />
      </Canvas>
    </div>
  );
};

export default CredentialCard3D;
