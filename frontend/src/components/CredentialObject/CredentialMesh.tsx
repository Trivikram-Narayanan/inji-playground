import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshTransmissionMaterial } from '@react-three/drei';
import * as THREE from 'three';
import type { CredentialState } from '../../types/flow';
import { SealGeometry } from './SealGeometry';

interface CredentialMeshProps {
  state: CredentialState;
  format?: string;
}

/**
 * Section 05: Sophisticated physical representation of a digital credential.
 * Precision-machined translucent slab with layered internal cryptographic structure,
 * internal refraction, bevels, and protocol markings.
 */
export const CredentialMesh: React.FC<CredentialMeshProps> = ({
  state,
  format: _format = 'w3c-vc-jsonld',
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const targetRotY = useRef(0);
  const targetPosX = useRef(0);

  // Generate precision rounded-slab geometry
  const slabGeometry = useMemo(() => {
    const width = 2.4;
    const height = 1.5;
    const radius = 0.08;
    const shape = new THREE.Shape();
    const x = -width / 2;
    const y = -height / 2;

    shape.moveTo(x + radius, y);
    shape.lineTo(x + width - radius, y);
    shape.quadraticCurveTo(x + width, y, x + width, y + radius);
    shape.lineTo(x + width, y + height - radius);
    shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    shape.lineTo(x + radius, y + height);
    shape.quadraticCurveTo(x, y + height, x, y + height - radius);
    shape.lineTo(x, y + radius);
    shape.quadraticCurveTo(x, y, x + radius, y);

    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.12,
      bevelEnabled: true,
      bevelSegments: 6,
      steps: 1,
      bevelSize: 0.03,
      bevelThickness: 0.03,
    });
  }, []);

  // Material and lighting configuration based on actual protocol state
  const materialProps = useMemo(() => {
    switch (state) {
      case 'sealed':
        return {
          color: '#1a1f2c',
          transmission: 0.75,
          roughness: 0.15,
          ior: 1.45,
          chromaticAberration: 0.04,
          attenuationColor: '#C9A24B',
          attenuationDistance: 0.8,
        };
      case 'transit':
        return {
          color: '#121828',
          transmission: 0.7,
          roughness: 0.2,
          ior: 1.5,
          chromaticAberration: 0.08,
          attenuationColor: '#5B7FFF',
          attenuationDistance: 0.6,
        };
      case 'verified':
        return {
          color: '#11221c',
          transmission: 0.8,
          roughness: 0.1,
          ior: 1.4,
          chromaticAberration: 0.02,
          attenuationColor: '#3FCC8F',
          attenuationDistance: 1.0,
        };
      case 'rejected':
        return {
          color: '#281313',
          transmission: 0.6,
          roughness: 0.35,
          ior: 1.55,
          chromaticAberration: 0.12,
          attenuationColor: '#E4574F',
          attenuationDistance: 0.4,
        };
      case 'pending':
        return {
          color: '#221c13',
          transmission: 0.65,
          roughness: 0.25,
          ior: 1.45,
          chromaticAberration: 0.05,
          attenuationColor: '#D8A63D',
          attenuationDistance: 0.5,
        };
      case 'blank':
      default:
        return {
          color: '#1e2535',
          transmission: 0.72,
          roughness: 0.18,
          ior: 1.4,
          chromaticAberration: 0.03,
          attenuationColor: '#2b3548',
          attenuationDistance: 0.9,
        };
    }
  }, [state]);

  useFrame((_, _delta) => {
    if (!groupRef.current) return;

    // Movement choreographies per state
    if (state === 'transit') {
      targetPosX.current = THREE.MathUtils.lerp(targetPosX.current, 0.4, 0.04);
      targetRotY.current = Math.sin(Date.now() * 0.002) * 0.18 + 0.15;
    } else if (state === 'verified') {
      targetPosX.current = THREE.MathUtils.lerp(targetPosX.current, 0, 0.08);
      targetRotY.current = THREE.MathUtils.lerp(targetRotY.current, 0, 0.08);
    } else if (state === 'rejected') {
      targetPosX.current = THREE.MathUtils.lerp(targetPosX.current, -0.15, 0.08);
      targetRotY.current = THREE.MathUtils.lerp(targetRotY.current, -0.2, 0.08);
    } else {
      // Gentle floating attitude
      targetPosX.current = THREE.MathUtils.lerp(targetPosX.current, 0, 0.05);
      targetRotY.current = Math.sin(Date.now() * 0.0008) * 0.08;
    }

    groupRef.current.position.x = targetPosX.current;
    groupRef.current.position.y = Math.sin(Date.now() * 0.0012) * 0.04;
    groupRef.current.rotation.y = targetRotY.current;
    groupRef.current.rotation.x = Math.cos(Date.now() * 0.001) * 0.03;
  });

  return (
    <group ref={groupRef}>
      {/* Primary Translucent Precision Slab */}
      <mesh geometry={slabGeometry} castShadow receiveShadow>
        <MeshTransmissionMaterial
          {...materialProps}
          thickness={0.25}
          anisotropy={0.2}
          distortion={0.05}
          distortionScale={0.3}
          temporalDistortion={0.1}
          samples={8}
          resolution={512}
        />
      </mesh>

      {/* Internal Sub-surface Wireframe Structure */}
      <mesh position={[0, 0, 0.06]}>
        <planeGeometry args={[2.1, 1.25]} />
        <meshBasicMaterial
          color="#EDEFF3"
          wireframe
          transparent
          opacity={state === 'blank' ? 0.04 : 0.1}
        />
      </mesh>

      {/* Embedded Cryptographic Seal */}
      <SealGeometry state={state} />

      {/* Internal Protocol Format Tag */}
      <group position={[-0.85, -0.45, 0.07]}>
        <mesh>
          <planeGeometry args={[0.3, 0.08]} />
          <meshBasicMaterial color="#08090C" transparent opacity={0.6} />
        </mesh>
      </group>
    </group>
  );
};
