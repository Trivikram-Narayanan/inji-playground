import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Float, Environment } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import CredentialMesh from './CredentialMesh';
import SealGeometry from './SealGeometry';
import EnvironmentScene from './EnvironmentScene';

// ─── Public types ─────────────────────────────────────────────────────────────
export type Credential3DState = 'blank' | 'sealed' | 'transit' | 'verified' | 'rejected' | 'expired';

interface CredentialObjectProps {
  state?: Credential3DState;
  format?: string;
  className?: string;
}

// ─── WebGL Error Boundary ─────────────────────────────────────────────────────
class WebGLErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center">
            <div className="w-32 h-20 border border-line mx-auto mb-4 flex items-center justify-center">
              <div className="w-16 h-10 border border-inkDim/40" />
            </div>
            <p className="text-xs font-mono text-inkDim">WebGL unavailable</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Scene content ────────────────────────────────────────────────────────────
function SceneContent({ state }: { state: Credential3DState }) {
  return (
    <>
      {/* IBL environment — needed for MeshTransmissionMaterial reflections/refractions */}
      <Environment preset="studio" environmentIntensity={0.4} />

      <EnvironmentScene state={state} />

      {/* Float adds subtle bobbing — speed varies by state */}
      <Float
        speed={state === 'transit' ? 2.0 : 1.0}
        rotationIntensity={state === 'transit' ? 0.3 : 0.1}
        floatIntensity={state === 'transit' ? 0.5 : 0.3}
      >
        <CredentialMesh state={state} />
        <SealGeometry state={state} />
      </Float>

      {/* Restrained postprocessing — not a light show */}
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.85}
          intensity={state === 'sealed' || state === 'verified' ? 0.55 : 0.2}
          levels={4}
          mipmapBlur
        />
        <Vignette darkness={0.4} offset={0.3} eskil={false} />
      </EffectComposer>
    </>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
const CredentialObject: React.FC<CredentialObjectProps> = ({
  state = 'blank',
  className = '',
}) => {
  return (
    <div
      className={`relative w-full h-full min-h-[300px] select-none ${className}`}
      data-cursor="3d"
    >
      <WebGLErrorBoundary>
        <Canvas
          camera={{ position: [0, 0, 4.2], fov: 40 }}
          dpr={[1, 1.5]}
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance',
          }}
          shadows
        >
          {/* Solid background — required for MeshTransmissionMaterial to refract/transmit */}
          <color attach="background" args={['#0a0c11']} />
          <Suspense fallback={null}>
            <SceneContent state={state} />
          </Suspense>
        </Canvas>
      </WebGLErrorBoundary>
    </div>
  );
};

export default CredentialObject;
