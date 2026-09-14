import React from 'react';
import CredentialCard3D, { type Credential3DState } from './CredentialCard3D';
import MagneticButton from './MagneticButton';
import { ArrowRight, Sparkles, Layers } from 'lucide-react';

interface HeroSectionProps {
  onStartFlow: () => void;
  credentialState?: Credential3DState;
  activeFormat?: string;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onStartFlow,
  credentialState = 'blank',
  activeFormat = 'W3C VC (JSON-LD)',
}) => {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-b from-panel via-void to-void p-8 lg:p-12 mb-8 shadow-2xl backdrop-blur-xl">
      {/* Background Subtle Radial Glow */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[650px] h-[350px] bg-accent/10 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 right-10 w-[400px] h-[250px] bg-sealGold/10 rounded-full blur-3xl" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Editorial Cinematic Typography */}
        <div className="lg:col-span-7 flex flex-col items-start gap-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-panelLit border border-line text-inkDim text-xs font-mono font-medium tracking-wide">
            <Sparkles size={13} className="text-inkDim" />
            <span>MOSIP INJI CREDENTIALING INTEROPERABILITY</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-ink font-display leading-[1.12]">
            A credential no one has to{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-ink via-ink to-sealGold italic font-display">
              trust in advance.
            </span>
          </h1>

          <p className="text-inkDim text-base lg:text-lg max-w-xl font-ui leading-relaxed">
            Simulate, stress-test, and cryptographically verify cross-module OpenID4VCI & OpenID4VP
            exchanges. Inspect raw protocol payloads across W3C JSON-LD, SD-JWT, and mDoc.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <MagneticButton
              onClick={onStartFlow}
              className="px-7 py-3.5 bg-accent hover:bg-accent/90 text-white font-medium rounded-xl text-sm shadow-[0_0_20px_rgba(91,127,255,0.25)] transition-all flex items-center gap-2 group cursor-pointer"
            >
              <span>Begin the exchange</span>
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </MagneticButton>

            <div className="flex items-center gap-2 text-xs text-inkDim border border-line bg-panelLit/80 px-3.5 py-2.5 rounded-xl font-mono">
              <Layers size={14} className="text-inkDim" />
              <span>Active Architecture:</span>
              <span className="text-ink font-semibold">{activeFormat}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Signature 3D Credential Canvas */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
          <div className="w-full max-w-[420px] aspect-[4/3] rounded-2xl bg-panel/60 border border-line shadow-inner relative flex items-center justify-center overflow-hidden">
            <CredentialCard3D state={credentialState} format={activeFormat} />

            {/* Live Holographic State Badge */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between px-3 py-1.5 rounded-xl bg-void/90 border border-line text-[11px] backdrop-blur-md">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    credentialState === 'verified'
                      ? 'bg-verified animate-ping'
                      : credentialState === 'rejected'
                      ? 'bg-rejected animate-ping'
                      : credentialState === 'expired'
                      ? 'bg-pending animate-ping'
                      : 'bg-accent'
                  }`}
                />
                <span className="text-inkDim font-mono">Object State:</span>
                <span className="text-ink font-mono font-semibold uppercase">{credentialState}</span>
              </div>
              <span className="text-inkDim font-mono text-[10px]">WebGL R3F</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
