import React, { useState } from 'react';
import { Selector } from './Selector';
import { LiveFlowTimeline, TERMINAL_STATUSES } from './LiveFlowTimeline';
import { ReportView } from './ReportView';
import { ActRail } from './ActRail';
import { InspectorDrawer } from './InspectorDrawer';
import type { FlowEvent, FlowStatus, InteropReport } from '../types/flow';
import { useFlowStream, type FlowStreamUpdate } from '../hooks/useFlowStream';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3000/api';

/**
 * MainFlow orchestration container.
 * Coordinates user selection, live SSE streaming events, Act I/II/III progression,
 * and bottom inspector drawer updates.
 */
export const MainFlow: React.FC = () => {
  const [flowId, setFlowId] = useState<string | null>(null);
  const [flowStatus, setFlowStatus] = useState<FlowStatus | null>(null);
  const [events, setEvents] = useState<FlowEvent[]>([]);
  const [report, setReport] = useState<InteropReport | null>(null);
  const [activeFormat, setActiveFormat] = useState('w3c-vc-jsonld');
  const [isLoading, setIsLoading] = useState(false);

  // Subscribe to live SSE events from backend
  useFlowStream(flowId, (update: FlowStreamUpdate) => {
    if (update.type === 'event' && update.data) {
      setEvents((prev) => [...prev, update.data as unknown as FlowEvent]);
    } else if (update.type === 'status' && update.data) {
      setFlowStatus((prev) => ({
        ...prev,
        ...(update.data as unknown as FlowStatus),
      }));

      // Check if reached a terminal status to fetch final verification report
      const incomingStatus = (update.data as { status?: string }).status;
      if (
        incomingStatus &&
        (TERMINAL_STATUSES as readonly string[]).includes(incomingStatus) &&
        flowId
      ) {
        fetch(`${API_BASE}/flows/${flowId}/report`)
          .then((res) => res.json())
          .then((rep: InteropReport) => setReport(rep))
          .catch(() => {});
      }
    }
  });

  const handleStartFlow = async (config: {
    issuer: string;
    wallet: string;
    verifier: string;
    format: string;
    mode: 'simulated' | 'real';
    tamperMode: boolean;
    tamperType?: 'claim-corruption' | 'bad-signature' | 'expired';
  }) => {
    setIsLoading(true);
    setActiveFormat(config.format);
    try {
      const res = await fetch(`${API_BASE}/flows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      setFlowId(data.flowId);
      setEvents([]);
      setReport(null);

      // Fetch initial flow status
      const statusRes = await fetch(`${API_BASE}/flows/${data.flowId}`);
      const statusData = await statusRes.json();
      setFlowStatus(statusData);
    } catch (err) {
      console.error('Failed to initiate flow:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdvance = async () => {
    if (!flowId) return;
    try {
      await fetch(`${API_BASE}/flows/${flowId}/advance`, { method: 'POST' });
    } catch (err) {
      console.error('Failed to advance flow step:', err);
    }
  };

  const handleReset = () => {
    setFlowId(null);
    setFlowStatus(null);
    setEvents([]);
    setReport(null);
  };

  // Determine current narrative act
  const currentAct: 1 | 2 | 3 = report
    ? 3
    : events.some((e) => e.step === 'authorization_request' || e.step === 'presentation')
    ? 2
    : 1;

  const canAdvance =
    flowId !== null &&
    !report &&
    flowStatus?.status !== 'VERIFIED_VALID' &&
    flowStatus?.status !== 'FAILED';

  return (
    <div className="w-full min-h-[calc(100vh-3.5rem)] flex flex-col justify-between pb-24">
      {/* Chapter Rail */}
      <ActRail
        currentAct={currentAct}
        canAdvance={canAdvance}
        onAdvance={handleAdvance}
      />

      {/* Main Narrative Progression */}
      <div className="flex-1 flex flex-col justify-center">
        {!flowId ? (
          <Selector onStartFlow={handleStartFlow} isLoading={isLoading} />
        ) : report ? (
          <ReportView report={report} onReset={handleReset} />
        ) : (
          flowStatus && (
            <LiveFlowTimeline
              flowStatus={flowStatus}
              events={events}
              format={activeFormat}
            />
          )
        )}
      </div>

      {/* Persistent Developer Protocol Inspector Drawer */}
      <InspectorDrawer
        events={events}
        activeStep={events[events.length - 1]?.step}
      />
    </div>
  );
};
