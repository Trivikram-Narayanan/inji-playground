import React from 'react';
import { type Credential3DState } from './CredentialObject';
import MagneticButton from './MagneticButton';

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
    <section className="relative min-h-screen flex flex-col">
      {/* ── Two-column editorial grid ─────────────────────────────── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-screen">

        {/* Left: Typography column */}
        <div className="lg:col-span-6 flex flex-col justify-end px-6 lg:px-12 pb-16 lg:pb-24 pt-32 lg:pt-0">
          {/* Eyebrow */}
          <div className="mb-8">
            <span className="text-[10px] font-mono text-inkDim tracking-[0.25em] uppercase">
              Trust Protocol Testing ·{' '}
              <span className="text-ink">{activeFormat}</span>
            </span>
          </div>

          {/* Primary display headline */}
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-light leading-[1.05] tracking-tight text-ink mb-6">
            When trust crosses
            <br />
            <em className="not-italic text-inkDim">a boundary,</em>
            <br />
            the protocol has to
            <br />
            <span className="italic">prove itself.</span>
          </h1>

          {/* Description */}
          <p className="text-inkDim text-sm lg:text-base font-ui leading-relaxed max-w-md mb-12">
            Simulate and cryptographically verify OpenID4VCI and OpenID4VP
            exchanges across W3C JSON-LD, SD-JWT, and mDoc credential formats.
            Inspect every raw protocol payload.
          </p>

          {/* Primary CTA — one, deliberate */}
          <div className="flex items-center gap-6">
            <MagneticButton
              id="hero-cta"
              onClick={onStartFlow}
              className="group inline-flex items-center gap-3 px-8 py-4 bg-accent text-white font-ui font-medium text-sm tracking-wide transition-all duration-300"
              data-cursor="pointer"
            >
              <span>Begin the exchange</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className="transition-transform duration-300 group-hover:translate-x-1"
              >
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </MagneticButton>

            {/* Scroll indicator */}
            <div className="flex items-center gap-2 text-inkDim">
              <div className="w-px h-8 bg-line" />
              <span className="text-[10px] font-mono tracking-widest uppercase">
                Scroll
              </span>
            </div>
          </div>
        </div>

        {/* Right: 3D credential canvas — full height, no border */}
        <div className="lg:col-span-6 relative flex items-center justify-center min-h-[60vh] lg:min-h-screen">
          {/* Vertical dividing rule between columns */}
          <div className="hidden lg:block absolute left-0 top-16 bottom-16 w-px bg-line" />

          {/* Canvas wrapper — no container card, fills the column */}
          <div className="w-full h-full min-h-[60vh] lg:min-h-screen relative">
            {/* Lazy-loaded 3D scene */}
            <React.Suspense fallback={
              <div className="w-full h-full flex items-center justify-center text-inkDim font-mono text-xs">
                Loading scene…
              </div>
            }>
              {/* CredentialObject is imported dynamically in MainFlow to avoid circular import */}
              <div id="credential-scene-mount" className="w-full h-full" />
            </React.Suspense>
          </div>

          {/* Small state annotation — bottom of the right column */}
          <div className="absolute bottom-8 left-8 lg:left-16">
            <div className="flex items-center gap-2">
              <span
                className={`inline-block w-1.5 h-1.5 rounded-full ${
                  credentialState === 'verified'
                    ? 'bg-verified'
                    : credentialState === 'rejected'
                    ? 'bg-rejected'
                    : credentialState === 'sealed'
                    ? 'bg-sealGold'
                    : credentialState === 'transit'
                    ? 'bg-accent'
                    : 'bg-line'
                }`}
              />
              <span className="text-[10px] font-mono text-inkDim tracking-widest uppercase">
                {credentialState}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom thin rule */}
      <div className="h-px bg-line" />
    </section>
  );
};

export default HeroSection;
