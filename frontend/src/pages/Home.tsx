import React, { Suspense } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Terminal } from 'lucide-react';
import ForensicHeroScene from '../scenes/ForensicHeroScene';

export const Home: React.FC = () => {
  // 5 Protocol Beats: Sequential Signal Path across Issuance, Holder Key Binding, and Verification
  const protocolBeats = [
    {
      num: '01',
      code: 'DISPATCH',
      title: 'Credential Offer',
      actor: 'ISSUER · Inji Certify',
      std: 'OpenID4VCI',
      detail: 'Binds pre-authorized grant with issuer configuration and target credential parameters.',
      numColor: 'text-[#e5a93c]',
      topAccent: 'border-t-2 border-t-[#e5a93c]',
      dotColor: 'bg-[#e5a93c]',
      cryptoTag: 'GRANT: PRE_AUTH',
      statusTag: 'OFFER_READY',
      statusColor: 'text-[#e5a93c]',
    },
    {
      num: '02',
      code: 'PROOF_BIND',
      title: 'Key Binding & Mint',
      actor: 'WALLET · Inji Holder',
      std: 'OAuth 2.0 / PoP',
      detail: 'Issues ephemeral keypair, binds proof-of-possession header to prevent MITM tampering.',
      numColor: 'text-[#e5a93c]',
      topAccent: 'border-t-2 border-t-[#e5a93c]',
      dotColor: 'bg-[#e5a93c]',
      cryptoTag: 'DPoP: ES256K',
      statusTag: 'VC_SIGNED',
      statusColor: 'text-[#e5a93c]',
    },
    {
      num: '03',
      code: 'QUERY',
      title: 'Auth Request',
      actor: 'VERIFIER · Inji Verify',
      std: 'OpenID4VP',
      detail: 'Issues authorization query specifying session nonce, DCQL queries, and schema rules.',
      numColor: 'text-[#38bdf8]',
      topAccent: 'border-t-2 border-t-[#38bdf8]',
      dotColor: 'bg-[#38bdf8]',
      cryptoTag: 'NONCE: 32_BYTE',
      statusTag: 'CHALLENGE_LIVE',
      statusColor: 'text-[#38bdf8]',
    },
    {
      num: '04',
      code: 'PRESENT',
      title: 'Selective Disclosure',
      actor: 'WALLET → VERIFIER',
      std: 'SD-JWT / VP',
      detail: 'Presents blinded claim digests and proof-of-possession signature across verifier nonce.',
      numColor: 'text-[#a78bfa]',
      topAccent: 'border-t-2 border-t-[#a78bfa]',
      dotColor: 'bg-[#a78bfa]',
      cryptoTag: 'DISCLOSURE: SALTED',
      statusTag: 'REPLAY_GUARD',
      statusColor: 'text-[#a78bfa]',
    },
    {
      num: '05',
      code: 'VERDICT',
      title: 'Cryptographic Audit',
      actor: 'VERIFIER ENGINE',
      std: 'Trust Root',
      detail: 'Validates issuer signatures, revocation bitstring, audience nonces, and claim conformance.',
      numColor: 'text-[#34d399]',
      topAccent: 'border-t-2 border-t-[#34d399]',
      dotColor: 'bg-[#34d399]',
      cryptoTag: 'SIG: ED25519',
      statusTag: 'VERIFIED_VALID',
      statusColor: 'text-[#34d399]',
    },
  ];

  return (
    <div className="flex flex-col gap-12 pb-12">
      {/* 
        HERO SECTION:
        - Off-center, asymmetric composition.
        - Left: Monospace status line + heavy typographic scale + sharp CTA buttons.
        - Right: 3D load-bearing R3F credential scene overlapping the layout.
        - NO centered pills, NO cyan-to-purple gradient text.
      */}
      <section className="relative grid grid-cols-1 lg:grid-cols-12 items-center gap-8 min-h-[500px] pt-4">
        {/* Left column: Asymmetric type anchored to the left */}
        <div className="lg:col-span-6 z-10 flex flex-col items-start text-left">
          {/* Monospace status line replacing decorative pills */}
          <div className="font-mono text-xs text-[#8a919e] mb-4 flex items-center gap-2">
            <span className="text-[#e5a93c]">&gt;</span>
            <span className="tracking-wide uppercase">openid4vc.interoperability.lab :: mosip-ecosystem</span>
          </div>

          {/* Scale contrast: Monospace indicator + bold display headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05] text-[#f0f2f5] mb-5 font-mono">
            CRYPTOGRAPHIC <br />
            <span className="text-[#8a919e] font-light">PROTOCOL</span> FORENSICS
          </h1>

          <p className="text-[#8a919e] text-sm md:text-base leading-relaxed max-w-lg mb-8 font-sans">
            Real-time inspection console for OpenID4VCI and OpenID4VP transactions. Benchmarking credential issuance, selective disclosure, and adversarial tamper verification across MOSIP and global ecosystems.
          </p>

          {/* Sharp, weighted CTAs: Primary solid accent + Secondary technical ghost */}
          <div className="flex flex-wrap items-center gap-4">
            <Link
              to="/lab"
              className="px-6 py-3 bg-[#e5a93c] hover:bg-[#d4982c] text-[#090a0c] font-mono text-xs uppercase font-bold tracking-wider rounded-none flex items-center gap-2.5 transition-all shadow-[0_0_20px_rgba(229,169,60,0.2)] active:translate-y-0.5"
            >
              Launch Console
              <ArrowRight size={14} />
            </Link>

            <Link
              to="/dashboard"
              className="px-5 py-3 bg-transparent hover:bg-[#ffffff08] border border-[#ffffff1f] hover:border-[#8a919e] text-[#f0f2f5] font-mono text-xs uppercase tracking-wider rounded-none transition-colors"
            >
              [Observatory Audit Logs]
            </Link>
          </div>

          {/* Micro Telemetry Readout */}
          <div className="mt-8 pt-4 border-t border-[#ffffff0f] w-full flex items-center justify-between text-[11px] font-mono text-[#535965]">
            <span>ENGINE: TS-BFF :: PORT 3000</span>
            <span className="text-[#e5a93c]">STATUS: HERMETIC_READY</span>
          </div>
        </div>

        {/* Right column: Load-bearing 3D Credential Scene overlapping typography */}
        <div className="lg:col-span-6 relative w-full h-[420px] lg:h-[540px] flex items-center justify-center border border-[#ffffff0f] bg-[#0f1115]/50 overflow-hidden">
          {/* Signal Scanline */}
          <div className="absolute inset-0 forensic-grid-line pointer-events-none opacity-40" />

          <Suspense
            fallback={
              <div className="flex flex-col items-center justify-center font-mono text-xs text-[#535965]">
                <Terminal size={24} className="mb-2 text-[#8a919e]" />
                INITIALIZING_3D_SCENE...
              </div>
            }
          >
            <ForensicHeroScene />
          </Suspense>
        </div>
      </section>

      {/* 
        THE 5 PROTOCOL BEATS:
        - Sleek, cohesive 5-stage interconnected protocol pipeline (Issuance -> Verification).
        - Integrated bus rail header with phase division (Phase 1: Issuance | Phase 2: Verification).
        - Distinct cryptographic primitives, telemetry badges, and interactive inspection states.
      */}
      <section className="flex flex-col gap-3 mt-4">
        {/* Signal Bus Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#ffffff14] pb-2.5 gap-2 font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-none bg-[#e5a93c]" />
            <span className="text-[#f0f2f5] font-bold tracking-wider uppercase">
              // SIGNAL_PATH : THE 5 PROTOCOL BEATS
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-[#8a919e]">
            <span className="text-[#e5a93c]/80 flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#e5a93c] animate-pulse" />
              PHASE I: ISSUANCE [01-02]
            </span>
            <span className="text-[#535965]">──────►</span>
            <span className="text-[#38bdf8]/80 flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#38bdf8]" />
              PHASE II: PRESENTATION &amp; AUDIT [03-05]
            </span>
          </div>
        </div>

        {/* 5-Column Connected Pipeline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {protocolBeats.map((beat, idx) => (
            <div
              key={beat.num}
              className={`group relative bg-[#0f1115]/80 hover:bg-[#141820] border border-[#ffffff14] hover:border-[#ffffff2e] p-4 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 ${beat.topAccent}`}
            >
              <div>
                {/* Step Index & Protocol Standard */}
                <div className="flex items-center justify-between font-mono mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-black font-mono ${beat.numColor}`}>
                      {beat.num}
                    </span>
                    <span className="text-[10px] text-[#8a919e] font-semibold tracking-wider uppercase">
                      {beat.code}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 border border-[#ffffff14] bg-[#ffffff05] text-[#8a919e] uppercase tracking-wider">
                    {beat.std}
                  </span>
                </div>

                {/* Actor & Action Title */}
                <div className="mb-2">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#535965] mb-1 flex items-center gap-1.5">
                    <span className={`w-1 h-1 ${beat.dotColor}`} />
                    {beat.actor}
                  </div>
                  <h3 className="text-sm font-bold font-mono text-[#f0f2f5] group-hover:text-white transition-colors leading-snug">
                    {beat.title}
                  </h3>
                </div>

                {/* Description */}
                <p className="text-[11px] text-[#8a919e] leading-relaxed font-sans mb-4">
                  {beat.detail}
                </p>
              </div>

              {/* Cryptographic Artifact / Telemetry Footer */}
              <div className="pt-2.5 border-t border-[#ffffff0a] font-mono text-[10px] flex items-center justify-between text-[#535965] group-hover:text-[#8a919e] transition-colors">
                <span className="tracking-wide text-[9px] uppercase">{beat.cryptoTag}</span>
                <span className={`text-[9px] font-semibold ${beat.statusColor}`}>{beat.statusTag}</span>
              </div>

              {/* Connected Arrow Indicator (Hidden on mobile / last card) */}
              {idx < 4 && (
                <div className="hidden lg:block absolute -right-2.5 top-1/2 -translate-y-1/2 z-10 text-[#535965] pointer-events-none group-hover:text-[#e5a93c] transition-colors text-xs font-mono">
                  ►
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Forensic Capabilities Spec Matrix */}
      <section className="forensic-panel p-5 mt-2 border border-[#ffffff14]">
        <div className="font-mono text-xs text-[#8a919e] uppercase tracking-wider mb-4 flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-[#e5a93c]" />
          SUPPORTED SPECIFICATIONS & FORENSIC SUITES
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 font-mono text-xs">
          <div className="border-l border-[#ffffff14] pl-3">
            <div className="text-[#f0f2f5] font-bold mb-1">W3C VC (JSON-LD)</div>
            <p className="text-[#8a919e] text-[11px] leading-relaxed font-sans">
              Ed25519Signature2020 / JsonWebSignature2020 cryptographic suites. Live verification in MOSIP Collab sandbox.
            </p>
          </div>
          <div className="border-l border-[#ffffff14] pl-3">
            <div className="text-[#f0f2f5] font-bold mb-1">SD-JWT VC (IETF)</div>
            <p className="text-[#8a919e] text-[11px] leading-relaxed font-sans">
              Selective disclosure with salted hashes. Redacted claim disclosures verified with proof-of-possession nonces.
            </p>
          </div>
          <div className="border-l border-[#ffffff14] pl-3">
            <div className="border-l-0 text-[#f0f2f5] font-bold mb-1">mDoc (ISO 18013-5)</div>
            <p className="text-[#8a919e] text-[11px] leading-relaxed font-sans">
              Binary CBOR / COSE Sign1 mobile credential format. Benchmarked against offline relying party trust chains.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
