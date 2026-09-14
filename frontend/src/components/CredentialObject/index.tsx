import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import type { CredentialState } from '../../types/flow';
import { CredentialMesh } from './CredentialMesh';
import { EnvironmentScene } from './EnvironmentScene';

interface CredentialObjectProps {
  state: CredentialState;
  format?: string;
  className?: string;
}

class WebGLErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.warn('WebGL Rendering Encountered Issue, switching to fallback:', error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

/**
 * Section 04/05/10: Sophisticated Credential Object 3D Scene.
 * Configured with solid background color for realistic glass refraction,
 * dpr clamping [1, 1.5] for high performance, and graceful fallback.
 */
export const CredentialObject: React.FC<CredentialObjectProps> = ({
  state,
  format = 'w3c-vc-jsonld',
  className = 'w-full h-full min-h-[360px]',
}) => {
  const fallback = (
    <div className="w-full h-full flex flex-col items-center justify-center border border-line bg-panel p-8 text-center">
      <div className="w-16 h-10 border border-inkDim/40 mb-3 flex items-center justify-center font-mono text-[10px] text-inkDim">
        VC
      </div>
      <p className="font-ui text-xs text-inkDim uppercase tracking-widest">
        Digital Credential Object
      </p>
      <span className="font-mono text-[10px] text-sealGold mt-1">STATE: {state}</span>
    </div>
  );

  return (
    <div className={`relative ${className}`}>
      <WebGLErrorBoundary fallback={fallback}>
        <Canvas
          shadows
          dpr={[1, 1.5]}
          gl={{
            alpha: false,
            antialias: true,
            powerPreference: 'high-performance',
          }}
          camera={{ position: [0, 0, 3.8], fov: 42 }}
        >
          {/* Opaque scene background essential for MeshTransmissionMaterial */}
          <color attach="background" args={['#08090C']} />

          <Suspense fallback={null}>
            <EnvironmentScene />
            <CredentialMesh state={state} format={format} />
          </Suspense>
        </Canvas>
      </WebGLErrorBoundary>
    </div>
  );
};
