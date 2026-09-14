import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { type Credential3DState } from './index';

/**
 * EnvironmentScene — subtle depth planes, thin boundary markers,
 * and controlled shadow surface. Not a sci-fi scene.
 * The credential should feel like a specimen under examination.
 */

interface EnvironmentSceneProps {
  state: Credential3DState;
}

const EnvironmentScene: React.FC<EnvironmentSceneProps> = ({ state }) => {
  const shadowPlaneRef = useRef<THREE.Mesh>(null);
  const boundaryRef = useRef<THREE.Group>(null);

  // Show boundary markers only in transit state
  const showBoundary = state === 'transit';

  useFrame((_, delta) => {
    if (boundaryRef.current) {
      const target = showBoundary ? 1 : 0;
      boundaryRef.current.children.forEach(child => {
        (child as THREE.Mesh).material &&
          ((child as THREE.Mesh).material as THREE.MeshBasicMaterial).color &&
          (((child as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = THREE.MathUtils.lerp(
            ((child as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity,
            target * 0.35,
            delta * 2
          ));
      });
    }
  });

  return (
    <>
      {/* Ambient fill light — enough to show the slab form */}
      <ambientLight intensity={0.4} color="#8899BB" />

      {/* Key directional light — top-right angle, strong enough to catch the bevels */}
      <directionalLight
        position={[4, 6, 4]}
        intensity={1.4}
        color="#FFFFFF"
        castShadow
        shadow-mapSize={[512, 512]}
        shadow-camera-near={0.1}
        shadow-camera-far={20}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
      />

      {/* Rim light — left, cold blue */}
      <directionalLight
        position={[-5, 2, -3]}
        intensity={0.5}
        color="#3A5A9A"
      />

      {/* Shadow receiver — subtle ground plane */}
      <mesh
        ref={shadowPlaneRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.6, 0]}
        receiveShadow
      >
        <planeGeometry args={[12, 12]} />
        <shadowMaterial opacity={0.12} />
      </mesh>

      {/* Depth planes — very faint architectural elements */}
      <mesh position={[0, 0, -2.5]} rotation={[0, 0, 0]}>
        <planeGeometry args={[8, 5]} />
        <meshBasicMaterial color="#0a0d12" transparent opacity={0.6} />
      </mesh>

      {/* Transit boundary markers — thin lines that appear when state is transit */}
      <group ref={boundaryRef}>
        {/* Left boundary line */}
        <mesh position={[-3.2, 0, -1.8]} rotation={[0, 0, 0]}>
          <planeGeometry args={[0.008, 4]} />
          <meshBasicMaterial color="#5B7FFF" transparent opacity={0} />
        </mesh>
        {/* Right boundary line */}
        <mesh position={[3.2, 0, -1.8]} rotation={[0, 0, 0]}>
          <planeGeometry args={[0.008, 4]} />
          <meshBasicMaterial color="#5B7FFF" transparent opacity={0} />
        </mesh>
        {/* Horizontal boundary sweep */}
        <mesh position={[0, -1.2, -1.5]} rotation={[0, 0, 0]}>
          <planeGeometry args={[7, 0.006]} />
          <meshBasicMaterial color="#5B7FFF" transparent opacity={0} />
        </mesh>
      </group>
    </>
  );
};

export default EnvironmentScene;
