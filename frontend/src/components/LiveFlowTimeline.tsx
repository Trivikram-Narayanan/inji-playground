import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle2, Circle, Loader2, Copy, Check, List, Play } from 'lucide-react';
import SequenceDiagram from './SequenceDiagram';
import type { FlowStatus, FlowEvent } from '../types';
import { TERMINAL_STATUSES, PROTOCOL_STEPS } from '../types';


export { TERMINAL_STATUSES };
export type { FlowStatus, FlowEvent };

interface LiveFlowTimelineProps {
  flow: FlowStatus | null;
  onEventClick: (event: FlowEvent) => void;
  onAdvanceFlow: () => void;
  isAdvancing: boolean;
  onViewReport: () => void;
}

export const LiveFlowTimeline: React.FC<LiveFlowTimelineProps> = ({
  flow,
  onEventClick,
  onAdvanceFlow,
  isAdvancing,
  onViewReport,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'diagram'>('list');
  const [deviceMode, setDeviceMode] = useState<'cross-device' | 'same-device'>('cross-device');
  const [copiedLink, setCopiedLink] = useState(false);

  if (!flow) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-[#535965] border border-dashed border-[#ffffff14] p-8 h-full bg-[#090a0c] font-mono text-xs">
        <div className="w-10 h-10 border border-[#ffffff14] flex items-center justify-center mb-3 text-[#8a919e]">
          <List size={18} />
        </div>
        <p className="text-[#8a919e] font-bold">AWAITING EXPERIMENT INITIALIZATION</p>
        <p className="text-[#535965] mt-1">Configure participant vectors above and launch experiment</p>
      </div>
    );
  }

  const completedStepIds = flow.events.filter((e) => e.status === 'success').map((e) => e.step);

  const deepLinkUri = flow.offer
    ? `openid-credential-offer://?credential_offer=${encodeURIComponent(JSON.stringify(flow.offer))}`
    : `openid-credential-offer://`;

  const handleCopyLink = () => {

    navigator.clipboard.writeText(deepLinkUri);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const isTerminal = flow.status ? TERMINAL_STATUSES.includes(flow.status as any) : false;

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* View Switcher: Step Timeline vs Sequence Diagram */}
      <div className="flex items-center justify-between border-b border-[#ffffff14] pb-3">
        <div className="flex items-center gap-2 font-mono text-xs">
          <button
            onClick={() => setViewMode('list')}
            aria-pressed={viewMode === 'list'}
            className={`px-2.5 py-1 border rounded-none transition-colors ${
              viewMode === 'list'
                ? 'bg-[#e5a93c] border-[#e5a93c] text-[#090a0c] font-bold'
                : 'bg-[#090a0c] border-[#ffffff14] text-[#8a919e] hover:text-[#f0f2f5]'
            }`}
          >
            [TIMELINE]
          </button>
          <button
            onClick={() => setViewMode('diagram')}
            aria-pressed={viewMode === 'diagram'}
            className={`px-2.5 py-1 border rounded-none transition-colors ${
              viewMode === 'diagram'
                ? 'bg-[#e5a93c] border-[#e5a93c] text-[#090a0c] font-bold'
                : 'bg-[#090a0c] border-[#ffffff14] text-[#8a919e] hover:text-[#f0f2f5]'
            }`}
          >
            [SEQUENCE_GRAPH]
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-[#8a919e]">
            STEPS: <span className="text-[#e5a93c] font-bold">{completedStepIds.length}</span>/6
          </span>
          {flow.mode === 'simulated' && !isTerminal && (
            <button
              onClick={onAdvanceFlow}
              disabled={isAdvancing}
              className="flex items-center gap-1.5 px-3 py-1 bg-transparent hover:bg-[#ffffff08] border border-[#ffffff1f] text-[#f0f2f5] rounded-none text-xs font-mono font-bold disabled:opacity-50 transition-colors"
              title="Advance step manually in Simulated Mode"
            >
              {isAdvancing ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
              ADVANCE
            </button>
          )}
        </div>
      </div>

      {/* Credential Offer Hand-off */}
      {flow.status === 'OFFER_CREATED' && flow.offer && flow.mode !== 'real' && (
        <div className="bg-[#090a0c] p-4 border border-[#ffffff14] flex flex-col items-center justify-center">
          <div className="flex items-center gap-2 mb-3 font-mono text-xs">
            <button
              onClick={() => setDeviceMode('cross-device')}
              aria-pressed={deviceMode === 'cross-device'}
              className={`px-2.5 py-1 border rounded-none transition-colors ${
                deviceMode === 'cross-device'
                  ? 'bg-[#e5a93c] border-[#e5a93c] text-[#090a0c] font-bold'
                  : 'bg-[#090a0c] border-[#ffffff14] text-[#8a919e]'
              }`}
            >
              CROSS-DEVICE (QR)
            </button>
            <button
              onClick={() => setDeviceMode('same-device')}
              aria-pressed={deviceMode === 'same-device'}
              className={`px-2.5 py-1 border rounded-none transition-colors ${
                deviceMode === 'same-device'
                  ? 'bg-[#e5a93c] border-[#e5a93c] text-[#090a0c] font-bold'
                  : 'bg-[#090a0c] border-[#ffffff14] text-[#8a919e]'
              }`}
            >
              SAME-DEVICE (URI)
            </button>
          </div>

          {deviceMode === 'cross-device' ? (
            <div className="flex flex-col items-center">
              <div className="p-3 bg-white mb-3 shadow-md">
                <QRCodeSVG
                  value={JSON.stringify(flow.offer)}
                  size={140}
                  role="img"
                  aria-label="QR code encoding credential offer"
                />
              </div>
              <p className="text-[11px] text-[#8a919e] font-mono">Scan with Inji Wallet Mobile app</p>
            </div>
          ) : (
            <div className="w-full max-w-md flex flex-col gap-2 mb-3 font-mono">
              <div className="bg-[#0f1115] p-2 border border-[#ffffff14] flex items-center justify-between gap-2">
                <code className="text-[10px] text-[#e5a93c] truncate">{deepLinkUri}</code>
                <button
                  onClick={handleCopyLink}
                  className="px-2 py-0.5 bg-[#ffffff0a] hover:bg-[#ffffff14] text-[#f0f2f5] text-xs flex items-center gap-1 shrink-0"
                >
                  {copiedLink ? <Check size={12} className="text-[#22c55e]" /> : <Copy size={12} />}
                  <span>{copiedLink ? 'COPIED' : 'COPY'}</span>
                </button>
              </div>
            </div>
          )}

          <button
            onClick={onAdvanceFlow}
            disabled={isAdvancing}
            className="px-5 py-2 bg-[#e5a93c] hover:bg-[#d4982c] text-[#090a0c] font-mono text-xs font-bold uppercase rounded-none transition-all shadow-[0_0_15px_rgba(229,169,60,0.15)] mt-1"
          >
            {isAdvancing ? 'SIMULATING_PIPELINE...' : 'CONTINUE DISPATCH'}
          </button>
        </div>
      )}

      {/* Real Mode Presentation Prompt */}
      {flow.status === 'CREDENTIAL_ISSUED' && flow.mode === 'real' && (
        <div className="bg-[#090a0c] p-4 border border-[#ff4d2e]/40 flex flex-col items-center justify-center gap-3">
          <div className="flex items-center gap-2 text-[#ff4d2e] font-mono text-xs font-bold uppercase">
            <span className="w-1.5 h-1.5 bg-[#ff4d2e] animate-ping" />
            MOSIP CREDENTIAL ISSUED :: AWAITING VERIFICATION
          </div>
          <p className="text-xs text-[#8a919e] text-center max-w-md font-sans">
            Cryptographic verifiable credential signed by MOSIP sandbox. Proceed to presentation and trust validation.
          </p>
          <button
            onClick={onAdvanceFlow}
            disabled={isAdvancing}
            className="px-5 py-2 bg-[#ff4d2e] hover:bg-[#e03d20] text-white font-mono text-xs font-bold uppercase rounded-none transition-colors"
          >
            {isAdvancing ? 'VALIDATING...' : 'PRESENT & VERIFY (REAL)'}
          </button>
        </div>
      )}

      {/* Terminal Results Banner */}
      {isTerminal && (
        <div
          role="status"
          className={`p-3.5 border flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-xs ${
            flow.result === 'valid'
              ? 'bg-[#22c55e]/10 border-[#22c55e]/40 text-[#22c55e]'
              : flow.result === 'invalid'
              ? 'bg-[#ff4d2e]/10 border-[#ff4d2e]/40 text-[#ff4d2e]'
              : 'bg-[#e5a93c]/10 border-[#e5a93c]/40 text-[#e5a93c]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={16} />
            <span className="font-bold tracking-wider">
              {flow.result === 'valid'
                ? 'CRYPTOGRAPHIC VERIFICATION PASSED'
                : flow.result === 'invalid'
                ? 'VERIFICATION REJECTED (SIGNATURE_MISMATCH)'
                : 'CREDENTIAL EXPIRED (REVOKED_TIMESTAMP)'}
            </span>
          </div>
          <button
            onClick={onViewReport}
            className="px-3 py-1 bg-transparent hover:bg-[#ffffff0a] border border-current text-xs font-bold uppercase rounded-none transition-colors"
          >
            [VIEW CERTIFICATE]
          </button>
        </div>
      )}

      {/* Main Content: Step List or Mermaid Diagram */}
      {viewMode === 'diagram' ? (
        <SequenceDiagram flow={flow} onEventClick={onEventClick} />
      ) : (
        <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
          {PROTOCOL_STEPS.map((step, index) => {
            const event = flow.events.find((e) => e.step === step.id);
            const isCompleted = event?.status === 'success';
            const isPending = !event && (index === 0 || completedStepIds.includes(PROTOCOL_STEPS[index - 1].id));

            return (
              <button
                key={step.id}
                type="button"
                disabled={!event}
                onClick={() => event && onEventClick(event)}
                className={`w-full text-left flex items-start gap-3 p-3 border rounded-none transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#e5a93c] ${
                  event
                    ? 'cursor-pointer hover:bg-[#ffffff08] active:translate-y-0.5'
                    : 'opacity-40 cursor-default'
                } ${
                  isCompleted
                    ? 'bg-[#0f1115] border-[#ffffff14]'
                    : isPending
                    ? 'bg-[#e5a93c]/5 border-[#e5a93c]/50'
                    : 'bg-[#090a0c] border-[#ffffff0a]'
                }`}
              >
                <div className="mt-0.5">
                  {isCompleted ? (
                    <CheckCircle2 className="text-[#22c55e]" size={14} aria-hidden="true" />
                  ) : isPending ? (
                    <Loader2 className="text-[#e5a93c] animate-spin" size={14} aria-hidden="true" />
                  ) : (
                    <Circle className="text-[#535965]" size={14} aria-hidden="true" />
                  )}
                </div>

                <div className="flex-1 min-w-0 font-mono">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-xs font-bold ${isCompleted ? 'text-[#f0f2f5]' : isPending ? 'text-[#e5a93c]' : 'text-[#535965]'}`}>
                      {step.label}
                    </span>
                    <span className="text-[10px] text-[#8a919e] uppercase border border-[#ffffff14] px-1.5 py-0.2 bg-[#090a0c]">
                      {step.actor}
                    </span>
                  </div>

                  {event && (
                    <div className="text-[10px] text-[#535965] mt-1 flex items-center justify-between">
                      <span>EVENT_ID: #{event.id.slice(0, 8)}</span>
                      <span>{new Date(event.timestamp).toLocaleTimeString()}</span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LiveFlowTimeline;
