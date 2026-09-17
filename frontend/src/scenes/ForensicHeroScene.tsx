import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

interface SceneProps {
  reducedMotion?: boolean;
}

// Physical Verifiable Credential ID Card (Standard proportions: 1.6 × 1.0 × 0.05)
const CredentialCard: React.FC = () => {
  const cardGroupRef = useRef<THREE.Group>(null!);

  useFrame((state, delta) => {
    if (!cardGroupRef.current) return;
    const time = state.clock.getElapsedTime();
    // Pure continuous smooth turntable rotation + floating vertical oscillation
    const autoRotY = time * 0.45;
    const autoRotX = Math.sin(time * 0.6) * 0.12;
    const autoPosY = Math.sin(time * 1.2) * 0.06;

    cardGroupRef.current.position.y = THREE.MathUtils.damp(cardGroupRef.current.position.y, autoPosY, 3, delta);
    cardGroupRef.current.rotation.x = THREE.MathUtils.damp(cardGroupRef.current.rotation.x, autoRotX, 4, delta);
    cardGroupRef.current.rotation.y = THREE.MathUtils.damp(cardGroupRef.current.rotation.y, autoRotY, 4, delta);
  });


  return (
    <group ref={cardGroupRef} position={[0.1, 0, 0]}>
      {/* Extruded Rounded Credential Card Body */}
      <RoundedBox args={[1.7, 1.08, 0.045]} radius={0.05} smoothness={4}>
        <meshPhysicalMaterial
          color="#161920"
          metalness={0.65}
          roughness={0.35}
          clearcoat={0.3}
          clearcoatRoughness={0.2}
          reflectivity={0.6}
        />
      </RoundedBox>

      {/* Embedded Cryptographic Microchip (Golden contact bevel) */}
      <mesh position={[-0.48, 0.12, 0.026]}>
        <boxGeometry args={[0.32, 0.26, 0.008]} />
        <meshStandardMaterial
          color="#d49b38"
          emissive="#e5a93c"
          emissiveIntensity={0.35}
          metalness={0.9}
          roughness={0.2}
        />
      </mesh>

      {/* Chip Circuit Etching Lines */}
      <mesh position={[-0.48, 0.12, 0.031]}>
        <boxGeometry args={[0.26, 0.012, 0.002]} />
        <meshBasicMaterial color="#161920" />
      </mesh>
      <mesh position={[-0.48, 0.12, 0.031]}>
        <boxGeometry args={[0.012, 0.2, 0.002]} />
        <meshBasicMaterial color="#161920" />
      </mesh>

      {/* Guilloché / Security Pattern Inset Strip */}
      <mesh position={[0.2, 0.12, 0.025]}>
        <planeGeometry args={[0.85, 0.35]} />
        <meshStandardMaterial
          color="#1c202a"
          metalness={0.4}
          roughness={0.6}
          wireframe={true}
        />
      </mesh>

      {/* Active Cryptographic Edge / Seal Filament (Emissive Gold) */}
      <mesh position={[0, -0.42, 0.025]}>
        <planeGeometry args={[1.5, 0.04]} />
        <meshStandardMaterial
          color="#e5a93c"
          emissive="#e5a93c"
          emissiveIntensity={0.8}
        />
      </mesh>

      {/* Monospace Micro-print Hash Line */}
      <mesh position={[0.1, -0.32, 0.025]}>
        <planeGeometry args={[1.3, 0.06]} />
        <meshStandardMaterial
          color="#2a3040"
          metalness={0.2}
          roughness={0.8}
          wireframe={true}
        />
      </mesh>

      {/* BACK OF CARD: Magnetic Data Track (Rotates 180 degrees) */}
      <mesh position={[0, 0.28, -0.025]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[1.68, 0.28]} />
        <meshStandardMaterial
          color="#0c0e12"
          metalness={0.9}
          roughness={0.15}
        />
      </mesh>

      {/* BACK OF CARD: Signature Validation Panel (Light warm strip) */}
      <mesh position={[-0.15, -0.05, -0.025]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[1.1, 0.18]} />
        <meshStandardMaterial
          color="#e2e8f0"
          roughness={0.9}
        />
      </mesh>

      {/* BACK OF CARD: 2D Barcode / Data Matrix Simulation */}
      <mesh position={[0.55, -0.05, -0.025]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[0.22, 0.18]} />
        <meshStandardMaterial
          color="#ffffff"
          wireframe={true}
        />
      </mesh>

      {/* BACK OF CARD: Cryptographic Key Text Line */}
      <mesh position={[0, -0.32, -0.025]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[1.4, 0.05]} />
        <meshStandardMaterial
          color="#8a919e"
          metalness={0.3}
          roughness={0.7}
          wireframe={true}
        />
      </mesh>
    </group>
  );
};


// Differentiated Topology Nodes:
// Cube = Issuer (Inji Certify)
// Capsule = Wallet Holder (Inji Mobile)
// Faceted Icosahedron = Verifier (Inji Verify)
// Differentiated Topology Nodes:
// Cube = Issuer (Inji Certify)
// Capsule = Wallet Holder (Inji Mobile)
// Faceted Icosahedron = Verifier (Inji Verify)
const NetworkNodes: React.FC = () => {
  const issuerRef = useRef<THREE.Mesh>(null!);
  const walletRef = useRef<THREE.Mesh>(null!);
  const verifierRef = useRef<THREE.Mesh>(null!);

  useFrame((_, delta) => {
    if (issuerRef.current) {
      issuerRef.current.rotation.y += delta * 0.2;
    }
    if (verifierRef.current) {
      verifierRef.current.rotation.x += delta * 0.15;
      verifierRef.current.rotation.y += delta * 0.25;
    }
  });

  const linePoints = useMemo(() => {
    const p1 = new THREE.Vector3(-1.45, 0.85, -0.2);
    const p2 = new THREE.Vector3(0.0, -0.92, 0.1);
    const p3 = new THREE.Vector3(1.45, 0.78, -0.2);
    return new THREE.BufferGeometry().setFromPoints([p1, p2, p3]);
  }, []);

  const lineObject = useMemo(() => {
    const mat = new THREE.LineDashedMaterial({
      color: '#8a919e',
      dashSize: 0.1,
      gapSize: 0.05,
      transparent: true,
      opacity: 0.45,
    });
    const line = new THREE.Line(linePoints, mat);
    line.computeLineDistances();
    return line;
  }, [linePoints]);

  return (
    <>
      <primitive object={lineObject} />

      {/* Issuer Node (Sharp Metallic Cube) */}
      <mesh ref={issuerRef} position={[-1.45, 0.85, -0.2]}>
        <boxGeometry args={[0.26, 0.26, 0.26]} />
        <meshStandardMaterial color="#8a919e" metalness={0.8} roughness={0.25} />
      </mesh>

      {/* Wallet Holder (Engineered Capsule) */}
      <mesh ref={walletRef} position={[0.0, -0.92, 0.1]} rotation={[0, 0, Math.PI / 4]}>
        <cylinderGeometry args={[0.13, 0.13, 0.32, 16]} />
        <meshStandardMaterial
          color="#d49b38"
          emissive="#e5a93c"
          emissiveIntensity={0.2}
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>

      {/* Verifier Node (Faceted Icosahedron) */}
      <mesh ref={verifierRef} position={[1.45, 0.78, -0.2]}>
        <icosahedronGeometry args={[0.2, 0]} />
        <meshStandardMaterial
          color="#d83a20"
          emissive="#ff4d2e"
          emissiveIntensity={0.2}
          metalness={0.85}
          roughness={0.15}
        />
      </mesh>
    </>
  );
};


export const ForensicHeroScene: React.FC<SceneProps> = () => {
  return (
    <div className="w-full h-full min-h-[420px] md:min-h-[520px] relative select-none pointer-events-auto">
      <Canvas
        camera={{ position: [0, 0, 3.8], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        {/* Production Studio Lighting & Rim Light */}
        <ambientLight intensity={0.55} />
        <directionalLight position={[4, 6, 4]} intensity={1.8} color="#ffffff" />
        <pointLight position={[-3, -1.5, 2.5]} intensity={1.2} color="#e5a93c" />
        <pointLight position={[3, 2, 2]} intensity={0.9} color="#ffffff" />
        <pointLight position={[0, -2, -2]} intensity={0.5} color="#8a919e" />

        <CredentialCard />
        <NetworkNodes />
      </Canvas>

      {/* Forensic HUD Corner Coordinates Overlay */}
      <div className="absolute top-2 right-2 font-mono text-[9px] text-[#535965] uppercase tracking-widest pointer-events-none">
        RENDER: R3F/GL :: PHYSICAL_VC_CARD
      </div>
      <div className="absolute bottom-2 right-2 font-mono text-[9px] text-[#535965] pointer-events-none">
        NODES: [CUBE:ISSUER] [CAPSULE:WALLET] [ICOSA:VERIFIER]
      </div>
    </div>
  );
};

export default ForensicHeroScene;
