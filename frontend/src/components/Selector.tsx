import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Server, Smartphone, ShieldCheck, FileKey, Play, AlertTriangle, Radio, RefreshCw } from 'lucide-react';
import type { FlowConfig, ConfigOptions } from '../types';
import { API_BASE } from '../api/client';
import { ConnectionBuilder } from './flow/ConnectionBuilder';
import { BracketBadge } from './ui/LabPrimitives';

const LABELS: Record<string, { label: string; desc?: string }> = {
  'inji-certify': { label: 'Inji Certify', desc: 'Default MOSIP issuer' },
  'external-mock': { label: 'External Mock', desc: 'Generic OpenID4VC reference ecosystem (did:jwk issuer, non-MOSIP)' },
  'inji-wallet-mobile': { label: 'Inji Wallet (Mobile)', desc: 'Mobile app via QR' },
  'inji-web': { label: 'Inji Web', desc: 'Browser-based holder' },
  'inji-verify': { label: 'Inji Verify', desc: 'Default MOSIP verifier' },
};

const TAMPER_TYPES = [
  { id: 'claim-corruption', label: 'Corrupt Claims', desc: 'Alters cryptographic claim payload' },
  { id: 'bad-signature', label: 'Invalidate Signature', desc: 'Breaks JWS/LDP signature verification' },
  { id: 'expired', label: 'Expire Credential', desc: 'Sets expiration timestamp in the past' },
];

const FALLBACK_OPTIONS: ConfigOptions = {
  issuers: ['inji-certify', 'external-mock'],
  wallets: ['inji-wallet-mobile', 'inji-web', 'external-mock'],
  verifiers: ['inji-verify', 'external-mock'],
  formats: [
    { id: 'w3c-vc-jsonld', label: 'W3C VC (JSON-LD)', realModeSupported: true },
    { id: 'sd-jwt-vc', label: 'SD-JWT VC', realModeSupported: false },
    { id: 'mdoc', label: 'mDoc / mDL', realModeSupported: true },
  ],
  realMode: { mockUin: '' },
};

interface SelectorProps {
  onRunTest: (config: FlowConfig) => void;
  isLoading?: boolean;
}

export const Selector: React.FC<SelectorProps> = ({ onRunTest, isLoading = false }) => {
  const [options, setOptions] = useState<ConfigOptions>(FALLBACK_OPTIONS);
  const [config, setConfig] = useState<FlowConfig>({
    issuer: 'inji-certify',
    wallet: 'inji-wallet-mobile',
    verifier: 'inji-verify',
    format: 'w3c-vc-jsonld',
    tamperMode: false,
    tamperType: 'claim-corruption',
    mode: 'simulated',
  });

  useEffect(() => {
    axios
      .get(`${API_BASE}/config/options`)
      .then((res) => setOptions(res.data))
      .catch(() => {
        /* keep FALLBACK_OPTIONS if the BFF isn't reachable yet */
      });
  }, []);

  const handleSelect = (key: keyof FlowConfig, value: any) => {
    setConfig((prev) => {
      const next = { ...prev, [key]: value };
      // Entering Real Mode with a sim-only format selected: fall back to a format the sandbox supports.
      if (key === 'mode' && value === 'real') {
        const current = options?.formats.find((f) => f.id === next.format);
        const fallback = options?.formats.find((f) => f.realModeSupported);
        if (current && !current.realModeSupported && fallback) next.format = fallback.id;
      }
      return next;
    });
  };

  const OptionCard = ({ icon: Icon, title, ids, selected, onSelect }: any) => (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs font-mono text-[#8a919e] uppercase tracking-wider" id={`${title}-label`}>
        <span className="flex items-center gap-1.5 font-bold text-[#f0f2f5]">
          <Icon size={14} className="text-[#8a919e]" aria-hidden="true" />
          {title}
        </span>
        <span className="text-[10px] text-[#535965]">{ids.length} options</span>
      </div>
      <div className="flex flex-col gap-1.5" role="radiogroup" aria-labelledby={`${title}-label`}>
        {ids.map((id: string) => {
          const meta = LABELS[id] || { label: id };
          const isSelected = selected === id;
          return (
            <button
              key={id}
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelect(id)}
              className={`text-left px-3 py-2.5 rounded-none border transition-all duration-150 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#e5a93c] ${
                isSelected
                  ? 'bg-[#e5a93c]/10 border-[#e5a93c] text-[#f0f2f5] font-semibold'
                  : 'bg-[#0f1115] border-[#ffffff14] text-[#8a919e] hover:border-[#ffffff2e] hover:text-[#f0f2f5]'
              }`}
            >
              <div className="flex items-center justify-between font-mono">
                <span className={`text-xs ${isSelected ? 'text-[#e5a93c]' : 'text-[#f0f2f5]'}`}>
                  {meta.label}
                </span>
                {isSelected && <span className="w-1 h-1 bg-[#e5a93c]" />}
              </div>
              {meta.desc && <div className="text-[11px] text-[#535965] mt-0.5 leading-snug font-sans">{meta.desc}</div>}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Real Mode Switch with sharp technical brackets */}
      <div className="flex items-center justify-between gap-4 bg-[#090a0c] border border-[#ffffff14] p-3.5">
        <div className="flex items-center gap-3">
          <Radio size={16} className={config.mode === 'real' ? 'text-[#ff4d2e] animate-pulse' : 'text-[#535965]'} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-[#f0f2f5] uppercase tracking-wider">
                Real Mode Execution
              </span>
              {config.mode === 'real' ? (
                <BracketBadge variant="crimson" pulse>MOSIP LIVE</BracketBadge>
              ) : (
                <BracketBadge variant="dim">SIMULATED</BracketBadge>
              )}
            </div>
            <p className="text-xs text-[#8a919e] mt-0.5 font-sans">
              {config.mode === 'real'
                ? `Active MOSIP sandbox connection with mock identity UIN: ${options.realMode.mockUin || 'configured'}`
                : 'Zero-network simulated protocol mode for instant deterministic feedback'}
            </p>
          </div>
        </div>

        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            aria-label="Toggle Real Mode"
            checked={config.mode === 'real'}
            onChange={(e) => handleSelect('mode', e.target.checked ? 'real' : 'simulated')}
          />
          <div className="w-10 h-5 bg-[#1a1d24] border border-[#ffffff1f] peer-focus-visible:outline peer-focus-visible:outline-1 peer-focus-visible:outline-[#e5a93c] rounded-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:h-4 after:w-4 after:transition-all peer-checked:bg-[#ff4d2e]"></div>
        </label>
      </div>

      {/* Dynamic Connection Architecture Visualizer */}
      <ConnectionBuilder
        issuer={config.issuer}
        wallet={config.wallet}
        verifier={config.verifier}
        format={config.format}
        isRealMode={config.mode === 'real'}
        tamperMode={config.tamperMode}
      />

      {/* Participant Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <OptionCard icon={Server} title="Issuer" ids={options.issuers} selected={config.issuer} onSelect={(val: string) => handleSelect('issuer', val)} />
        <OptionCard icon={Smartphone} title="Wallet" ids={options.wallets} selected={config.wallet} onSelect={(val: string) => handleSelect('wallet', val)} />
        <OptionCard icon={ShieldCheck} title="Verifier" ids={options.verifiers} selected={config.verifier} onSelect={(val: string) => handleSelect('verifier', val)} />
      </div>

      {/* Format & Tamper & Experiment Launch Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 pt-4 border-t border-[#ffffff14]">
        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-6 w-full lg:w-auto">
          {/* Format Selection with sharp brackets */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-xs font-mono text-[#8a919e] uppercase tracking-wider">
              <FileKey size={13} className="text-[#8a919e]" />
              Credential Format
            </div>
            <div className="flex flex-wrap gap-1.5">
              {options.formats.map((f) => {
                const unavailableInReal = config.mode === 'real' && !f.realModeSupported;
                const isSelected = config.format === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => handleSelect('format', f.id)}
                    disabled={unavailableInReal}
                    aria-pressed={isSelected}
                    title={unavailableInReal ? 'No sandbox issuer offers this format in Real Mode - switch to Simulated Mode' : undefined}
                    className={`px-3 py-1 text-xs font-mono transition-colors border rounded-none focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#e5a93c] ${
                      isSelected
                        ? 'bg-[#e5a93c] border-[#e5a93c] text-[#090a0c] font-bold'
                        : 'bg-[#090a0c] border-[#ffffff14] text-[#8a919e] hover:text-[#f0f2f5] hover:border-[#ffffff2e]'
                    } ${unavailableInReal ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    {f.label}
                    {unavailableInReal && <span className="ml-1 text-[9px] uppercase font-mono text-[#ff4d2e]">SIM_ONLY</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Adversarial Tamper with sharp toggle */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-xs font-mono text-[#8a919e] uppercase tracking-wider">
              <AlertTriangle size={13} className="text-[#ff4d2e]" />
              Adversarial Tamper
            </div>
            <div className="flex items-center gap-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  aria-label="Toggle Tamper Mode"
                  checked={config.tamperMode}
                  onChange={(e) => handleSelect('tamperMode', e.target.checked)}
                />
                <div className="w-10 h-5 bg-[#1a1d24] border border-[#ffffff1f] peer-focus-visible:outline peer-focus-visible:outline-1 peer-focus-visible:outline-[#ff4d2e] rounded-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:h-4 after:w-4 after:transition-all peer-checked:bg-[#ff4d2e]"></div>
              </label>

              {config.tamperMode && (
                <div className="flex items-center gap-1">
                  {TAMPER_TYPES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleSelect('tamperType', t.id)}
                      title={t.desc}
                      className={`px-2 py-1 text-xs font-mono border rounded-none transition-colors ${
                        config.tamperType === t.id
                          ? 'bg-[#ff4d2e]/10 border-[#ff4d2e] text-[#ff4d2e] font-bold'
                          : 'bg-[#090a0c] border-[#ffffff14] text-[#8a919e] hover:text-[#f0f2f5]'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Experiment Launch Button */}
        <button
          onClick={() => onRunTest(config)}
          disabled={isLoading}
          aria-label="Run Test"
          className="w-full lg:w-auto px-6 py-3 bg-[#e5a93c] hover:bg-[#d4982c] text-[#090a0c] font-mono text-xs uppercase font-bold tracking-wider rounded-none flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(229,169,60,0.15)] disabled:opacity-50 disabled:pointer-events-none"
        >
          {isLoading ? (
            <>
              <RefreshCw size={14} className="animate-spin" />
              EXECUTING...
            </>
          ) : (
            <>
              <Play size={14} fill="currentColor" aria-hidden="true" />
              RUN EXPERIMENT
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Selector;
