import React, { useEffect, useState } from 'react';
import { MagneticButton } from './MagneticButton';
import { CredentialObject } from './CredentialObject';
import type { FlowOptions, FlowActorOption } from '../types/flow';
import { ChevronDown, Check } from 'lucide-react';

interface SelectorProps {
  onStartFlow: (config: {
    issuer: string;
    wallet: string;
    verifier: string;
    format: string;
    mode: 'simulated' | 'real';
    tamperMode: boolean;
    tamperType?: 'claim-corruption' | 'bad-signature' | 'expired';
  }) => void;
  isLoading?: boolean;
}

function normalizeActor(item: string | FlowActorOption): { id: string; name: string } {
  if (typeof item === 'string') {
    // Convert e.g. "inji-certify" -> "Inji Certify"
    const name = item
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    return { id: item, name };
  }
  return item;
}

const DEFAULT_OPTIONS: FlowOptions = {
  issuers: [
    { id: 'inji-certify', name: 'Inji Certify Authority' },
    { id: 'external-mock', name: 'External Mock Authority' },
  ],
  wallets: [
    { id: 'inji-wallet-mobile', name: 'Inji Mobile Wallet' },
    { id: 'inji-web', name: 'Inji Web Agent' },
    { id: 'external-mock', name: 'External Mock Wallet' },
  ],
  verifiers: [
    { id: 'inji-verify', name: 'Inji Verify Gateway' },
    { id: 'external-mock', name: 'External Mock Verifier' },
  ],
  formats: [
    { id: 'w3c-vc-jsonld', label: 'W3C VC (JSON-LD)', realModeSupported: true },
    { id: 'sd-jwt-vc', label: 'SD-JWT (Selective Disclosure)', realModeSupported: false },
    { id: 'mdoc', label: 'ISO/IEC 18013-5 mDoc', realModeSupported: true },
  ],
  realMode: { mockUin: '5860356276' },
};

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3000/api';

/**
 * Custom architectural listbox picker replacing native browser <select>.
 * Styled strictly with design tokens (void, panel, panelLit, sealGold, line, mono).
 */
const CustomActorPicker: React.FC<{
  label: string;
  items: (string | FlowActorOption)[];
  value: string;
  onChange: (val: string) => void;
}> = ({ label, items, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const normalized = items.map(normalizeActor);
  const activeItem = normalized.find((i) => i.id === value) || normalized[0];

  return (
    <div className="relative w-full">
      <span className="font-mono text-[9px] text-inkDim uppercase tracking-widest block mb-1.5">
        {label}
      </span>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full bg-void/80 border border-line hover:border-inkDim px-3.5 py-2.5 flex items-center justify-between text-left transition-colors focus:outline-none group"
      >
        <span className="font-mono text-xs text-ink truncate mr-2">
          {activeItem ? activeItem.name : 'Select implementation'}
        </span>
        <ChevronDown
          size={14}
          className={`text-inkDim group-hover:text-ink transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-1 bg-panelLit border border-line z-30 shadow-2xl overflow-hidden py-1 divide-y divide-line/30">
            {normalized.map((item) => {
              const isSelected = item.id === value;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onChange(item.id);
                    setOpen(false);
                  }}
                  className={`w-full px-3.5 py-2 text-left font-mono text-xs flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-panel text-sealGold font-medium'
                      : 'text-ink/90 hover:bg-panel/60 hover:text-ink'
                  }`}
                >
                  <span className="truncate">{item.name}</span>
                  {isSelected && <Check size={13} className="text-sealGold ml-2" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

/**
 * Section 13 & 14: Opening Experience & Editorial Cast Selection.
 * Rebuilt from zero:
 * 1. Solves empty dropdown bug by normalizing both string[] and object[] backend formats.
 * 2. Breaks three-equal-card symmetry: dynamic focus weighting, spatial connecting lines, vertical stagger.
 * 3. Integrates the 3D CredentialObject directly into the stage as the protagonist of trust.
 * 4. Replaces native browser selects with styled custom listbox pickers.
 */
export const Selector: React.FC<SelectorProps> = ({ onStartFlow, isLoading = false }) => {
  const [options, setOptions] = useState<FlowOptions>(DEFAULT_OPTIONS);
  const [issuer, setIssuer] = useState('inji-certify');
  const [wallet, setWallet] = useState('inji-wallet-mobile');
  const [verifier, setVerifier] = useState('inji-verify');
  const [format, setFormat] = useState('w3c-vc-jsonld');
  const [mode, setMode] = useState<'simulated' | 'real'>('simulated');
  const [tamperMode, setTamperMode] = useState(false);
  const [tamperType, setTamperType] = useState<'claim-corruption' | 'bad-signature' | 'expired'>(
    'claim-corruption'
  );

  const [activeRole, setActiveRole] = useState<'issuer' | 'wallet' | 'verifier'>('wallet');

  useEffect(() => {
    fetch(`${API_BASE}/config/options`)
      .then((res) => res.json())
      .then((data: FlowOptions) => {
        if (data.issuers?.length) {
          setOptions(data);
          const firstIssuer = normalizeActor(data.issuers[0]).id;
          const firstWallet = normalizeActor(data.wallets[0]).id;
          const firstVerifier = normalizeActor(data.verifiers[0]).id;
          setIssuer(firstIssuer);
          setWallet(firstWallet);
          setVerifier(firstVerifier);
          if (data.formats?.length) {
            setFormat(data.formats[0].id);
          }
        }
      })
      .catch(() => {
        // Fallback to default options
      });
  }, []);

  const handleStart = () => {
    onStartFlow({
      issuer,
      wallet,
      verifier,
      format,
      mode,
      tamperMode,
      tamperType: tamperMode ? tamperType : undefined,
    });
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-8 flex flex-col gap-10">
      {/* Section 13: Opening Narrative Statement */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-line pb-8 gap-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-sealGold" />
            <span className="font-mono text-xs text-inkDim uppercase tracking-widest">
              INJI INTEROPERABILITY // CRYPTOGRAPHIC CHAIN OF TRUST
            </span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-normal text-ink leading-tight">
            When trust crosses a boundary, <br />
            the protocol has to prove itself.
          </h1>
        </div>
        <p className="font-ui text-xs md:text-sm text-inkDim max-w-md font-light leading-relaxed">
          The credential is not a card in a dashboard. It is an object traversing a cryptographic chain
          of custody across independent security domains.
        </p>
      </div>

      {/* Spatial Stage: Asymmetric Cast Lineup with 3D CredentialObject at center */}
      <div className="relative w-full border border-line bg-panel/30 p-6 md:p-10 overflow-hidden">
        {/* Spatial background connecting guideline */}
        <div className="hidden lg:block absolute top-[45%] left-12 right-12 h-px bg-line z-0">
          <div
            className="h-full w-24 bg-sealGold/40 blur-xs transition-all duration-700"
            style={{
              left:
                activeRole === 'issuer'
                  ? '15%'
                  : activeRole === 'wallet'
                  ? '50%'
                  : '85%',
              position: 'absolute',
              transform: 'translateX(-50%)',
            }}
          />
        </div>

        {/* 3D CredentialObject in 3D Space */}
        <div className="w-full h-56 md:h-72 mb-8 relative z-10 flex items-center justify-center">
          <CredentialObject
            state={tamperMode ? 'rejected' : activeRole === 'wallet' ? 'sealed' : 'blank'}
            format={format}
            className="w-full h-full"
          />
          <div className="absolute bottom-2 font-mono text-[9px] text-inkDim tracking-widest uppercase bg-void/80 px-3 py-1 border border-line">
            INTERACTIVE PROTOCOL OBJECT // {format.toUpperCase()}
          </div>
        </div>

        {/* Asymmetric Cast Lineup (Unequal weighting & vertical offset) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start relative z-10">
          {/* CAST 01: ISSUER (Starts higher) */}
          <div
            onClick={() => setActiveRole('issuer')}
            className={`cursor-pointer transition-all duration-300 p-6 border flex flex-col justify-between ${
              activeRole === 'issuer'
                ? 'bg-panelLit border-sealGold shadow-lg shadow-sealGold/5 scale-[1.02] lg:-translate-y-2'
                : 'bg-panel/50 border-line hover:border-inkDim/50 opacity-70 hover:opacity-95'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-[9px] text-inkDim uppercase tracking-widest">
                  ACTOR 01 // GENESIS
                </span>
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    activeRole === 'issuer' ? 'bg-sealGold' : 'bg-inkDim'
                  }`}
                />
              </div>
              <h2 className="font-display text-2xl text-ink font-normal mb-1">ISSUER</h2>
              <p className="font-ui text-xs text-inkDim mb-6 min-h-[36px]">
                Cryptographic genesis authority issuing credentials under OpenID4VCI.
              </p>
            </div>

            <CustomActorPicker
              label="AUTHORITY"
              items={options.issuers}
              value={issuer}
              onChange={(val) => {
                setIssuer(val);
                setActiveRole('issuer');
              }}
            />
          </div>

          {/* CAST 02: WALLET (Central custody anchor, prominent) */}
          <div
            onClick={() => setActiveRole('wallet')}
            className={`cursor-pointer transition-all duration-300 p-6 border flex flex-col justify-between ${
              activeRole === 'wallet'
                ? 'bg-panelLit border-sealGold shadow-xl shadow-sealGold/5 scale-[1.04] lg:translate-y-2'
                : 'bg-panel/50 border-line hover:border-inkDim/50 opacity-70 hover:opacity-95'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-[9px] text-sealGold uppercase tracking-widest">
                  ACTOR 02 // CUSTODY ANCHOR
                </span>
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    activeRole === 'wallet' ? 'bg-sealGold' : 'bg-inkDim'
                  }`}
                />
              </div>
              <h2 className="font-display text-2xl text-ink font-normal mb-1">WALLET</h2>
              <p className="font-ui text-xs text-inkDim mb-6 min-h-[36px]">
                Subject cryptographic custody, presentation proof generation, and SD disclosure.
              </p>
            </div>

            <CustomActorPicker
              label="AGENT"
              items={options.wallets}
              value={wallet}
              onChange={(val) => {
                setWallet(val);
                setActiveRole('wallet');
              }}
            />
          </div>

          {/* CAST 03: VERIFIER (Starts with subtle offset) */}
          <div
            onClick={() => setActiveRole('verifier')}
            className={`cursor-pointer transition-all duration-300 p-6 border flex flex-col justify-between ${
              activeRole === 'verifier'
                ? 'bg-panelLit border-sealGold shadow-lg shadow-sealGold/5 scale-[1.02] lg:-translate-y-2'
                : 'bg-panel/50 border-line hover:border-inkDim/50 opacity-70 hover:opacity-95'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-[9px] text-inkDim uppercase tracking-widest">
                  ACTOR 03 // RESOLUTION
                </span>
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    activeRole === 'verifier' ? 'bg-sealGold' : 'bg-inkDim'
                  }`}
                />
              </div>
              <h2 className="font-display text-2xl text-ink font-normal mb-1">VERIFIER</h2>
              <p className="font-ui text-xs text-inkDim mb-6 min-h-[36px]">
                Independent relying party validating signature cryptography and revocation.
              </p>
            </div>

            <CustomActorPicker
              label="GATEWAY"
              items={options.verifiers}
              value={verifier}
              onChange={(val) => {
                setVerifier(val);
                setActiveRole('verifier');
              }}
            />
          </div>
        </div>
      </div>

      {/* Section 3: Lower Configuration with Asymmetry & Clear Visual Hierarchy */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Dominant Section (5 Cols): Credential Protocol & Format */}
        <div className="lg:col-span-5 border border-line bg-panel/40 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[10px] text-sealGold uppercase tracking-wider">
                CORE PROTOCOL // FORMAT
              </span>
              <span className="font-mono text-[10px] text-inkDim">W3C / ISO SPEC</span>
            </div>
            <p className="font-ui text-xs text-inkDim mb-4">
              Cryptographic format standard regulating signature envelopes and selective claims.
            </p>
            <div className="flex flex-col gap-2">
              {options.formats.map((f) => {
                const isSelected = format === f.id;
                return (
                  <label
                    key={f.id}
                    onClick={() => setFormat(f.id)}
                    className={`flex items-center justify-between p-3.5 border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-sealGold bg-panelLit text-ink shadow-sm'
                        : 'border-line/60 bg-void/50 text-inkDim hover:border-line'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-2 h-2 rounded-full border ${
                          isSelected ? 'border-sealGold bg-sealGold' : 'border-line'
                        }`}
                      />
                      <span className="font-mono text-xs text-ink">{f.label}</span>
                    </div>
                    {f.realModeSupported && (
                      <span className="font-mono text-[9px] text-sealGold border border-sealGold/40 px-1.5 py-0.5">
                        REAL MODE CAPABLE
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Secondary Execution Mode (3 Cols) */}
        <div className="lg:col-span-3 border border-line bg-panel/30 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[10px] text-inkDim uppercase tracking-wider">
                EXECUTION ENGINE
              </span>
            </div>
            <div className="flex flex-col gap-2 mt-2">
              <button
                type="button"
                onClick={() => setMode('simulated')}
                className={`p-3 border text-left flex flex-col transition-colors ${
                  mode === 'simulated'
                    ? 'border-ink bg-panelLit text-ink'
                    : 'border-line/60 bg-void/40 text-inkDim hover:border-line'
                }`}
              >
                <span className="font-mono text-xs font-medium">SIMULATED FLOW</span>
                <span className="font-ui text-[10px] text-inkDim mt-1 leading-snug">
                  Stepped mock exchange for defect injection and verification testing.
                </span>
              </button>
              <button
                type="button"
                onClick={() => setMode('real')}
                className={`p-3 border text-left flex flex-col transition-colors ${
                  mode === 'real'
                    ? 'border-ink bg-panelLit text-ink'
                    : 'border-line/60 bg-void/40 text-inkDim hover:border-line'
                }`}
              >
                <span className="font-mono text-xs font-medium">LIVE ENDPOINTS</span>
                <span className="font-ui text-[10px] text-inkDim mt-1 leading-snug">
                  Real HTTP exchanges against Inji and MOSIP production/sandbox instances.
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Subdued Stress Testing / Defect Injection (4 Cols) */}
        <div className="lg:col-span-4 border border-line bg-panel/20 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[10px] text-inkDim uppercase tracking-wider">
                DEFECT INJECTION
              </span>
              <span
                className={`font-mono text-[9px] uppercase px-1.5 py-0.5 border ${
                  tamperMode
                    ? 'border-rejected/40 text-rejected bg-rejected/10'
                    : 'border-line text-inkDim'
                }`}
              >
                {tamperMode ? 'DEFECT ARMED' : 'INTEGRITY OK'}
              </span>
            </div>
            <label className="flex items-center gap-3 cursor-pointer mb-3">
              <input
                type="checkbox"
                checked={tamperMode}
                onChange={(e) => setTamperMode(e.target.checked)}
                className="w-4 h-4 rounded-none bg-void border-line text-rejected focus:ring-0"
              />
              <span className="font-mono text-xs text-ink">Corrupt exchange cryptography</span>
            </label>

            {tamperMode && (
              <div className="flex flex-col gap-1.5 animate-fadeIn">
                <span className="font-mono text-[9px] text-inkDim uppercase">Attack Surface</span>
                <select
                  value={tamperType}
                  onChange={(e) =>
                    setTamperType(
                      e.target.value as 'claim-corruption' | 'bad-signature' | 'expired'
                    )
                  }
                  className="bg-void border border-rejected/40 p-2 font-mono text-xs text-rejected focus:outline-none"
                >
                  <option value="claim-corruption">Claim Tamper (Corrupted Subject Payload)</option>
                  <option value="bad-signature">Signature Tamper (Compromised Private Key)</option>
                  <option value="expired">Temporal Tamper (Expired Validity Period)</option>
                </select>
              </div>
            )}
            <p className="font-ui text-[11px] text-inkDim mt-3 leading-snug">
              Asserts that relying party verifiers rigorously reject tampered cryptography.
            </p>
          </div>
        </div>
      </div>

      {/* Primary Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between border-t border-line pt-8 gap-4">
        <div className="font-mono text-xs text-inkDim flex items-center gap-2">
          <span>CHAIN:</span>
          <span className="text-ink">{issuer}</span>
          <span>→</span>
          <span className="text-ink">{wallet}</span>
          <span>→</span>
          <span className="text-ink">{verifier}</span>
        </div>

        <MagneticButton onClick={handleStart} disabled={isLoading} variant="primary">
          {isLoading ? 'ESTABLISHING PROTOCOL...' : 'BEGIN THE EXCHANGE'}
        </MagneticButton>
      </div>
    </div>
  );
};
