import React, { useEffect, useState } from 'react';
import axios from 'axios';
import MagneticButton from './MagneticButton';

export type FlowConfig = {
  issuer: string;
  wallet: string;
  verifier: string;
  format: string;
  tamperMode?: boolean;
  tamperType?: string;
  mode?: 'real' | 'simulated';
};

type FormatOption = { id: string; label: string; realModeSupported: boolean };
type ConfigOptions = {
  issuers: string[];
  wallets: string[];
  verifiers: string[];
  formats: FormatOption[];
  realMode: { mockUin: string };
};

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3000/api';

const LABELS: Record<string, { label: string; desc?: string }> = {
  'inji-certify': { label: 'Inji Certify', desc: 'Default MOSIP issuer' },
  'external-mock': { label: 'External Mock', desc: 'Cross-ecosystem test' },
  'inji-wallet-mobile': { label: 'Inji Wallet Mobile', desc: 'Mobile app via QR' },
  'inji-web': { label: 'Inji Web', desc: 'Browser-based holder' },
  'inji-verify': { label: 'Inji Verify', desc: 'Default MOSIP verifier' },
};

const TAMPER_TYPES = [
  { id: 'claim-corruption', label: 'Corrupt Claims' },
  { id: 'bad-signature', label: 'Invalidate Signature' },
  { id: 'expired', label: 'Expire Credential' },
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
}

const Selector: React.FC<SelectorProps> = ({ onRunTest }) => {
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
      .catch(() => { /* keep FALLBACK_OPTIONS if BFF isn't reachable */ });
  }, []);

  const handleSelect = (key: keyof FlowConfig, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  // ── Role Column: editorial vertical layout ─────────────────────────────────
  const RoleColumn = ({
    role,
    roleIndex,
    ids,
    selected,
    onSelect,
  }: {
    role: string;
    roleIndex: string;
    ids: string[];
    selected: string;
    onSelect: (val: string) => void;
  }) => (
    <div className="flex gap-6 lg:gap-10 py-6 border-b border-line last:border-b-0">
      {/* Left: Role label — editorial oversized text */}
      <div className="w-32 lg:w-40 shrink-0 flex flex-col gap-1 pt-1">
        <span className="text-[10px] font-mono text-inkDim tracking-[0.2em] uppercase">
          {roleIndex}
        </span>
        <span className="font-display text-2xl lg:text-3xl font-light text-inkDim leading-tight tracking-tight">
          {role}
        </span>
      </div>

      {/* Right: Options as text list */}
      <div className="flex-1 flex flex-col gap-1">
        {ids.map((id) => {
          const meta = LABELS[id] || { label: id };
          const isSelected = selected === id;
          return (
            <button
              key={id}
              onClick={() => onSelect(id)}
              className={`group text-left py-2.5 border-b border-transparent transition-all duration-150 ${
                isSelected
                  ? 'border-b-line'
                  : 'hover:border-b-line/40'
              }`}
              data-cursor="pointer"
            >
              <div className="flex items-baseline gap-3">
                <span
                  className={`text-sm font-ui transition-colors duration-150 ${
                    isSelected ? 'text-ink font-medium' : 'text-inkDim group-hover:text-ink/70'
                  }`}
                >
                  {meta.label}
                </span>
                {meta.desc && (
                  <span className="text-[10px] font-mono text-inkDim/50 hidden sm:inline">
                    {meta.desc}
                  </span>
                )}
                {/* Selection indicator — thin accent bar */}
                {isSelected && (
                  <span className="ml-auto w-1 h-1 rounded-full bg-accent shrink-0" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-0">
      {/* ── Utility bar: Real mode + Tamper mode ─────────────────────────── */}
      <div className="flex flex-wrap items-center gap-6 py-4 mb-2 border-b border-line text-xs font-mono">
        {/* Real/simulated mode */}
        <label className="flex items-center gap-2.5 text-inkDim cursor-pointer select-none" data-cursor="pointer">
          <span
            className={`w-8 h-4 relative rounded-full transition-colors duration-200 shrink-0 ${
              config.mode === 'real' ? 'bg-rejected/60' : 'bg-line'
            }`}
            onClick={() => handleSelect('mode', config.mode === 'real' ? 'simulated' : 'real')}
          >
            <span
              className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform duration-200 ${
                config.mode === 'real' ? 'translate-x-4' : 'translate-x-0.5'
              }`}
            />
          </span>
          <span>
            Real Mode (Sandbox){' '}
            {config.mode === 'real' && options.realMode.mockUin && (
              <span className="text-ink">· UIN: {options.realMode.mockUin}</span>
            )}
          </span>
          <input
            type="checkbox"
            className="sr-only"
            checked={config.mode === 'real'}
            onChange={(e) => handleSelect('mode', e.target.checked ? 'real' : 'simulated')}
          />
        </label>

        <span className="text-line">·</span>

        {/* Tamper mode */}
        <label className="flex items-center gap-2.5 text-inkDim cursor-pointer select-none" data-cursor="pointer">
          <span
            className={`w-8 h-4 relative rounded-full transition-colors duration-200 shrink-0 ${
              config.tamperMode ? 'bg-pending/60' : 'bg-line'
            }`}
            onClick={() => handleSelect('tamperMode', !config.tamperMode)}
          >
            <span
              className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform duration-200 ${
                config.tamperMode ? 'translate-x-4' : 'translate-x-0.5'
              }`}
            />
          </span>
          <span>Tamper Mode</span>
          <input
            type="checkbox"
            className="sr-only"
            checked={!!config.tamperMode}
            onChange={(e) => handleSelect('tamperMode', e.target.checked)}
          />
        </label>

        {config.tamperMode && (
          <select
            className="bg-transparent border-b border-line text-ink text-xs font-mono py-0.5 outline-none focus:border-inkDim"
            value={config.tamperType}
            onChange={(e) => handleSelect('tamperType', e.target.value)}
          >
            {TAMPER_TYPES.map((t) => (
              <option key={t.id} value={t.id} className="bg-panel">
                {t.label}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* ── Format selector — horizontal underline tabs ─────────────────── */}
      <div className="flex items-center gap-0 mb-2 border-b border-line">
        <span className="text-[10px] font-mono text-inkDim tracking-[0.2em] uppercase mr-6 py-3 shrink-0">
          Format
        </span>
        {options.formats.map((f) => {
          const unavailableInReal = config.mode === 'real' && !f.realModeSupported;
          const isSelected = config.format === f.id;
          return (
            <button
              key={f.id}
              onClick={() => handleSelect('format', f.id)}
              title={unavailableInReal ? 'Simulated Mode only' : undefined}
              className={`relative px-4 py-3 text-xs font-mono transition-colors duration-150 ${
                isSelected ? 'text-ink' : 'text-inkDim hover:text-ink/70'
              } ${unavailableInReal ? 'opacity-35' : ''}`}
              data-cursor="pointer"
            >
              {f.label}
              {unavailableInReal && (
                <span className="ml-1.5 text-[9px] text-pending">sim</span>
              )}
              {isSelected && (
                <span className="absolute bottom-0 left-0 right-0 h-px bg-ink" />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Cast / Role selection — editorial vertical layout ─────────────── */}
      <div className="mt-2">
        <RoleColumn
          role="Issuer"
          roleIndex="01"
          ids={options.issuers}
          selected={config.issuer}
          onSelect={(val) => handleSelect('issuer', val)}
        />
        <RoleColumn
          role="Wallet"
          roleIndex="02"
          ids={options.wallets}
          selected={config.wallet}
          onSelect={(val) => handleSelect('wallet', val)}
        />
        <RoleColumn
          role="Verifier"
          roleIndex="03"
          ids={options.verifiers}
          selected={config.verifier}
          onSelect={(val) => handleSelect('verifier', val)}
        />
      </div>

      {/* ── Primary CTA ─────────────────────────────────────────────────── */}
      <div className="pt-8 flex justify-end border-t border-line mt-4">
        <MagneticButton
          id="selector-cta"
          onClick={() => onRunTest(config)}
          className="group inline-flex items-center gap-3 px-8 py-4 bg-accent text-white font-ui font-medium text-sm tracking-wide"
          data-cursor="pointer"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Begin the exchange</span>
        </MagneticButton>
      </div>
    </div>
  );
};

export default Selector;
