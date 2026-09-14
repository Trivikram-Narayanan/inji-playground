import { useEffect, useRef } from 'react';

export type FlowStreamUpdate = {
  type: 'status' | 'event';
  flowId: string;
  data: Record<string, unknown>;
};

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3000/api';

/**
 * Subscribes to a flow's live SSE event stream (GET /api/flows/:id/events/stream).
 * Invokes onUpdate whenever a server-sent event or status packet arrives.
 */
export function useFlowStream(
  flowId: string | null,
  onUpdate: (update: FlowStreamUpdate) => void
) {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    if (!flowId) return;

    const source = new EventSource(`${API_BASE}/flows/${flowId}/events/stream`);

    source.onmessage = (evt: MessageEvent) => {
      try {
        const parsed = JSON.parse(evt.data);
        onUpdateRef.current(parsed);
      } catch {
        /* Ignore malformed heartbeat / comment frames */
      }
    };

    source.onerror = () => {
      // EventSource reconnects automatically unless explicitly closed
    };

    return () => {
      source.close();
    };
  }, [flowId]);
}
