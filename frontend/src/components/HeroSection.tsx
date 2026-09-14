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
    <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 via-slate-950 to-slate-950 p-8 lg:p-12 mb-8 shadow-2xl backdrop-blur-xl">
      {/* Background Subtle Radial Glow */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[650px] h-[350px] bg-indigo-600/15 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 right-10 w-[400px] h-[250px] bg-emerald-500/10 rounded-full blur-3xl" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Editorial Cinematic Typography */}
        <div className="lg:col-span-7 flex flex-col items-start gap-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium tracking-wide">
            <Sparkles size={14} className="text-indigo-400 animate-pulse" />
            <span>MOSIP INJI CREDENTIALING INTEROPERABILITY</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-100 font-serif leading-[1.15]">
            A credential no one has to{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-200 to-emerald-300 italic font-serif">
              trust in advance.
            </span>
          </h1>

          <p className="text-slate-400 text-base lg:text-lg max-w-xl font-sans leading-relaxed">
            Simulate, stress-test, and cryptographically verify cross-module OpenID4VCI & OpenID4VP
            exchanges. Inspect raw protocol payloads across W3C JSON-LD, SD-JWT, and mDoc.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <MagneticButton
              onClick={onStartFlow}
              className="px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-medium rounded-xl text-sm shadow-[0_0_25px_rgba(99,102,241,0.35)] transition-all flex items-center gap-2 group cursor-pointer"
            >
              <span>Begin Protocol Exchange</span>
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </MagneticButton>

            <div className="flex items-center gap-2 text-xs text-slate-400 border border-slate-800/80 bg-slate-900/60 px-3.5 py-2.5 rounded-xl">
              <Layers size={14} className="text-indigo-400" />
              <span>Active Architecture:</span>
              <span className="text-slate-200 font-semibold">{activeFormat}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Signature 3D Credential Canvas */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
          <div className="w-full max-w-[420px] aspect-[4/3] rounded-2xl bg-slate-900/40 border border-slate-800/60 shadow-inner relative flex items-center justify-center overflow-hidden">
            <CredentialCard3D state={credentialState} format={activeFormat} />

            {/* Live Holographic State Badge */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] backdrop-blur-md">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    credentialState === 'verified'
                      ? 'bg-emerald-400 animate-ping'
                      : credentialState === 'rejected'
                      ? 'bg-rose-500 animate-ping'
                      : credentialState === 'expired'
                      ? 'bg-amber-400 animate-ping'
                      : 'bg-indigo-400'
                  }`}
                />
                <span className="text-slate-400">Object State:</span>
                <span className="text-slate-200 font-mono font-semibold uppercase">{credentialState}</span>
              </div>
              <span className="text-indigo-400 font-mono text-[10px]">WebGL R3F</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
