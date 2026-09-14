import React, { useState } from 'react';
import axios from 'axios';
import Selector, { type FlowConfig } from './Selector';
import LiveFlowTimeline, { type FlowStatus, type FlowEvent, TERMINAL_STATUSES } from './LiveFlowTimeline';
import ProtocolInspector from './ProtocolInspector';
import ReportView, { type InteropReport } from './ReportView';
import HeroSection from './HeroSection';
import { type Credential3DState } from './CredentialCard3D';
import { useFlowStream } from '../hooks/useFlowStream';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api';

const MainFlow: React.FC = () => {
  const [flow, setFlow] = useState<FlowStatus | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<FlowEvent | null>(null);
  const [report, setReport] = useState<InteropReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [activeFormat, setActiveFormat] = useState('w3c-vc-jsonld');

  // Derive 3D Credential State from the ongoing flow
  const credential3DState: Credential3DState = React.useMemo(() => {
    if (!flow) return 'blank';
    if (flow.result === 'valid') return 'verified';
    if (flow.result === 'invalid') return 'rejected';
    if (flow.result === 'valid-but-expired') return 'expired';
    if (['AUTH_REQUESTED', 'PRESENTED'].includes(flow.status)) return 'transit';
    if (['OFFER_CREATED', 'TOKEN_EXCHANGED', 'CREDENTIAL_ISSUED'].includes(flow.status)) return 'sealed';
    return 'blank';
  }, [flow]);

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

  // Live updates via SSE
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
      if (config.format) {
        setActiveFormat(config.format);
      }
      const res = await axios.post(`${API_BASE}/flows`, config);
      const { flowId } = res.data;
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

  const scrollToSelector = () => {
    const el = document.getElementById('selector-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Editorial Hero with Signature 3D R3F Credential Object */}
      <HeroSection
        onStartFlow={scrollToSelector}
        credentialState={credential3DState}
        activeFormat={activeFormat}
      />

      {/* Act I / Configuration: 3-Column Selector */}
      <section id="selector-section" className="bg-panel rounded-2xl border border-line p-6 lg:p-8 backdrop-blur-xl shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-6 h-6 rounded-full bg-panelLit text-ink border border-line flex items-center justify-center text-xs font-mono font-bold">
            1
          </span>
          <h2 className="text-lg font-display font-semibold text-ink">Act I: Configure Protocol Parameters</h2>
        </div>
        <Selector onRunTest={handleRunTest} />
      </section>

      {startError && (
        <div className="bg-rejected/10 border border-rejected/40 text-rejected rounded-xl px-4 py-3.5 text-sm flex items-start justify-between gap-4 backdrop-blur-md">
          <span>{startError}</span>
          <button onClick={() => setStartError(null)} className="text-rejected hover:opacity-80 text-lg leading-none cursor-pointer">
            &times;
          </button>
        </div>
      )}

      {/* Act II & III: Protocol Exchange & Verification Console */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-[550px]">
        {/* Left: Act Rail & Interactive Sequence Diagram */}
        <section className="bg-panel rounded-2xl border border-line p-6 lg:p-8 backdrop-blur-xl shadow-xl flex flex-col">
          <h2 className="text-lg font-display font-semibold mb-4 text-ink flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-panelLit text-ink border border-line flex items-center justify-center text-xs font-mono font-bold">
                2
              </span>
              Act II & III: Protocol Flow & Verdict
              {flow?.mode === 'real' && (
                <span className="text-[10px] font-mono font-bold bg-rejected/20 text-rejected border border-rejected/40 rounded-full px-2 py-0.5 tracking-wide">
                  SANDBOX
                </span>
              )}
            </span>
            {isLoading && <span className="text-xs font-mono text-ink animate-pulse">Initializing...</span>}
          </h2>
          <LiveFlowTimeline
            flow={flow}
            onEventClick={setSelectedEvent}
            onAdvanceFlow={handleAdvanceFlow}
            isAdvancing={isAdvancing}
            onViewReport={() => setShowReport(true)}
          />
        </section>

        {/* Right: Protocol Inspector */}
        <section className="bg-panel rounded-2xl border border-line p-6 lg:p-8 backdrop-blur-xl shadow-xl flex flex-col">
          <h2 className="text-lg font-display font-semibold mb-4 text-ink flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-panelLit text-ink border border-line flex items-center justify-center text-xs font-mono font-bold">
              ⚡
            </span>
            Protocol Inspector
          </h2>
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
