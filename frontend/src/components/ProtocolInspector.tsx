import React from 'react';
import type { FlowEvent } from './LiveFlowTimeline';

interface ProtocolInspectorProps {
  event: FlowEvent | null;
}

const ProtocolInspector: React.FC<ProtocolInspectorProps> = ({ event }) => {
  if (!event) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-500 border-2 border-dashed border-slate-700 rounded-lg p-6 bg-slate-900/50 h-full">
        Select an event from the timeline to inspect payload
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-900/80 rounded-lg border border-slate-700 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
        <div>
          <h3 className="font-medium text-slate-200">{event.step}</h3>
          <p className="text-xs text-slate-400 mt-0.5">Actor: {event.actor}</p>
        </div>
        <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${
          event.status === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
          event.status === 'error' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
          'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
        }`}>
          {event.status.toUpperCase()}
        </span>
      </div>
      
      <div className="flex-1 overflow-auto p-4 custom-scrollbar">
        <pre className="text-sm text-slate-300 font-mono whitespace-pre-wrap break-words">
          {JSON.stringify(JSON.parse(event.payload), null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default ProtocolInspector;
