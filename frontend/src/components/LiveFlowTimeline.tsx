import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle2, Circle, Loader2, QrCode, Smartphone, Copy, Check, GitCommit, List } from 'lucide-react';
import SequenceDiagram from './SequenceDiagram';

export type FlowEvent = {
  id: string;
  step: string;
  actor: string;
  timestamp: string;
  payload: any;
  status: 'success' | 'pending' | 'error';
};

export type FlowStatus = {
  id: string;
  status: string;
  mode?: string;
  result?: string;
  offer?: any;
  events: FlowEvent[];
};

interface LiveFlowTimelineProps {
  flow: FlowStatus | null;
  onEventClick: (event: FlowEvent) => void;
  onAdvanceFlow: () => void;
  isAdvancing: boolean;
  onViewReport: () => void;
}

export const TERMINAL_STATUSES = ['VERIFIED_VALID', 'VERIFIED_INVALID', 'VERIFIED_EXPIRED', 'FAILED'];

const STEPS = [
  { id: 'credential_offer', label: 'Credential Offer Created' },
  { id: 'token_exchange', label: 'Token Exchanged' },
  { id: 'credential_issued', label: 'Credential Issued' },
  { id: 'authorization_request', label: 'Presentation Requested' },
  { id: 'presentation', label: 'Credential Presented' },
  { id: 'verification_result', label: 'Verification Complete' },
];

const LiveFlowTimeline: React.FC<LiveFlowTimelineProps> = ({
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
      <div className="flex-1 flex flex-col items-center justify-center text-inkDim border-2 border-dashed border-line rounded-xl p-6 bg-panel/50 font-ui text-sm h-full">
        <p>Configure and launch an exchange to observe live protocol telemetry</p>
      </div>
    );
  }

  // Determine current active step based on events
  const completedStepIds = flow.events.filter((e) => e.status === 'success').map((e) => e.step);

  // Construct standard deep-links for same-device simulation
  const deepLinkUri = flow.offer
    ? `openid-credential-offer://?credential_offer=${encodeURIComponent(JSON.stringify(flow.offer))}`
    : `openid-credential-offer://`;
  const injiAppScheme = flow.offer
    ? `inji://credential-offer?data=${encodeURIComponent(JSON.stringify(flow.offer))}`
    : `inji://`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(deepLinkUri);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="flex flex-col gap-5 h-full">
      {/* Top View Selector: Step List vs Interactive Sequence Diagram */}
      <div className="flex items-center justify-between border-b border-line pb-3">
        <div className="flex items-center gap-1 bg-panelLit p-1 rounded-xl border border-line text-xs font-mono">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              viewMode === 'list'
                ? 'bg-panel text-ink border border-line shadow-sm'
                : 'text-inkDim hover:text-ink hover:bg-panel'
            }`}
          >
            <List size={13} />
            Step Timeline
          </button>
          <button
            onClick={() => setViewMode('diagram')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              viewMode === 'diagram'
                ? 'bg-panel text-ink border border-line shadow-sm'
                : 'text-inkDim hover:text-ink hover:bg-panel'
            }`}
          >
            <GitCommit size={13} />
            Mermaid Diagram
          </button>
        </div>

        <span className="text-xs font-mono text-inkDim">
          Transit: <span className="text-ink font-bold">{completedStepIds.length}</span>/6
        </span>
      </div>

      {/* If we have an offer and it's the latest step, show Cross-device QR or Same-device Deep Link */}
      {flow.status === 'OFFER_CREATED' && flow.offer && flow.mode !== 'real' && (
        <div className="bg-panelLit/70 rounded-2xl p-5 flex flex-col items-center justify-center border border-line shadow-xl">
          {/* Mode Switcher: Cross-Device vs Same-Device */}
          <div className="flex items-center gap-2 mb-4 bg-void p-1 rounded-xl border border-line text-xs font-mono">
            <button
              onClick={() => setDeviceMode('cross-device')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                deviceMode === 'cross-device' ? 'bg-panelLit text-ink border border-line shadow-sm' : 'text-inkDim hover:text-ink'
              }`}
            >
              <QrCode size={13} />
              Cross-Device (QR)
            </button>
            <button
              onClick={() => setDeviceMode('same-device')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                deviceMode === 'same-device' ? 'bg-panelLit text-ink border border-line shadow-sm' : 'text-inkDim hover:text-ink'
              }`}
            >
              <Smartphone size={13} />
              Same-Device (Deep-Link)
            </button>
          </div>

          {deviceMode === 'cross-device' ? (
            <div className="flex flex-col items-center">
              <p className="text-xs text-inkDim font-mono mb-3">Scan via Inji Mobile Wallet</p>
              <div className="p-3 bg-white rounded-xl mb-4 shadow-md">
                <QRCodeSVG value={JSON.stringify(flow.offer)} size={160} />
              </div>
            </div>
          ) : (
            <div className="w-full max-w-md flex flex-col gap-3 mb-4">
              <p className="text-xs text-inkDim leading-relaxed">
                Same-device protocol redirect via custom app scheme and W3C Digital Credentials API:
              </p>
              <div className="bg-void p-2.5 rounded-xl border border-line flex items-center justify-between gap-2">
                <code className="text-[11px] text-ink font-mono truncate">{deepLinkUri}</code>
                <button
                  onClick={handleCopyLink}
                  className="px-2.5 py-1 bg-panel hover:bg-line text-ink rounded-lg text-xs font-mono flex items-center gap-1 shrink-0 border border-line cursor-pointer"
                >
                  {copiedLink ? <Check size={12} className="text-verified" /> : <Copy size={12} />}
                  {copiedLink ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={injiAppScheme}
                  onClick={(e) => {
                    e.preventDefault();
                    onAdvanceFlow();
                  }}
                  className="flex-1 text-center px-3 py-2 bg-panel hover:bg-panelLit text-ink rounded-xl border border-line text-xs font-medium cursor-pointer"
                >
                  Open in Inji App
                </a>
                <button
                  onClick={onAdvanceFlow}
                  className="flex-1 px-3 py-2 bg-panel hover:bg-panelLit text-ink rounded-xl border border-line text-xs font-medium cursor-pointer"
                >
                  Simulate Web API
                </button>
              </div>
            </div>
          )}

          <button
            onClick={onAdvanceFlow}
            disabled={isAdvancing}
            className="px-6 py-2.5 bg-accent hover:bg-accent/90 disabled:opacity-50 text-white rounded-xl font-medium transition-all text-xs shadow-md cursor-pointer"
          >
            {isAdvancing ? 'Simulating Transit...' : 'Simulate Protocol Flow'}
          </button>
        </div>
      )}

      {flow.status === 'CREDENTIAL_ISSUED' && flow.mode === 'real' && (
        <div className="bg-panelLit rounded-2xl p-5 flex flex-col items-center justify-center border border-line gap-3 shadow-lg">
          <p className="text-xs text-inkDim font-mono text-center leading-relaxed">
            Real signed credential obtained from MOSIP Collab sandbox.
            <br />Execute cryptographic OpenID4VP presentation and relying party verification:
          </p>
          <button
            onClick={onAdvanceFlow}
            disabled={isAdvancing}
            className="px-5 py-2.5 bg-accent hover:bg-accent/90 disabled:opacity-50 text-white rounded-xl font-medium transition-all text-xs cursor-pointer"
          >
            {isAdvancing ? 'Verifying...' : 'Verify Cryptographic Proof (Real)'}
          </button>
        </div>
      )}

      {flow.status === 'FAILED' && (
        <div className="p-4 rounded-xl font-mono text-center border bg-rejected/10 text-rejected border-rejected/30">
          <div className="text-sm font-bold">⚠️ Sandbox Exchange Failed</div>
          <p className="text-xs text-inkDim mt-1 leading-relaxed">
            External sandbox did not complete exchange. Check Protocol Inspector for raw diagnostic payload.
          </p>
        </div>
      )}

      {/* Result Banner if flow is complete */}
      {['VERIFIED_VALID', 'VERIFIED_INVALID', 'VERIFIED_EXPIRED'].includes(flow.status) && (
        <div
          className={`p-5 rounded-2xl font-display text-center border flex flex-col items-center justify-center gap-3 ${
            flow.result === 'valid'
              ? 'bg-verified/10 text-verified border-verified/30'
              : flow.result === 'invalid'
              ? 'bg-rejected/10 text-rejected border-rejected/30'
              : 'bg-pending/10 text-pending border-pending/30'
          }`}
        >
          <div className="text-2xl font-bold tracking-tight">
            {flow.result === 'valid'
              ? 'VERIFIED'
              : flow.result === 'invalid'
              ? 'REJECTED'
              : 'EXPIRED'}
          </div>
          <p className="text-xs font-sans text-inkDim max-w-sm">
            {flow.result === 'valid'
              ? 'Cryptographic integrity and claim signatures confirmed across boundary modules.'
              : flow.result === 'invalid'
              ? 'Presentation signature or claim integrity failed verification constraints.'
              : 'Signatures valid, but credential timestamp indicates expiration.'}
          </p>
          <button
            onClick={onViewReport}
            className="px-4 py-2 bg-panel hover:bg-panelLit text-ink text-xs rounded-xl font-medium transition-all border border-line shadow-sm cursor-pointer"
          >
            Open Case Dossier
          </button>
        </div>
      )}

      {/* Main Content: Step List OR Mermaid Diagram */}
      {viewMode === 'diagram' ? (
        <SequenceDiagram flow={flow} onEventClick={onEventClick} />
      ) : (
        <div className="flex-1 overflow-y-auto pr-2 space-y-2.5 custom-scrollbar">
          {STEPS.map((step, index) => {
            const event = flow.events.find((e) => e.step === step.id);
            const isCompleted = event?.status === 'success';
            const isPending = !event && (index === 0 || completedStepIds.includes(STEPS[index - 1].id));
            return (
              <div
                key={step.id}
                className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all duration-200 ${
                  event
                    ? 'cursor-pointer hover:bg-panelLit hover:border-accent/40 active:scale-[0.99]'
                    : 'opacity-40 grayscale'
                } ${
                  isCompleted
                    ? 'bg-panel border-verified/30'
                    : isPending
                    ? 'bg-panelLit border-accent shadow-[0_0_15px_rgba(91,127,255,0.1)]'
                    : 'bg-panel/40 border-line'
                }`}
                onClick={() => event && onEventClick(event)}
              >
                <div className="mt-0.5">
                  {isCompleted ? (
                    <CheckCircle2 className="text-verified" size={17} />
                  ) : isPending ? (
                    <Loader2 className="text-accent animate-spin" size={17} />
                  ) : (
                    <Circle className="text-line" size={17} />
                  )}
                </div>
                <div className="flex-1">
                  <div
                    className={`text-xs font-mono font-medium ${
                      isCompleted ? 'text-ink' : isPending ? 'text-accent' : 'text-inkDim'
                    }`}
                  >
                    {step.label}
                  </div>
                  {event && (
                    <div className="text-[10px] font-mono text-inkDim mt-1">
                      Actor: <span className="text-sealGold font-semibold uppercase">{event.actor}</span> •{' '}
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LiveFlowTimeline;
