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
      <div className="flex-1 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-700 rounded-lg p-6 h-full">
        <p>Run a flow to see timeline & sequence diagram</p>
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
      <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
        <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all ${
              viewMode === 'list'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <List size={14} />
            Step Timeline
          </button>
          <button
            onClick={() => setViewMode('diagram')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all ${
              viewMode === 'diagram'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <GitCommit size={14} />
            Mermaid Sequence Diagram
          </button>
        </div>

        <span className="text-xs text-slate-400">
          Steps: <span className="text-indigo-400 font-semibold">{completedStepIds.length}</span>/6
        </span>
      </div>

      {/* If we have an offer and it's the latest step, show Cross-device QR or Same-device Deep Link */}
      {flow.status === 'OFFER_CREATED' && flow.offer && flow.mode !== 'real' && (
        <div className="bg-slate-900/90 rounded-lg p-5 flex flex-col items-center justify-center border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.1)]">
          {/* Mode Switcher: Cross-Device vs Same-Device */}
          <div className="flex items-center gap-2 mb-4 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setDeviceMode('cross-device')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all ${
                deviceMode === 'cross-device' ? 'bg-slate-800 text-indigo-300 border border-slate-700' : 'text-slate-500'
              }`}
            >
              <QrCode size={13} />
              Cross-Device (QR Code)
            </button>
            <button
              onClick={() => setDeviceMode('same-device')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all ${
                deviceMode === 'same-device' ? 'bg-slate-800 text-indigo-300 border border-slate-700' : 'text-slate-500'
              }`}
            >
              <Smartphone size={13} />
              Same-Device (Deep-Link / Digital Credentials API)
            </button>
          </div>

          {deviceMode === 'cross-device' ? (
            <div className="flex flex-col items-center">
              <p className="text-xs text-indigo-300 font-medium mb-3">Scan with Inji Wallet Mobile</p>
              <div className="p-3 bg-white rounded-xl mb-4 shadow-md">
                <QRCodeSVG value={JSON.stringify(flow.offer)} size={170} />
              </div>
            </div>
          ) : (
            <div className="w-full max-w-md flex flex-col gap-3 mb-4">
              <p className="text-xs text-slate-300">
                In a same-device flow, the browser redirects directly to the wallet via custom URL scheme or W3C Digital Credentials API:
              </p>
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800 flex items-center justify-between gap-2">
                <code className="text-[11px] text-indigo-300 font-mono truncate">{deepLinkUri}</code>
                <button
                  onClick={handleCopyLink}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs flex items-center gap-1 shrink-0"
                >
                  {copiedLink ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
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
                  className="flex-1 text-center px-3 py-2 bg-indigo-900/50 hover:bg-indigo-900 text-indigo-300 rounded border border-indigo-500/40 text-xs font-medium"
                >
                  Open in Inji App (Deep Link)
                </a>
                <button
                  onClick={onAdvanceFlow}
                  className="flex-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 text-xs font-medium"
                >
                  Simulate Web API Call
                </button>
              </div>
            </div>
          )}

          <button
            onClick={onAdvanceFlow}
            disabled={isAdvancing}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg font-medium transition-colors text-sm shadow-md"
          >
            {isAdvancing ? 'Simulating...' : 'Simulate Full Flow (Hackathon Mode)'}
          </button>
        </div>
      )}

      {flow.status === 'CREDENTIAL_ISSUED' && flow.mode === 'real' && (
        <div className="bg-slate-900 rounded-lg p-5 flex flex-col items-center justify-center border border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.1)] gap-3">
          <p className="text-xs text-red-300 font-medium text-center">
            A real, signed Verifiable Credential was issued by the MOSIP Collab sandbox and is held by this BFF.
            <br />Click below to run a real OpenID4VP presentation + cryptographic verification.
          </p>
          <button
            onClick={onAdvanceFlow}
            disabled={isAdvancing}
            className="px-5 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-lg font-medium transition-colors text-xs"
          >
            {isAdvancing ? 'Verifying...' : 'Present & Verify (Real)'}
          </button>
        </div>
      )}

      {flow.status === 'FAILED' && (
        <div className="p-4 rounded-lg font-bold text-center border bg-red-500/20 text-red-400 border-red-500/50">
          <div className="text-base">⚠️ Real Sandbox Call Failed</div>
          <p className="text-xs font-normal text-red-300/80 mt-1.5">
            The MOSIP Collab sandbox didn't complete this step. Check the Protocol Inspector for the raw error, or retry in Simulated Mode.
          </p>
        </div>
      )}

      {/* Result Banner if flow is complete */}
      {['VERIFIED_VALID', 'VERIFIED_INVALID', 'VERIFIED_EXPIRED'].includes(flow.status) && (
        <div
          className={`p-4 rounded-lg font-bold text-center border flex flex-col items-center justify-center gap-2.5 ${
            flow.result === 'valid'
              ? 'bg-green-500/20 text-green-400 border-green-500/50'
              : flow.result === 'invalid'
              ? 'bg-red-500/20 text-red-400 border-red-500/50'
              : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
          }`}
        >
          <div className="text-base">
            {flow.result === 'valid'
              ? '✅ Verification Valid'
              : flow.result === 'invalid'
              ? '❌ Verification Invalid'
              : '⚠️ Valid but Expired'}
          </div>
          <button
            onClick={onViewReport}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs rounded-lg font-medium transition-colors border border-slate-600"
          >
            View Full Report
          </button>
        </div>
      )}

      {/* Main Content: Step List OR Mermaid Diagram */}
      {viewMode === 'diagram' ? (
        <SequenceDiagram flow={flow} onEventClick={onEventClick} />
      ) : (
        <div className="flex-1 overflow-y-auto pr-3 space-y-3">
          {STEPS.map((step, index) => {
            const event = flow.events.find((e) => e.step === step.id);
            const isCompleted = event?.status === 'success';
            const isPending = !event && (index === 0 || completedStepIds.includes(STEPS[index - 1].id));
            return (
              <div
                key={step.id}
                className={`flex items-start gap-3.5 p-3.5 rounded-lg border transition-all duration-200 ${
                  event
                    ? 'cursor-pointer hover:bg-slate-700/50 hover:border-slate-500 active:scale-[0.99]'
                    : 'opacity-60 grayscale'
                } ${
                  isCompleted
                    ? 'bg-slate-800/80 border-green-500/30'
                    : isPending
                    ? 'bg-indigo-900/20 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.1)]'
                    : 'bg-slate-800/30 border-slate-700/50'
                }`}
                onClick={() => event && onEventClick(event)}
              >
                <div className="mt-0.5">
                  {isCompleted ? (
                    <CheckCircle2 className="text-green-400" size={18} />
                  ) : isPending ? (
                    <Loader2 className="text-indigo-400 animate-spin" size={18} />
                  ) : (
                    <Circle className="text-slate-600" size={18} />
                  )}
                </div>
                <div className="flex-1">
                  <div
                    className={`text-sm font-medium ${
                      isCompleted ? 'text-slate-200' : isPending ? 'text-indigo-300' : 'text-slate-500'
                    }`}
                  >
                    {step.label}
                  </div>
                  {event && (
                    <div className="text-[11px] text-slate-400 mt-1">
                      Actor: <span className="text-slate-300 uppercase font-semibold">{event.actor}</span> • Time:{' '}
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
