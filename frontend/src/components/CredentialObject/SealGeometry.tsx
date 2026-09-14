import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { type Credential3DState } from './index';

/**
 * SealGeometry — procedural seal ring + inner disc.
 * Appears strictly on credential_issued (sealed/transit/verified/rejected states).
 * Scale lerps from 0 → 1 to create a physical stamp effect.
 * This is one of the two major cinematic moments.
 */

interface SealGeometryProps {
  state: Credential3DState;
}

const SealGeometry: React.FC<SealGeometryProps> = ({ state }) => {
  const outerRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const ticksGroupRef = useRef<THREE.Group>(null);

  const isSealVisible = state !== 'blank';

  // State-driven seal colour
  const sealColor =
    state === 'verified'
      ? '#3FCC8F'
      : state === 'rejected'
      ? '#E4574F'
      : state === 'expired'
      ? '#D8A63D'
      : '#C9A24B'; // sealed / transit → sealGold

  useFrame((_, delta) => {
    const target = isSealVisible ? 1 : 0.001;
    const speed = isSealVisible ? 5 : 8;

    if (outerRef.current) {
      outerRef.current.scale.lerp(
        new THREE.Vector3(target, target, target),
        delta * speed
      );
      // Rejected: slight rotation mismatch — seal looks fractured
      if (state === 'rejected') {
        outerRef.current.rotation.z += delta * 0.3;
      }
    }
    if (innerRef.current) {
      const innerTarget = isSealVisible ? 0.85 : 0.001;
      innerRef.current.scale.lerp(
        new THREE.Vector3(innerTarget, innerTarget, innerTarget),
        delta * (speed * 0.7)
      );
    }
    if (ticksGroupRef.current) {
      const tickTarget = isSealVisible ? 1 : 0.001;
      ticksGroupRef.current.scale.lerp(
        new THREE.Vector3(tickTarget, tickTarget, tickTarget),
        delta * (speed * 0.5)
      );
    }
  });

  // Generate 24 tick marks around the seal ring
  const ticks = Array.from({ length: 24 }, (_, i) => {
    const angle = (i / 24) * Math.PI * 2;
    const r = 0.32;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    const isMajor = i % 6 === 0;
    return { x, y, angle, isMajor };
  });

  return (
    // Position on the front face of the slab, bottom-right quadrant
    <group position={[0.82, -0.28, 0.075]}>
      {/* Outer ring */}
      <mesh ref={outerRef} scale={0.001}>
        <ringGeometry args={[0.28, 0.34, 64]} />
        <meshBasicMaterial color={sealColor} transparent opacity={0.85} />
      </mesh>

      {/* Inner disc */}
      <mesh ref={innerRef} scale={0.001}>
        <circleGeometry args={[0.25, 64]} />
        <meshBasicMaterial color={sealColor} transparent opacity={0.06} />
      </mesh>

      {/* Tick marks */}
      <group ref={ticksGroupRef} scale={0.001}>
        {ticks.map((tick, i) => (
          <mesh
            key={i}
            position={[tick.x, tick.y, 0]}
            rotation={[0, 0, tick.angle]}
          >
            <planeGeometry args={[tick.isMajor ? 0.055 : 0.03, 0.008]} />
            <meshBasicMaterial
              color={sealColor}
              transparent
              opacity={tick.isMajor ? 0.9 : 0.4}
            />
          </mesh>
        ))}
      </group>

      {/* Central dot */}
      <mesh position={[0, 0, 0.001]} scale={isSealVisible ? 1 : 0.001}>
        <circleGeometry args={[0.04, 32]} />
        <meshBasicMaterial color={sealColor} transparent opacity={0.9} />
      </mesh>
    </group>
  );
};

export default SealGeometry;
