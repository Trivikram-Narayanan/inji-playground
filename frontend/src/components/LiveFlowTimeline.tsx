import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, GitCommit, List, Loader2 } from 'lucide-react';
import SequenceDiagram from './SequenceDiagram';
import VerdictSeal from './VerdictSeal';

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
  { id: 'credential_offer', label: 'Credential Offer', actor: 'Issuer' },
  { id: 'token_exchange', label: 'Token Exchange', actor: 'Wallet' },
  { id: 'credential_issued', label: 'Credential Issued', actor: 'Issuer' },
  { id: 'authorization_request', label: 'Presentation Request', actor: 'Verifier' },
  { id: 'presentation', label: 'Credential Presented', actor: 'Wallet' },
  { id: 'verification_result', label: 'Verification Complete', actor: 'Verifier' },
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
      <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
        <div className="w-px h-12 bg-line mx-auto mb-6" />
        <p className="text-xs font-mono text-inkDim tracking-wide">
          Configure and launch an exchange
          <br />to observe live protocol telemetry
        </p>
      </div>
    );
  }

  const completedStepIds = flow.events.filter((e) => e.status === 'success').map((e) => e.step);

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

  // Determine verdict
  const verdict =
    flow.result === 'valid'
      ? 'verified'
      : flow.result === 'invalid'
      ? 'rejected'
      : flow.result === 'valid-but-expired'
      ? 'expired'
      : null;

  return (
    <div className="flex flex-col gap-0 h-full">
      {/* View mode switcher — minimal text tabs */}
      <div className="flex items-center justify-between pb-4 border-b border-line mb-6">
        <div className="flex items-center gap-0">
          {[
            { id: 'list', icon: List, label: 'Steps' },
            { id: 'diagram', icon: GitCommit, label: 'Diagram' },
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setViewMode(id as 'list' | 'diagram')}
              className={`relative flex items-center gap-1.5 px-3 py-2 text-xs font-mono transition-colors duration-150 ${
                viewMode === id ? 'text-ink' : 'text-inkDim hover:text-ink/70'
              }`}
              data-cursor="pointer"
            >
              <Icon size={11} />
              {label}
              {viewMode === id && <span className="absolute bottom-0 left-0 right-0 h-px bg-ink" />}
            </button>
          ))}
        </div>
        <span className="text-[10px] font-mono text-inkDim">
          {completedStepIds.length}<span className="text-line">/6</span>
        </span>
      </div>

      {/* ── QR / Transit section — Act II ─────────────────────────────────── */}
      {flow.status === 'OFFER_CREATED' && flow.offer && flow.mode !== 'real' && (
        <div className="mb-6">
          {/* Device mode tabs */}
          <div className="flex items-center gap-0 mb-4 border-b border-line pb-0">
            {[
              { id: 'cross-device', label: 'Cross-Device (QR)' },
              { id: 'same-device', label: 'Same-Device' },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setDeviceMode(id as typeof deviceMode)}
                className={`relative px-3 py-2 text-xs font-mono transition-colors duration-150 ${
                  deviceMode === id ? 'text-ink' : 'text-inkDim hover:text-ink/70'
                }`}
                data-cursor="pointer"
              >
                {label}
                {deviceMode === id && <span className="absolute bottom-0 left-0 right-0 h-px bg-ink" />}
              </button>
            ))}
          </div>

          {deviceMode === 'cross-device' ? (
            <div className="flex items-start gap-6 py-4">
              {/* QR — clean, no rounded frame */}
              <div className="p-3 bg-white shrink-0">
                <QRCodeSVG value={JSON.stringify(flow.offer)} size={120} />
              </div>
              <div className="flex flex-col justify-center gap-2">
                <p className="text-xs font-mono text-inkDim">Scan via Inji Mobile Wallet</p>
                <p className="text-[10px] font-mono text-inkDim/50 max-w-[200px] leading-relaxed">
                  Open the credential offer on your device to complete issuance
                </p>
                <button
                  onClick={onAdvanceFlow}
                  disabled={isAdvancing}
                  className="mt-2 text-xs font-mono text-accent border-b border-accent/40 pb-px hover:text-white hover:border-white/60 transition-colors duration-150 disabled:opacity-40 text-left w-fit"
                  data-cursor="pointer"
                >
                  {isAdvancing ? 'Simulating…' : '→ Simulate protocol flow'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 py-4">
              <p className="text-[10px] font-mono text-inkDim leading-relaxed">
                Same-device redirect via OpenID4VCI app scheme:
              </p>
              <div className="flex items-center gap-2 border-b border-line pb-2">
                <code className="text-[10px] text-inkDim font-mono truncate flex-1">{deepLinkUri}</code>
                <button
                  onClick={handleCopyLink}
                  className="shrink-0 p-1 text-inkDim hover:text-ink transition-colors"
                  data-cursor="pointer"
                >
                  {copiedLink ? <Check size={12} className="text-verified" /> : <Copy size={12} />}
                </button>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={injiAppScheme}
                  onClick={(e) => { e.preventDefault(); onAdvanceFlow(); }}
                  className="text-xs font-mono text-inkDim border-b border-inkDim/30 pb-px hover:text-ink hover:border-ink/60 transition-colors"
                  data-cursor="pointer"
                >
                  Open in Inji App
                </a>
                <span className="text-line text-xs">·</span>
                <button
                  onClick={onAdvanceFlow}
                  className="text-xs font-mono text-accent border-b border-accent/40 pb-px hover:text-ink hover:border-ink/60 transition-colors"
                  data-cursor="pointer"
                >
                  Simulate Web API
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Real-mode advance */}
      {flow.status === 'CREDENTIAL_ISSUED' && flow.mode === 'real' && (
        <div className="mb-6 py-4 border-b border-line">
          <p className="text-xs font-mono text-inkDim mb-3">
            Real signed credential obtained from MOSIP Collab sandbox.
          </p>
          <button
            onClick={onAdvanceFlow}
            disabled={isAdvancing}
            className="text-xs font-mono text-accent border-b border-accent/40 pb-px hover:text-ink hover:border-ink/60 transition-colors disabled:opacity-40"
            data-cursor="pointer"
          >
            {isAdvancing ? 'Verifying…' : '→ Execute cryptographic verification (Real)'}
          </button>
        </div>
      )}

      {/* Failed state */}
      {flow.status === 'FAILED' && (
        <div className="mb-6 py-4 border-b border-line">
          <p className="text-xs font-mono text-rejected">
            Sandbox exchange failed — inspect Protocol Inspector for diagnostic payload.
          </p>
        </div>
      )}

      {/* ── Verdict — Act III cinematic moment ─────────────────────────────── */}
      {verdict && (
        <VerdictSeal
          verdict={verdict}
          visible={!!verdict}
          onViewReport={onViewReport}
        />
      )}

      {/* ── Main content: Step list or Mermaid diagram ────────────────────── */}
      {viewMode === 'diagram' ? (
        <div className="flex-1 mermaid-wrapper">
          <SequenceDiagram flow={flow} onEventClick={onEventClick} />
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-0">
          {STEPS.map((step, index) => {
            const event = flow.events.find((e) => e.step === step.id);
            const isCompleted = event?.status === 'success';
            const isPending = !event && (index === 0 || completedStepIds.includes(STEPS[index - 1].id));
            const isActive = isPending;

            return (
              <div
                key={step.id}
                className={`step-appear flex items-start gap-4 py-3 border-b border-line/40 last:border-b-0 transition-opacity duration-200 ${
                  !event && !isPending ? 'opacity-25' : 'opacity-100'
                } ${event ? 'cursor-pointer' : ''}`}
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => event && onEventClick(event)}
                data-cursor={event ? 'pointer' : undefined}
              >
                {/* Step indicator */}
                <div className="mt-1 shrink-0 flex flex-col items-center gap-1">
                  <div
                    className={`w-[6px] h-[6px] rounded-full transition-all duration-300 ${
                      isCompleted
                        ? 'bg-verified'
                        : isActive
                        ? 'bg-accent'
                        : 'bg-line'
                    }`}
                  />
                  {/* Connecting line */}
                  {index < STEPS.length - 1 && (
                    <div
                      className={`w-px flex-1 min-h-[20px] transition-colors duration-500 ${
                        isCompleted ? 'bg-verified/30' : 'bg-line/40'
                      }`}
                    />
                  )}
                </div>

                {/* Step content */}
                <div className="flex-1 pb-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <span
                      className={`text-xs font-mono transition-colors duration-200 ${
                        isCompleted ? 'text-ink' : isActive ? 'text-accent' : 'text-inkDim/60'
                      }`}
                    >
                      {step.label}
                    </span>
                    {isActive && !isCompleted && (
                      <Loader2 size={10} className="text-accent animate-spin shrink-0" />
                    )}
                  </div>
                  {event && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] font-mono text-inkDim/50 uppercase tracking-wider">
                        {event.actor}
                      </span>
                      <span className="text-line text-[9px]">·</span>
                      <span className="text-[9px] font-mono text-inkDim/50">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
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
