import React, { useState } from 'react';
import { Copy, Check, Terminal, FileCode } from 'lucide-react';
import type { FlowEvent } from '../types';

interface ProtocolInspectorProps {
  event: FlowEvent | null;
}

export const ProtocolInspector: React.FC<ProtocolInspectorProps> = ({ event }) => {
  const [copied, setCopied] = useState(false);

  if (!event) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-[#535965] border border-dashed border-[#ffffff14] p-8 bg-[#090a0c] h-full font-mono text-xs">
        <div className="w-10 h-10 border border-[#ffffff14] flex items-center justify-center mb-3 text-[#8a919e]">
          <Terminal size={18} />
        </div>
        <p className="text-[#8a919e] font-bold">STANDBY // NO PAYLOAD SELECTED</p>
        <p className="text-[#535965] mt-1 font-sans">Select any transaction step on the timeline to inspect raw cryptographic payload</p>
      </div>
    );
  }

  let parsedPayload: any = null;
  let parseError = false;
  try {
    parsedPayload = typeof event.payload === 'string' ? JSON.parse(event.payload) : event.payload;
  } catch {
    parseError = true;
  }

  const handleCopy = () => {
    const raw = typeof event.payload === 'string' ? event.payload : JSON.stringify(event.payload, null, 2);
    navigator.clipboard.writeText(raw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#090a0c] border border-[#ffffff14] overflow-hidden font-mono text-xs">
      {/* Top Header */}
      <div className="px-4 py-2.5 border-b border-[#ffffff14] bg-[#0f1115] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <FileCode size={14} className="text-[#e5a93c]" />
          <span className="text-[#f0f2f5] font-bold truncate">{event.step}</span>
          <span className="text-[#535965] text-[10px]">:: {event.actor}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-[10px] uppercase font-bold border px-1.5 py-0.2 ${
            event.status === 'success'
              ? 'text-[#22c55e] border-[#22c55e]/40'
              : event.status === 'error'
              ? 'text-[#ff4d2e] border-[#ff4d2e]/40'
              : 'text-[#e5a93c] border-[#e5a93c]/40'
          }`}>
            [{event.status}]
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-0.5 border border-[#ffffff14] hover:border-[#ffffff2e] text-[#8a919e] hover:text-[#f0f2f5] text-xs transition-colors"
          >
            {copied ? <Check size={11} className="text-[#22c55e]" /> : <Copy size={11} />}
            <span>{copied ? 'COPIED' : 'COPY'}</span>
          </button>
        </div>
      </div>

      {/* Code Inspector Area */}
      <div className="flex-1 overflow-auto p-4 custom-scrollbar bg-[#090a0c] text-[#8a919e]" tabIndex={0} aria-label={`Payload for ${event.step}`}>
        {parseError ? (
          <pre className="text-[#ff4d2e] whitespace-pre-wrap">{String(event.payload)}</pre>
        ) : (
          <pre className="text-xs font-mono leading-relaxed text-[#f0f2f5]">
            <code>{JSON.stringify(parsedPayload, null, 2)}</code>
          </pre>
        )}
      </div>

      {/* Footer telemetry */}
      <div className="px-3 py-1.5 bg-[#0f1115] border-t border-[#ffffff0f] text-[10px] text-[#535965] flex items-center justify-between">
        <span>HASH_ID: {event.id}</span>
        <span className="text-[#8a919e]">{new Date(event.timestamp).toLocaleTimeString()}</span>
      </div>
    </div>
  );
};

export default ProtocolInspector;
