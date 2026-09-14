import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check } from 'lucide-react';
import type { FlowEvent } from './LiveFlowTimeline';

/**
 * InspectorDrawer — slides up from bottom when an event is selected.
 * IBM Plex Mono, syntax-highlighted JSON, copy button.
 * This is a developer tool — precision and legibility first.
 */

interface InspectorDrawerProps {
  event: FlowEvent | null;
  onClose: () => void;
}

// ── Minimal JSON syntax highlighter ──────────────────────────────────────────
function highlightJSON(json: string): string {
  return json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
      (match) => {
        let cls = 'color:#5B7FFF'; // number
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = 'color:#EDEFF3'; // key
          } else {
            cls = 'color:#3FCC8F'; // string
          }
        } else if (/true|false/.test(match)) {
          cls = 'color:#D8A63D'; // boolean
        } else if (/null/.test(match)) {
          cls = 'color:#7C8494'; // null
        }
        return `<span style="${cls}">${match}</span>`;
      }
    );
}

function formatPayload(payload: any): string {
  try {
    const parsed = typeof payload === 'string' ? JSON.parse(payload) : payload;
    return JSON.stringify(parsed, null, 2);
  } catch {
    return String(payload);
  }
}

const InspectorDrawer: React.FC<InspectorDrawerProps> = ({ event, onClose }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!event) return;
    navigator.clipboard.writeText(formatPayload(event.payload));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusColor =
    event?.status === 'success'
      ? '#3FCC8F'
      : event?.status === 'error'
      ? '#E4574F'
      : '#D8A63D';

  return (
    <AnimatePresence>
      {event && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-void/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 glass flex flex-col"
            style={{ maxHeight: '55vh' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 400, mass: 0.8 }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2 shrink-0">
              <div className="w-8 h-px bg-line" />
            </div>

            {/* Header */}
            <div className="px-6 pb-4 border-b border-line shrink-0 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: statusColor }}
                  />
                  <h3 className="text-sm font-mono font-medium text-ink">
                    {event.step}
                  </h3>
                  <span
                    className="text-[9px] font-mono px-1.5 py-0.5 border tracking-widest uppercase"
                    style={{ color: statusColor, borderColor: `${statusColor}40` }}
                  >
                    {event.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-mono text-inkDim">
                  <span className="uppercase tracking-wider">{event.actor}</span>
                  <span className="text-line">·</span>
                  <span>{new Date(event.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-[10px] font-mono text-inkDim hover:text-ink transition-colors"
                  data-cursor="pointer"
                >
                  {copied ? (
                    <><Check size={11} className="text-verified" /><span>Copied</span></>
                  ) : (
                    <><Copy size={11} /><span>Copy</span></>
                  )}
                </button>
                <button
                  onClick={onClose}
                  className="text-inkDim hover:text-ink text-xl leading-none transition-colors"
                  data-cursor="pointer"
                >
                  ×
                </button>
              </div>
            </div>

            {/* JSON body — syntax highlighted */}
            <div className="flex-1 overflow-auto p-6">
              <pre
                className="text-xs font-mono leading-relaxed whitespace-pre-wrap break-words"
                style={{ color: '#EDEFF3' }}
                dangerouslySetInnerHTML={{
                  __html: highlightJSON(formatPayload(event.payload)),
                }}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default InspectorDrawer;
