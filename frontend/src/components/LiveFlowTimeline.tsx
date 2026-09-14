import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';

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

const LiveFlowTimeline: React.FC<LiveFlowTimelineProps> = ({ flow, onEventClick, onAdvanceFlow, isAdvancing, onViewReport }) => {
  if (!flow) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-700 rounded-lg p-6 h-full">
        <p>Run a flow to see timeline</p>
      </div>
    );
  }

  // Determine current active step based on events
  const completedStepIds = flow.events.filter(e => e.status === 'success').map(e => e.step);
  
  return (
    <div className="flex flex-col gap-6 h-full">
      {/* If we have an offer and it's the latest step, show QR code (simulated) or a real-credential summary */}
      {flow.status === 'OFFER_CREATED' && flow.offer && flow.mode !== 'real' && (
        <div className="bg-slate-900 rounded-lg p-6 flex flex-col items-center justify-center border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.1)]">
          <p className="text-sm text-indigo-300 font-medium mb-4">Scan with Wallet App (or simulate)</p>
          <div className="p-4 bg-white rounded-xl mb-4">
            <QRCodeSVG value={JSON.stringify(flow.offer)} size={200} />
          </div>
          <button
            onClick={onAdvanceFlow}
            disabled={isAdvancing}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg font-medium transition-colors text-sm"
          >
            {isAdvancing ? 'Simulating...' : 'Simulate Full Flow (Hackathon Mode)'}
          </button>
        </div>
      )}

      {flow.status === 'CREDENTIAL_ISSUED' && flow.mode === 'real' && (
        <div className="bg-slate-900 rounded-lg p-6 flex flex-col items-center justify-center border border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.1)] gap-4">
          <p className="text-sm text-red-300 font-medium text-center">
            A real, signed Verifiable Credential was issued by the MOSIP Collab sandbox and is held by this BFF.
            <br />Click below to run a real OpenID4VP presentation + cryptographic verification.
          </p>
          <button
            onClick={onAdvanceFlow}
            disabled={isAdvancing}
            className="px-6 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-lg font-medium transition-colors text-sm"
          >
            {isAdvancing ? 'Verifying...' : 'Present & Verify (Real)'}
          </button>
        </div>
      )}

      {flow.status === 'FAILED' && (
        <div className="p-4 rounded-lg font-bold text-center border bg-red-500/20 text-red-400 border-red-500/50">
          <div className="text-lg">⚠️ Real Sandbox Call Failed</div>
          <p className="text-sm font-normal text-red-300/80 mt-2">
            The MOSIP Collab sandbox didn't complete this step. Check the Protocol Inspector for the raw error, or retry in Simulated Mode.
          </p>
        </div>
      )}

      {/* Result Banner if flow is complete */}
      {['VERIFIED_VALID', 'VERIFIED_INVALID', 'VERIFIED_EXPIRED'].includes(flow.status) && (
        <div className={`p-4 rounded-lg font-bold text-center border flex flex-col items-center justify-center gap-3 ${
          flow.result === 'valid' ? 'bg-green-500/20 text-green-400 border-green-500/50' :
          flow.result === 'invalid' ? 'bg-red-500/20 text-red-400 border-red-500/50' :
          'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
        }`}>
          <div className="text-lg">
            {flow.result === 'valid' ? '✅ Verification Valid' :
             flow.result === 'invalid' ? '❌ Verification Invalid' :
             '⚠️ Valid but Expired'}
          </div>
          <button 
            onClick={onViewReport}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-lg font-medium transition-colors border border-slate-600"
          >
            View Full Report
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto pr-4 space-y-4">
        {STEPS.map((step, index) => {
          const event = flow.events.find(e => e.step === step.id);
          const isCompleted = event?.status === 'success';
          const isPending = !event && (index === 0 || completedStepIds.includes(STEPS[index - 1].id));
          return (
            <div 
              key={step.id} 
              className={`flex items-start gap-4 p-4 rounded-lg border transition-all duration-200 ${
                event 
                  ? 'cursor-pointer hover:bg-slate-700/50 hover:border-slate-500 active:scale-[0.98]' 
                  : 'opacity-60 grayscale'
              } ${
                isCompleted ? 'bg-slate-800/80 border-green-500/30' : 
                isPending ? 'bg-indigo-900/20 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.1)]' : 
                'bg-slate-800/30 border-slate-700/50'
              }`}
              onClick={() => event && onEventClick(event)}
            >
              <div className="mt-0.5">
                {isCompleted ? (
                  <CheckCircle2 className="text-green-400" size={20} />
                ) : isPending ? (
                  <Loader2 className="text-indigo-400 animate-spin" size={20} />
                ) : (
                  <Circle className="text-slate-600" size={20} />
                )}
              </div>
              <div className="flex-1">
                <div className={`font-medium ${isCompleted ? 'text-slate-200' : isPending ? 'text-indigo-300' : 'text-slate-500'}`}>
                  {step.label}
                </div>
                {event && (
                  <div className="text-xs text-slate-400 mt-1">
                    Actor: <span className="text-slate-300 uppercase">{event.actor}</span> • 
                    Time: {new Date(event.timestamp).toLocaleTimeString()}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LiveFlowTimeline;
