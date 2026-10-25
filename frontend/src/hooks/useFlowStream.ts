import { useEffect, useRef } from 'react';
import { API_BASE } from '../api/client';

export type FlowStreamUpdate = { type: 'status' | 'event'; flowId: string; data: any };

/** Subscribes to a flow's live SSE event stream (GET /api/flows/:id/events/stream) for as
 * long as `flowId` is set, calling `onUpdate` for every status/event message received. */
export function useFlowStream(flowId: string | null, onUpdate: (update: FlowStreamUpdate) => void) {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    if (!flowId) return;
    const source = new EventSource(`${API_BASE}/flows/${flowId}/events/stream`);
    source.onmessage = (evt) => {
      try {
        onUpdateRef.current(JSON.parse(evt.data));
      } catch {
        /* ignore malformed keep-alive/comment lines */
      }
    };
    return () => source.close();
  }, [flowId]);
}
