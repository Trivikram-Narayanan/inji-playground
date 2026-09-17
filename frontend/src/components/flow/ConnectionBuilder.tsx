import React from 'react';
import { Server, Smartphone, ShieldCheck, ArrowRight } from 'lucide-react';

interface ConnectionBuilderProps {
  issuer: string;
  wallet: string;
  verifier: string;
  format: string;
  isRealMode?: boolean;
  tamperMode?: boolean;
}

const LABELS: Record<string, string> = {
  'inji-certify': 'Inji Certify',
  'external-mock': 'External Mock',
  'inji-wallet-mobile': 'Inji Mobile Wallet',
  'inji-web': 'Inji Web Holder',
  'inji-verify': 'Inji Verify',
};

export const ConnectionBuilder: React.FC<ConnectionBuilderProps> = ({
  issuer,
  wallet,
  verifier,
  format,
  isRealMode = false,
  tamperMode = false,
}) => {
  return (
    <div className="w-full bg-[#090a0c] border border-[#ffffff14] p-4 relative overflow-hidden">
      {/* Topology Track */}
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Node 1: Issuer */}
        <div className="flex-1 w-full flex items-center gap-3 bg-[#0f1115] border border-[#ffffff14] p-3 transition-colors">
          <div className="p-2 bg-[#ffffff05] border border-[#ffffff14] text-[#8a919e]">
            <Server size={18} />
          </div>
          <div className="min-w-0 font-mono">
            <div className="text-[10px] uppercase tracking-widest text-[#535965]">Issuer Node</div>
            <div className="text-xs font-bold text-[#f0f2f5] truncate">Active: {LABELS[issuer] || issuer}</div>
          </div>
        </div>

        {/* Vector Beam 1: OpenID4VCI */}
        <div className="flex md:flex-col items-center justify-center text-[#535965] px-2 font-mono">
          <div className="text-[10px] tracking-tight text-[#8a919e] bg-[#ffffff05] px-2 py-0.5 border border-[#ffffff0f] mb-1">
            OpenID4VCI
          </div>
          <div className="flex items-center gap-1 text-[#e5a93c]">
            <div className="h-[1px] w-6 md:w-8 bg-[#e5a93c]" />
            <ArrowRight size={13} />
          </div>
        </div>

        {/* Node 2: Wallet */}
        <div className="flex-1 w-full flex items-center gap-3 bg-[#0f1115] border border-[#e5a93c]/50 p-3 shadow-[0_0_15px_rgba(229,169,60,0.08)]">
          <div className="p-2 bg-[#e5a93c]/10 border border-[#e5a93c]/30 text-[#e5a93c]">
            <Smartphone size={18} />
          </div>
          <div className="min-w-0 font-mono">
            <div className="text-[10px] uppercase tracking-widest text-[#e5a93c]">Wallet Holder</div>
            <div className="text-xs font-bold text-[#f0f2f5] truncate">{LABELS[wallet] || wallet}</div>
            <div className="text-[10px] text-[#8a919e] mt-0.5">{format}</div>
          </div>
        </div>

        {/* Vector Beam 2: OpenID4VP */}
        <div className="flex md:flex-col items-center justify-center text-[#535965] px-2 font-mono">
          <div className="text-[10px] tracking-tight text-[#8a919e] bg-[#ffffff05] px-2 py-0.5 border border-[#ffffff0f] mb-1">
            OpenID4VP
          </div>
          <div className="flex items-center gap-1 text-[#8a919e]">
            <div className="h-[1px] w-6 md:w-8 bg-[#8a919e]" />
            <ArrowRight size={13} />
          </div>
        </div>

        {/* Node 3: Verifier */}
        <div className="flex-1 w-full flex items-center gap-3 bg-[#0f1115] border border-[#ffffff14] p-3 transition-colors">
          <div className="p-2 bg-[#ffffff05] border border-[#ffffff14] text-[#8a919e]">
            <ShieldCheck size={18} />
          </div>
          <div className="min-w-0 font-mono">
            <div className="text-[10px] uppercase tracking-widest text-[#535965]">Verifier Node</div>
            <div className="text-xs font-bold text-[#f0f2f5] truncate">{LABELS[verifier] || verifier}</div>
          </div>
        </div>
      </div>

      {/* Mode / Tamper status telemetry strip */}
      <div className="mt-3 pt-2 border-t border-[#ffffff0f] flex items-center justify-between text-[11px] font-mono text-[#8a919e]">
        <span className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 ${isRealMode ? 'bg-[#ff4d2e] animate-ping' : 'bg-[#e5a93c]'}`} />
          CHANNEL: <span className="text-[#f0f2f5]">{isRealMode ? 'MOSIP LIVE SANDBOX' : 'HERMETIC PROTOCOL SIMULATOR'}</span>
        </span>
        {tamperMode && (
          <span className="text-[#ff4d2e] font-bold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-[#ff4d2e] animate-pulse" />
            [MUTATION: ADVERSARIAL_TAMPER]
          </span>
        )}
      </div>
    </div>
  );
};
