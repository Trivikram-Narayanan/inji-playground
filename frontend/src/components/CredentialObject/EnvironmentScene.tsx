import React from 'react';
import { Environment } from '@react-three/drei';

/**
 * Section 08: Architectural spatial lighting & digital environment.
 * Provides the required IBL studio reflections for MeshTransmissionMaterial
 * and subtle floor shadows without sci-fi clutter.
 */
export const EnvironmentScene: React.FC = () => {
  return (
    <>
      {/* Studio IBL Environment for realistic transmission refraction */}
      <Environment preset="studio" environmentIntensity={0.5} />

      {/* Primary Key Light */}
      <directionalLight
        position={[4, 5, 4]}
        intensity={1.5}
        color="#EDEFF3"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.5}
        shadow-camera-far={15}
        shadow-camera-left={-2}
        shadow-camera-right={2}
        shadow-camera-top={2}
        shadow-camera-bottom={-2}
      />

      {/* Gentle Fill Light */}
      <directionalLight position={[-4, 2, -2]} intensity={0.4} color="#7C8494" />

      {/* Subtle Rim Light */}
      <spotLight
        position={[0, 4, -4]}
        intensity={0.6}
        color="#EDEFF3"
        angle={0.6}
        penumbra={0.8}
      />

      {/* Architectural ground shadow receiver */}
      <mesh position={[0, -1.2, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 12]} />
        <shadowMaterial opacity={0.35} />
      </mesh>
    </>
  );
};
