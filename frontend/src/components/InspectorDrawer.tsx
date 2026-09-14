import React, { useState } from 'react';
import { Copy, Check, ChevronUp, ChevronDown } from 'lucide-react';
import type { FlowEvent } from '../types/flow';

interface InspectorDrawerProps {
  events: FlowEvent[];
  activeStep?: string;
}

/**
 * Section 21: Developer Protocol Inspector Drawer.
 * Slides from bottom, collapsed by default, provides IBM Plex Mono JSON inspection,
 * syntax tokens, and instant payload copying.
 */
export const InspectorDrawer: React.FC<InspectorDrawerProps> = ({ events, activeStep }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const activeEvent =
    events.find((e) => e.id === selectedEventId) ||
    events.find((e) => e.step === activeStep) ||
    events[events.length - 1];

  const handleCopy = () => {
    if (!activeEvent) return;
    navigator.clipboard.writeText(JSON.stringify(activeEvent.payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40">
      {/* Collapsed Bar / Trigger */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-panelLit/95 border-t border-line px-6 py-2.5 flex items-center justify-between cursor-pointer hover:bg-panelLit transition-colors backdrop-blur-md"
      >
        <div className="flex items-center gap-4">
          <span className="font-mono text-xs font-medium text-ink flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sealGold" />
            PROTOCOL INSPECTOR
          </span>
          <span className="font-mono text-[11px] text-inkDim">
            {events.length} PAYLOADS RECORDED
          </span>
        </div>

        <div className="flex items-center gap-3">
          {activeEvent && (
            <span className="font-mono text-[11px] text-inkDim hidden md:inline">
              STEP: <span className="text-ink">{activeEvent.step}</span>
            </span>
          )}
          <button className="text-inkDim hover:text-ink">
            {isOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>
      </div>

      {/* Expanded Inspector Panel */}
      {isOpen && (
        <div className="w-full h-80 bg-void/98 border-t border-line flex flex-col md:flex-row backdrop-blur-xl">
          {/* Step Selector List */}
          <div className="w-full md:w-72 border-r border-line overflow-y-auto max-h-36 md:max-h-full">
            <div className="p-3 border-b border-line/60 bg-panel text-[10px] font-mono text-inkDim uppercase tracking-wider">
              Recorded Protocol Steps
            </div>
            {events.length === 0 ? (
              <div className="p-4 font-mono text-xs text-inkDim text-center">
                Awaiting protocol traffic...
              </div>
            ) : (
              events.map((e) => {
                const isSelected = activeEvent?.id === e.id;
                return (
                  <button
                    key={e.id}
                    onClick={() => setSelectedEventId(e.id)}
                    className={`w-full text-left p-3 border-b border-line/30 transition-colors flex flex-col gap-1 focus:outline-none ${
                      isSelected ? 'bg-panelLit border-l-2 border-l-sealGold' : 'hover:bg-panelLit/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-ink">{e.step}</span>
                      <span
                        className={`font-mono text-[9px] uppercase px-1.5 py-0.5 rounded ${
                          e.status === 'success'
                            ? 'text-verified bg-verified/10'
                            : e.status === 'error'
                            ? 'text-rejected bg-rejected/10'
                            : 'text-pending bg-pending/10'
                        }`}
                      >
                        {e.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-inkDim font-mono">
                      <span>{e.actor}</span>
                      <span>{new Date(e.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* JSON Payload Viewer */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-3 border-b border-line/60 bg-panel flex items-center justify-between">
              <span className="font-mono text-[10px] text-inkDim uppercase tracking-wider">
                RAW JSON PAYLOAD // {activeEvent ? activeEvent.step : 'NONE'}
              </span>
              {activeEvent && (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 font-mono text-[11px] text-inkDim hover:text-ink transition-colors px-2 py-1 bg-void border border-line"
                >
                  {copied ? <Check size={12} className="text-verified" /> : <Copy size={12} />}
                  <span>{copied ? 'COPIED' : 'COPY RAW'}</span>
                </button>
              )}
            </div>
            <div className="flex-1 p-4 overflow-auto bg-void">
              {activeEvent ? (
                <pre className="font-mono text-xs text-ink/90 whitespace-pre-wrap leading-relaxed">
                  {JSON.stringify(activeEvent.payload, null, 2)}
                </pre>
              ) : (
                <div className="h-full flex items-center justify-center font-mono text-xs text-inkDim">
                  Select a step from the rail to inspect raw parameters
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
