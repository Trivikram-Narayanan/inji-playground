import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Server, Smartphone, ShieldCheck, FileKey, Play, AlertTriangle, Radio } from 'lucide-react';

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
      <div className="flex items-center gap-2 text-slate-300 font-medium">
        <Icon size={18} className="text-indigo-400" />
        {title}
      </div>
      <div className="flex flex-col gap-2">
        {ids.map((id: string) => {
          const meta = LABELS[id] || { label: id };
          return (
            <button
              key={id}
              onClick={() => onSelect(id)}
              className={`text-left px-4 py-3 rounded-lg border transition-all duration-200 ${
                selected === id
                  ? 'bg-indigo-500/10 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500/50'
                  : 'bg-slate-800/50 border-slate-700 hover:border-slate-500 hover:bg-slate-700/50'
              }`}
            >
              <div className={`font-medium ${selected === id ? 'text-indigo-300' : 'text-slate-200'}`}>{meta.label}</div>
              {meta.desc && <div className="text-xs text-slate-500 mt-1">{meta.desc}</div>}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between gap-4 bg-slate-900/60 border border-slate-700/50 rounded-lg px-4 py-3">
        <div className="flex items-center gap-2 text-slate-300 font-medium">
          <Radio size={18} className={config.mode === 'real' ? 'text-red-400' : 'text-slate-500'} />
          <span>Real Mode</span>
          <span className="text-xs text-slate-500 font-normal hidden md:inline">
            (runs against the real MOSIP Collab sandbox with mock identity {config.mode === 'real' ? options.realMode.mockUin : ''})
          </span>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={config.mode === 'real'}
            onChange={(e) => handleSelect('mode', e.target.checked ? 'real' : 'simulated')}
          />
          <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <OptionCard icon={Server} title="Issuer" ids={options.issuers} selected={config.issuer} onSelect={(val: string) => handleSelect('issuer', val)} />
        <OptionCard icon={Smartphone} title="Wallet" ids={options.wallets} selected={config.wallet} onSelect={(val: string) => handleSelect('wallet', val)} />
        <OptionCard icon={ShieldCheck} title="Verifier" ids={options.verifiers} selected={config.verifier} onSelect={(val: string) => handleSelect('verifier', val)} />
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pt-6 border-t border-slate-700/50">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="flex items-center gap-2 text-slate-300 font-medium whitespace-nowrap">
              <FileKey size={18} className="text-indigo-400" />
              Format:
            </div>
            <div className="flex flex-wrap gap-2">
              {options.formats.map((f) => {
                const unavailableInReal = config.mode === 'real' && !f.realModeSupported;
                return (
                  <button
                    key={f.id}
                    onClick={() => handleSelect('format', f.id)}
                    title={unavailableInReal ? 'No sandbox issuer offers this format in Real Mode - switch to Simulated Mode to use it' : undefined}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border ${
                      config.format === f.id
                        ? 'bg-indigo-500 border-indigo-400 text-white shadow-lg shadow-indigo-500/20'
                        : 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700'
                    } ${unavailableInReal ? 'opacity-50' : ''}`}
                  >
                    {f.label}
                    {unavailableInReal && <span className="ml-1.5 text-[10px] uppercase tracking-wide text-yellow-500">sim only</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="flex items-center gap-2 text-slate-300 font-medium whitespace-nowrap">
              <AlertTriangle size={18} className="text-yellow-500" />
              Tamper Mode:
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={config.tamperMode} onChange={(e) => handleSelect('tamperMode', e.target.checked)} />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
            </label>
            {config.tamperMode && (
              <select
                className="bg-slate-800 border border-slate-600 text-slate-200 text-sm rounded-lg px-3 py-1.5 outline-none focus:border-yellow-500"
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

        <button
          onClick={() => onRunTest(config)}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white font-bold rounded-lg shadow-lg shadow-indigo-500/25 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <Play size={18} fill="currentColor" />
          Run Test
        </button>
      </div>
    </div>
  );
};

export default Selector;
