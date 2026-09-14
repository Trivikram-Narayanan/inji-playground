import React, { useState } from 'react';
import axios from 'axios';
import Selector, { type FlowConfig } from './Selector';
import LiveFlowTimeline, { type FlowStatus, type FlowEvent, TERMINAL_STATUSES } from './LiveFlowTimeline';
import ProtocolInspector from './ProtocolInspector';
import ReportView, { type InteropReport } from './ReportView';
import { useFlowStream } from '../hooks/useFlowStream';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3000/api';

const MainFlow: React.FC = () => {
  const [flow, setFlow] = useState<FlowStatus | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<FlowEvent | null>(null);
  const [report, setReport] = useState<InteropReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const fetchReport = async (flowId: string) => {
    try {
      const reportRes = await axios.get(`${API_BASE}/flows/${flowId}/report`);
      setReport(reportRes.data);
    } catch (err) {
      console.error('Failed to fetch report:', err);
    }
  };

  const fetchFlowData = async (flowId: string) => {
    try {
      const [statusRes, eventsRes] = await Promise.all([
        axios.get(`${API_BASE}/flows/${flowId}`),
        axios.get(`${API_BASE}/flows/${flowId}/events`),
      ]);
      setFlow({ ...statusRes.data, events: eventsRes.data.events });
      if (TERMINAL_STATUSES.includes(statusRes.data.status)) {
        await fetchReport(flowId);
      }
    } catch (err) {
      console.error('Failed to fetch flow:', err);
    }
  };

  // Live updates via SSE once a flow exists - covers Simulated Mode's step-by-step
  // pacing in full, and Real Mode's presentation/verification phase (Real Mode's
  // issuance phase completes server-side before the stream connects, so that part
  // arrives via the initial fetchFlowData call instead).
  useFlowStream(flow?.id ?? null, (update) => {
    if (update.type === 'event') {
      setFlow((prev) => {
        if (!prev || prev.events.some((e) => e.id === update.data.id)) return prev;
        return { ...prev, events: [...prev.events, update.data] };
      });
    } else if (update.type === 'status') {
      setFlow((prev) => (prev ? { ...prev, status: update.data.status, result: update.data.result ?? prev.result } : prev));
      if (TERMINAL_STATUSES.includes(update.data.status) && flow?.id) {
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
      const res = await axios.post(`${API_BASE}/flows`, config);
      const { flowId } = res.data;

      // Initial fetch
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

  const handleAdvanceFlow = async () => {
    if (!flow?.id) return;
    try {
      setIsAdvancing(true);
      await axios.post(`${API_BASE}/flows/${flow.id}/advance`);
      await fetchFlowData(flow.id);
    } catch (error) {
      console.error('Error advancing flow:', error);
    } finally {
      setIsAdvancing(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top: Selector UI */}
      <section className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6 backdrop-blur-sm shadow-xl">
        <Selector onRunTest={handleRunTest} />
      </section>

      {startError && (
        <div className="bg-red-500/10 border border-red-500/40 text-red-300 rounded-lg px-4 py-3 text-sm flex items-start justify-between gap-4">
          <span>{startError}</span>
          <button onClick={() => setStartError(null)} className="text-red-400 hover:text-red-200 text-lg leading-none">&times;</button>
        </div>
      )}

      {/* Middle: Live Flow & Bottom: Protocol Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[500px]">
        <section className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6 backdrop-blur-sm shadow-xl flex flex-col">
          <h2 className="text-lg font-semibold mb-4 text-slate-200 flex items-center justify-between">
            <span className="flex items-center gap-2">
              Live Timeline
              {flow?.mode === 'real' && (
                <span className="text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/40 rounded-full px-2 py-0.5 tracking-wide">LIVE</span>
              )}
            </span>
            {isLoading && <span className="text-sm text-indigo-400">Starting...</span>}
          </h2>
          <LiveFlowTimeline
            flow={flow}
            onEventClick={setSelectedEvent}
            onAdvanceFlow={handleAdvanceFlow}
            isAdvancing={isAdvancing}
            onViewReport={() => setShowReport(true)}
          />
        </section>

        <section className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6 backdrop-blur-sm shadow-xl flex flex-col">
          <h2 className="text-lg font-semibold mb-4 text-slate-200">Protocol Inspector</h2>
          <ProtocolInspector event={selectedEvent} />
        </section>
      </div>

      {showReport && report && (
        <ReportView report={report} onClose={() => setShowReport(false)} />
      )}
    </div>
  );
};

export default MainFlow;
