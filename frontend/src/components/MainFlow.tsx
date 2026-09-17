import React, { useState, useEffect } from 'react';
import Selector from './Selector';
import LiveFlowTimeline from './LiveFlowTimeline';
import ProtocolInspector from './ProtocolInspector';
import ReportView from './ReportView';
import { useFlowStream } from '../hooks/useFlowStream';
import { api } from '../api/client';
import type { FlowConfig, FlowStatus, FlowEvent, InteropReport } from '../types';
import { TERMINAL_STATUSES } from '../types';
import { LabCard, BracketBadge } from './ui/LabPrimitives';
import { AlertTriangle } from 'lucide-react';

export const MainFlow: React.FC = () => {
  const [flow, setFlow] = useState<FlowStatus | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<FlowEvent | null>(null);
  const [report, setReport] = useState<InteropReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const fetchReport = async (flowId: string) => {
    try {
      const data = await api.getFlowReport(flowId);
      setReport(data);
    } catch (err) {
      console.error('Failed to fetch report:', err);
    }
  };

  const fetchFlowData = async (flowId: string) => {
    try {
      const [statusData, eventsData] = await Promise.all([
        api.getFlow(flowId),
        api.getFlowEvents(flowId),
      ]);
      setFlow({ ...statusData, events: eventsData.events });
      if (TERMINAL_STATUSES.includes(statusData.status as any)) {
        await fetchReport(flowId);
      }
    } catch (err) {
      console.error('Failed to fetch flow:', err);
    }
  };

  useFlowStream(flow?.id ?? null, (update) => {
    if (update.type === 'event') {
      setFlow((prev) => {
        if (!prev || prev.events.some((e) => e.id === update.data.id)) return prev;
        return { ...prev, events: [...prev.events, update.data] };
      });
    } else if (update.type === 'status') {
      setFlow((prev) => (prev ? { ...prev, status: update.data.status, result: update.data.result ?? prev.result } : prev));
      if (TERMINAL_STATUSES.includes(update.data.status as any) && flow?.id) {
        fetchReport(flow.id);
      }
    }
  });

  const handleRunTest = async (config: FlowConfig) => {
    try {
      setIsLoading(true);
      setSelectedEvent(null);
      setReport(null);
      setShowReport(false);
      setStartError(null);
      const res = await api.createFlow(config);
      const { flowId } = res;

      await fetchFlowData(flowId);
    } catch (error: any) {
      console.error('Error starting flow:', error);
      const data = error?.response?.data;
      setStartError(data?.error || 'Failed to start the test run.');
      if (data?.flowId) {
        await fetchFlowData(data.flowId);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!startError) return;
    const timer = setTimeout(() => setStartError(null), 8000);
    return () => clearTimeout(timer);
  }, [startError]);

  const handleAdvanceFlow = async () => {
    if (!flow?.id) return;
    try {
      setIsAdvancing(true);
      await api.advanceFlow(flow.id);
      await fetchFlowData(flow.id);
    } catch (error) {
      console.error('Error advancing flow:', error);
    } finally {
      setIsAdvancing(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top: Section Header & Selector Card */}
      <LabCard
        title="EXPERIMENT RUNTIME MATRIX"
        subtitle="Specify OpenID4VC participants, credential profile, and adversarial mutations"
        badge={
          <BracketBadge variant={flow?.mode === 'real' ? 'crimson' : 'gold'}>
            {flow?.mode === 'real' ? 'MOSIP LIVE' : 'SIMULATION READY'}
          </BracketBadge>
        }
      >
        <Selector onRunTest={handleRunTest} isLoading={isLoading} />
      </LabCard>

      {/* Start Error Banner */}
      {startError && (
        <div role="alert" className="animate-slide-in-fade bg-[#ff4d2e]/10 border border-[#ff4d2e]/40 text-[#ff4d2e] p-4 text-xs font-mono flex items-start justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={16} className="shrink-0" />
            <div>
              <span className="font-bold uppercase tracking-wider block">EXECUTION_ERROR :: TRANSACTION_ABORTED</span>
              <span className="text-[#f0f2f5] mt-0.5 block font-sans">{startError}</span>
            </div>
          </div>
          <button
            onClick={() => setStartError(null)}
            aria-label="Dismiss error"
            className="text-[#ff4d2e] hover:text-white text-base leading-none"
          >
            &times;
          </button>
        </div>
      )}

      {/* Split Console: Live Timeline & Protocol Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[500px]">
        <LabCard
          id="live-timeline-section"
          title="PROTOCOL TRANSACTION TIMELINE"
          subtitle="Real-time message transactions and state transitions across OpenID4VCI & OpenID4VP"
          badge={
            flow?.mode === 'real' ? (
              <BracketBadge variant="crimson" pulse>MOSIP STREAM</BracketBadge>
            ) : (
              <BracketBadge variant="gold">HERMETIC SSE</BracketBadge>
            )
          }
          className="flex flex-col"
        >
          <LiveFlowTimeline
            flow={flow}
            onEventClick={setSelectedEvent}
            onAdvanceFlow={handleAdvanceFlow}
            isAdvancing={isAdvancing}
            onViewReport={() => setShowReport(true)}
          />
        </LabCard>

        <LabCard
          id="protocol-inspector-section"
          title="CRYPTOGRAPHIC PROTOCOL INSPECTOR"
          subtitle="Direct inspection of signatures, claims, nonces, and proof-of-possession headers"
          badge={
            selectedEvent ? (
              <BracketBadge variant="gold">{selectedEvent.actor}</BracketBadge>
            ) : (
              <BracketBadge variant="dim">STANDBY</BracketBadge>
            )
          }
          className="flex flex-col"
        >
          <ProtocolInspector event={selectedEvent} />
        </LabCard>
      </div>

      {showReport && report && (
        <ReportView report={report} onClose={() => setShowReport(false)} />
      )}
    </div>
  );
};

export default MainFlow;
