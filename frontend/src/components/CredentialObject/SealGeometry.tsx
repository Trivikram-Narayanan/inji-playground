import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { CredentialState } from '../../types/flow';

interface SealGeometryProps {
  state: CredentialState;
}

/**
 * Section 05/06: Embedded cryptographic geometry and authentication seal.
 * Forms procedurally around credential upon issuance and verdict.
 */
export const SealGeometry: React.FC<SealGeometryProps> = ({ state }) => {
  const outerRingRef = useRef<THREE.Mesh>(null);
  const innerHexRef = useRef<THREE.LineSegments>(null);
  const coreRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (outerRingRef.current) {
      const speed = state === 'transit' ? 1.5 : state === 'sealed' ? 0.6 : 0.2;
      outerRingRef.current.rotation.z += delta * speed;
    }
    if (innerHexRef.current) {
      innerHexRef.current.rotation.z -= delta * 0.4;
    }
  });

  const getSealColor = () => {
    switch (state) {
      case 'sealed':
        return '#C9A24B'; // SealGold authentication
      case 'verified':
        return '#3FCC8F'; // Verified green
      case 'rejected':
        return '#E4574F'; // Restrained red
      case 'transit':
        return '#5B7FFF'; // Accent transit
      case 'pending':
        return '#D8A63D'; // Pending amber
      case 'blank':
      default:
        return '#3A4352'; // Restrained neutral
    }
  };

  const sealColor = getSealColor();
  const visible = state !== 'blank';

  return (
    <group position={[0, 0, 0.08]} visible={visible}>
      {/* Outer seal ring */}
      <mesh ref={outerRingRef}>
        <ringGeometry args={[0.42, 0.45, 64]} />
        <meshBasicMaterial
          color={sealColor}
          transparent
          opacity={state === 'blank' ? 0.2 : 0.85}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Embedded geometric protocol ticks */}
      <mesh>
        <ringGeometry args={[0.35, 0.36, 12]} />
        <meshBasicMaterial
          color={sealColor}
          transparent
          opacity={0.5}
          wireframe
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Core cryptographic node */}
      <mesh ref={coreRef}>
        <circleGeometry args={[0.08, 32]} />
        <meshBasicMaterial
          color={sealColor}
          transparent
          opacity={state === 'sealed' || state === 'verified' ? 0.95 : 0.4}
        />
      </mesh>
    </group>
  );
};
