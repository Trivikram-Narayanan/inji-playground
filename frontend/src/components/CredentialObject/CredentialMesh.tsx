import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshTransmissionMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { type Credential3DState } from './index';

// ─── State colour grading ─────────────────────────────────────────────────────
// Each state maps 1:1 to a real protocol event. No decorative colour changes.
const STATE_CONFIG: Record<Credential3DState, {
  transmissionColor: string;
  emissive: string;
  emissiveIntensity: number;
  roughness: number;
  ior: number;
  thickness: number;
  lightColor: string;
  lightIntensity: number;
}> = {
  blank: {
    transmissionColor: '#1e2535',
    emissive: '#3A4560',
    emissiveIntensity: 0.25,
    roughness: 0.12,
    ior: 1.4,
    thickness: 1.8,
    lightColor: '#4A5A80',
    lightIntensity: 0.8,
  },
  sealed: {
    // credential_issued — seal forms, sealGold illumination
    transmissionColor: '#2A1E08',
    emissive: '#C9A24B',
    emissiveIntensity: 0.45,
    roughness: 0.08,
    ior: 1.6,
    thickness: 2.0,
    lightColor: '#C9A24B',
    lightIntensity: 2.2,
  },
  transit: {
    // credential crossing trust boundary — directional blue tint
    transmissionColor: '#101E3A',
    emissive: '#5B7FFF',
    emissiveIntensity: 0.35,
    roughness: 0.1,
    ior: 1.5,
    thickness: 1.6,
    lightColor: '#5B7FFF',
    lightIntensity: 1.8,
  },
  verified: {
    // verification_result: valid — clean green resolution
    transmissionColor: '#0A2A18',
    emissive: '#3FCC8F',
    emissiveIntensity: 0.5,
    roughness: 0.05,
    ior: 1.7,
    thickness: 2.2,
    lightColor: '#3FCC8F',
    lightIntensity: 2.5,
  },
  rejected: {
    // Rejection: NOT a giant red glow — fractured/misaligned feel
    transmissionColor: '#2A0E0C',
    emissive: '#E4574F',
    emissiveIntensity: 0.25,
    roughness: 0.35,
    ior: 1.2,
    thickness: 0.8,
    lightColor: '#E4574F',
    lightIntensity: 1.0,
  },
  expired: {
    // expired — desaturated amber, low energy
    transmissionColor: '#251A07',
    emissive: '#D8A63D',
    emissiveIntensity: 0.2,
    roughness: 0.28,
    ior: 1.35,
    thickness: 0.9,
    lightColor: '#D8A63D',
    lightIntensity: 0.9,
  },
};

// ─── Precision slab geometry ──────────────────────────────────────────────────
// Custom Shape with subtle bevels — NOT a RoundedBox / credit card
function createSlabGeometry(): THREE.ExtrudeGeometry {
  const w = 2.8;
  const h = 1.75;
  const bevel = 0.04;

  const shape = new THREE.Shape();
  shape.moveTo(-w / 2 + bevel, -h / 2);
  shape.lineTo(w / 2 - bevel, -h / 2);
  shape.lineTo(w / 2, -h / 2 + bevel);
  shape.lineTo(w / 2, h / 2 - bevel);
  shape.lineTo(w / 2 - bevel, h / 2);
  shape.lineTo(-w / 2 + bevel, h / 2);
  shape.lineTo(-w / 2, h / 2 - bevel);
  shape.lineTo(-w / 2, -h / 2 + bevel);
  shape.closePath();

  return new THREE.ExtrudeGeometry(shape, {
    depth: 0.09,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.012,
    bevelSegments: 3,
  });
}

// ─── Procedural guilloche lines on the surface ───────────────────────────────
function GuillochePlane({ state }: { state: Credential3DState }) {
  const color = STATE_CONFIG[state].lightColor;
  const alpha = state === 'blank' ? 0.08 : 0.18;

  return (
    <group position={[0.05, 0.0, 0.06]}>
      {[0, 0.12, 0.24].map((offset, i) => (
        <mesh key={i} position={[0, -0.45 + offset, 0]}>
          <planeGeometry args={[1.6 - i * 0.3, 0.012]} />
          <meshBasicMaterial color={color} transparent opacity={alpha - i * 0.03} />
        </mesh>
      ))}
      {/* Chip element */}
      <mesh position={[-0.88, 0.36, 0]}>
        <planeGeometry args={[0.52, 0.38]} />
        <meshStandardMaterial
          color={state === 'blank' ? '#2a3040' : '#C9A24B'}
          metalness={0.98}
          roughness={0.22}
          emissive={state === 'blank' ? '#171B22' : '#C9A24B'}
          emissiveIntensity={state === 'blank' ? 0.05 : 0.35}
        />
      </mesh>
    </group>
  );
}

// ─── Main credential mesh ─────────────────────────────────────────────────────
interface CredentialMeshProps {
  state: Credential3DState;
}

const CredentialMesh: React.FC<CredentialMeshProps> = ({ state }) => {
  const groupRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const matRef = useRef<any>(null);

  const config = STATE_CONFIG[state];
  const slabGeo = useMemo(() => createSlabGeometry(), []);

  // Centre the extruded geometry (ExtrudeGeometry isn't centred by default)
  useMemo(() => {
    slabGeo.center();
  }, [slabGeo]);

  useFrame(({ camera }, delta) => {
    if (!groupRef.current) return;

    // Idle rotation — slower and more deliberate than a credit card spin
    const baseSpeed = state === 'transit' ? 0.45 : 0.18;
    groupRef.current.rotation.y += delta * baseSpeed;

    // Subtle breathing motion — not bounce
    const breathe = Math.sin(Date.now() * 0.0008) * 0.04;
    groupRef.current.position.y = breathe;

    // Transit: slight forward tilt — object moving toward viewer
    const targetRotX = state === 'transit' ? -0.08 : 0.0;
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x, targetRotX, delta * 2
    );

    // Rejected: subtle oscillation — misalignment
    if (state === 'rejected') {
      groupRef.current.rotation.z = Math.sin(Date.now() * 0.004) * 0.025;
    } else {
      groupRef.current.rotation.z = THREE.MathUtils.lerp(
        groupRef.current.rotation.z, 0, delta * 3
      );
    }

    // Camera push during sealed moment (seal stamp technique)
    const targetCamZ = state === 'sealed' ? 3.4 : 4.2;
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetCamZ, delta * 2);

    // Light intensity lerp
    if (lightRef.current) {
      lightRef.current.intensity = THREE.MathUtils.lerp(
        lightRef.current.intensity,
        config.lightIntensity,
        delta * 3
      );
    }
  });

  return (
    <group ref={groupRef}>
      {/* Primary point light — state-driven */}
      <pointLight
        ref={lightRef}
        position={[0, 0.5, 1.6]}
        color={config.lightColor}
        intensity={config.lightIntensity}
        distance={8}
        decay={2}
      />

      {/* The slab — transmission material for glass/resin look */}
      <mesh geometry={slabGeo} castShadow receiveShadow>
        <MeshTransmissionMaterial
          ref={matRef}
          color={config.transmissionColor}
          emissive={config.emissive}
          emissiveIntensity={config.emissiveIntensity}
          roughness={config.roughness}
          ior={config.ior}
          thickness={config.thickness}
          transmission={0.72}
          chromaticAberration={0.02}
          anisotropy={0.15}
          distortionScale={0.05}
          temporalDistortion={0.015}
          attenuationDistance={1.5}
          attenuationColor={config.emissive}
          transparent={false}
          samples={4}
        />
      </mesh>

      {/* Surface detail layer */}
      <GuillochePlane state={state} />
    </group>
  );
};

export default CredentialMesh;
