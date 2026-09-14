import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Server, Smartphone, ShieldCheck, FileKey, Play, AlertTriangle, Radio } from 'lucide-react';
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
  'inji-wallet-mobile': { label: 'Inji Wallet (Mobile)', desc: 'Mobile app via QR' },
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
      .catch(() => {
        /* keep FALLBACK_OPTIONS if the BFF isn't reachable yet */
      });
  }, []);

  const handleSelect = (key: keyof FlowConfig, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const OptionCard = ({ icon: Icon, title, ids, selected, onSelect }: any) => (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-ink text-xs font-mono uppercase tracking-wider font-semibold">
        <Icon size={16} className="text-accent" />
        {title}
      </div>
      <div className="flex flex-col gap-2">
        {ids.map((id: string) => {
          const meta = LABELS[id] || { label: id };
          const isSelected = selected === id;
          return (
            <button
              key={id}
              onClick={() => onSelect(id)}
              className={`text-left px-4 py-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'bg-panelLit border-accent shadow-[0_0_15px_rgba(91,127,255,0.15)] ring-1 ring-accent'
                  : 'bg-panelLit/50 border-line hover:border-line/80 hover:bg-panelLit'
              }`}
            >
              <div className={`font-medium text-sm ${isSelected ? 'text-accent' : 'text-ink'}`}>{meta.label}</div>
              {meta.desc && <div className="text-xs text-inkDim mt-0.5">{meta.desc}</div>}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-8">
      {/* Real Mode Toggle Bar */}
      <div className="flex items-center justify-between gap-4 bg-panelLit/60 border border-line rounded-xl px-5 py-3.5">
        <div className="flex items-center gap-2 text-ink font-medium text-sm">
          <Radio size={16} className={config.mode === 'real' ? 'text-rejected' : 'text-inkDim'} />
          <span>Real Mode (Sandbox Network)</span>
          <span className="text-xs text-inkDim font-normal hidden md:inline">
            — executes live against the MOSIP Collab sandbox with mock identity {config.mode === 'real' ? options.realMode.mockUin : ''}
          </span>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={config.mode === 'real'}
            onChange={(e) => handleSelect('mode', e.target.checked ? 'real' : 'simulated')}
          />
          <div className="w-11 h-6 bg-line peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-line after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rejected"></div>
        </label>
      </div>

      {/* 3-Column Selector Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <OptionCard icon={Server} title="Issuance Authority" ids={options.issuers} selected={config.issuer} onSelect={(val: string) => handleSelect('issuer', val)} />
        <OptionCard icon={Smartphone} title="Holder Wallet" ids={options.wallets} selected={config.wallet} onSelect={(val: string) => handleSelect('wallet', val)} />
        <OptionCard icon={ShieldCheck} title="Verifier Relying Party" ids={options.verifiers} selected={config.verifier} onSelect={(val: string) => handleSelect('verifier', val)} />
      </div>

      {/* Format, Tamper and Run Row */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pt-6 border-t border-line">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="flex items-center gap-2 text-ink text-xs font-mono uppercase tracking-wider whitespace-nowrap">
              <FileKey size={16} className="text-accent" />
              Format:
            </div>
            <div className="flex flex-wrap gap-2">
              {options.formats.map((f) => {
                const unavailableInReal = config.mode === 'real' && !f.realModeSupported;
                const isSelected = config.format === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => handleSelect('format', f.id)}
                    title={unavailableInReal ? 'No sandbox issuer offers this format in Real Mode - switch to Simulated Mode to use it' : undefined}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium font-mono transition-all duration-200 border cursor-pointer ${
                      isSelected
                        ? 'bg-accent/20 border-accent text-accent shadow-sm'
                        : 'bg-panelLit border-line text-inkDim hover:text-ink hover:bg-line'
                    } ${unavailableInReal ? 'opacity-40' : ''}`}
                  >
                    {f.label}
                    {unavailableInReal && <span className="ml-1.5 text-[9px] uppercase tracking-wide text-pending">sim only</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="flex items-center gap-2 text-ink text-xs font-mono uppercase tracking-wider whitespace-nowrap">
              <AlertTriangle size={16} className="text-pending" />
              Tamper Mode:
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={config.tamperMode} onChange={(e) => handleSelect('tamperMode', e.target.checked)} />
              <div className="w-11 h-6 bg-line peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-line after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pending"></div>
            </label>
            {config.tamperMode && (
              <select
                className="bg-panelLit border border-line text-ink text-xs font-mono rounded-lg px-3 py-1.5 outline-none focus:border-pending"
                value={config.tamperType}
                onChange={(e) => handleSelect('tamperType', e.target.value)}
              >
                {TAMPER_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Primary Action CTA: Story-voice copy 'Begin the exchange' with MagneticButton */}
        <MagneticButton
          onClick={() => onRunTest(config)}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-accent hover:bg-accent/90 text-white font-medium rounded-xl shadow-[0_0_20px_rgba(91,127,255,0.3)] transition-all duration-200 cursor-pointer text-sm"
        >
          <Play size={16} fill="currentColor" />
          Begin the exchange
        </MagneticButton>
      </div>
    </div>
  );
};

export default Selector;
