import React from 'react';
import type { FlowEvent } from './LiveFlowTimeline';

interface ProtocolInspectorProps {
  event: FlowEvent | null;
}

const ProtocolInspector: React.FC<ProtocolInspectorProps> = ({ event }) => {
  if (!event) {
    return (
      <div className="flex-1 flex items-center justify-center text-inkDim border-2 border-dashed border-line rounded-xl p-6 bg-panel/50 font-ui text-sm h-full">
        Select a protocol exchange from the timeline or sequence diagram to inspect payload
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-panel rounded-xl border border-line overflow-hidden shadow-xl">
      <div className="px-5 py-3.5 border-b border-line bg-panelLit flex justify-between items-center">
        <div>
          <h3 className="font-mono text-sm font-semibold text-ink tracking-tight">{event.step}</h3>
          <p className="text-xs text-inkDim font-mono mt-0.5">
            Actor: <span className="text-accent uppercase font-medium">{event.actor}</span>
          </p>
        </div>
        <span
          className={`px-2.5 py-1 text-[11px] rounded-full font-mono font-medium border ${
            event.status === 'success'
              ? 'bg-verified/15 text-verified border-verified/30'
              : event.status === 'error'
              ? 'bg-rejected/15 text-rejected border-rejected/30'
              : 'bg-pending/15 text-pending border-pending/30'
          }`}
        >
          {event.status.toUpperCase()}
        </span>
      </div>

      <div className="flex-1 overflow-auto p-4 bg-void/70 custom-scrollbar">
        <pre className="text-xs text-ink/90 font-mono whitespace-pre-wrap break-words leading-relaxed selection:bg-accent/30 selection:text-ink">
          {JSON.stringify(typeof event.payload === 'string' ? JSON.parse(event.payload) : event.payload, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default ProtocolInspector;
