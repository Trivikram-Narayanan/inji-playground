import React, { useState } from 'react';
import axios from 'axios';
import Selector, { type FlowConfig } from './Selector';
import LiveFlowTimeline, { type FlowStatus, type FlowEvent, TERMINAL_STATUSES } from './LiveFlowTimeline';
import InspectorDrawer from './InspectorDrawer';
import ReportView, { type InteropReport } from './ReportView';
import HeroSection from './HeroSection';
import CredentialObject, { type Credential3DState } from './CredentialObject';
import ActRail from './ActRail';
import TrustBoundary from './TrustBoundary';
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

  // Derive 3D state from protocol flow — 1:1 mapping
  const credential3DState: Credential3DState = React.useMemo(() => {
    if (!flow) return 'blank';
    if (flow.result === 'valid') return 'verified';
    if (flow.result === 'invalid') return 'rejected';
    if (flow.result === 'valid-but-expired') return 'expired';
    if (['AUTH_REQUESTED', 'PRESENTED'].includes(flow.status)) return 'transit';
    if (['OFFER_CREATED', 'TOKEN_EXCHANGED', 'CREDENTIAL_ISSUED'].includes(flow.status)) return 'sealed';
    return 'blank';
  }, [flow]);

  // Act rail active index derived from state
  const activeAct: 0 | 1 | 2 = React.useMemo(() => {
    if (!flow) return 0;
    if (['AUTH_REQUESTED', 'PRESENTED'].includes(flow.status)) return 1;
    if (TERMINAL_STATUSES.includes(flow.status)) return 2;
    if (['OFFER_CREATED', 'TOKEN_EXCHANGED', 'CREDENTIAL_ISSUED'].includes(flow.status)) return 0;
    return 0;
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

  useFlowStream(flow?.id ?? null, (update) => {
    if (update.type === 'event') {
      setFlow((prev) => {
        if (!prev || prev.events.some((e) => e.id === update.data.id)) return prev;
        return { ...prev, events: [...prev.events, update.data] };
      });
    } else if (update.type === 'status') {
      setFlow((prev) =>
        prev ? { ...prev, status: update.data.status, result: update.data.result ?? prev.result } : prev
      );
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
      if (config.format) setActiveFormat(config.format);
      const res = await axios.post(`${API_BASE}/flows`, config);
      const { flowId } = res.data;
      await fetchFlowData(flowId);
    } catch (error: any) {
      console.error('Error starting flow:', error);
      const data = error?.response?.data;
      setStartError(data?.error || 'Failed to start the test run.');
      if (data?.flowId) await fetchFlowData(data.flowId);
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
    const el = document.getElementById('act-i');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative">
      {/* ── Opening: Hero section with 3D credential ──────────────────────── */}
      {/* The credential scene is rendered here, filling the right column */}
      <div className="relative">
        {/* 3D scene — absolutely positioned to fill right half of hero */}
        <div className="absolute top-0 right-0 w-full lg:w-1/2 h-screen z-0 pointer-events-none lg:pointer-events-auto">
          <CredentialObject state={credential3DState} className="w-full h-full" />
        </div>

        <HeroSection
          onStartFlow={scrollToSelector}
          credentialState={credential3DState}
          activeFormat={activeFormat}
        />
      </div>

      {/* ── Persistent body content ───────────────────────────────────────── */}
      <div className="px-6 lg:px-12">

        {/* ── ACT I — Issuance / Cast selection ──────────────────────────── */}
        <section id="act-i" className="py-16 border-b border-line">
          <div className="flex gap-8 lg:gap-16">
            {/* Left: Act rail */}
            <div className="hidden lg:block pt-1 shrink-0">
              <ActRail activeAct={activeAct} />
            </div>

            {/* Right: Content */}
            <div className="flex-1 min-w-0">
              {/* Section label */}
              <div className="flex items-center gap-3 mb-10">
                <span className="text-[9px] font-mono text-inkDim tracking-[0.25em] uppercase">01</span>
                <div className="flex-1 h-px bg-line" />
                <span className="text-[9px] font-mono text-inkDim tracking-[0.15em] uppercase">Issuance</span>
              </div>

              {/* Heading */}
              <h2 className="font-display text-3xl lg:text-4xl font-light tracking-tight text-ink mb-2">
                Configure the exchange
              </h2>
              <p className="text-inkDim text-sm mb-10 max-w-lg">
                Select the actors and credential format. The protocol will run in the precise order shown.
              </p>

              <Selector onRunTest={handleRunTest} />

              {/* Error state */}
              {startError && (
                <div className="mt-6 pt-4 border-t border-rejected/30">
                  <p className="text-xs font-mono text-rejected">{startError}</p>
                  <button
                    onClick={() => setStartError(null)}
                    className="mt-2 text-[10px] font-mono text-inkDim border-b border-inkDim/30 pb-px hover:text-ink transition-colors"
                    data-cursor="pointer"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {isLoading && (
                <p className="mt-4 text-xs font-mono text-inkDim animate-pulse">
                  Initializing exchange…
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Trust Boundary — between Act I and Act II */}
        <TrustBoundary
          visible={!!flow && (activeAct >= 1)}
          format={activeFormat.toUpperCase()}
        />

        {/* ── ACT II & III — Protocol Flow + Verdict ─────────────────────── */}
        <section id="act-ii" className="py-16">
          <div className="flex gap-8 lg:gap-16">
            {/* Left: Act rail continues — hidden on mobile since it's shared */}
            <div className="hidden lg:block pt-1 shrink-0 opacity-0 pointer-events-none">
              {/* Phantom to maintain column alignment */}
              <ActRail activeAct={activeAct} />
            </div>

            {/* Right: Two-column flow + inspector layout */}
            <div className="flex-1 min-w-0">
              {/* Section label */}
              <div className="flex items-center gap-3 mb-10">
                <span className="text-[9px] font-mono text-inkDim tracking-[0.25em] uppercase">02 · 03</span>
                <div className="flex-1 h-px bg-line" />
                <span className="text-[9px] font-mono text-inkDim tracking-[0.15em] uppercase">
                  Transit · Verdict
                </span>
              </div>

              {/* Mode badge */}
              {flow?.mode === 'real' && (
                <div className="mb-6">
                  <span className="text-[9px] font-mono text-rejected tracking-widest uppercase border border-rejected/30 px-2 py-1">
                    Live Sandbox
                  </span>
                </div>
              )}

              {/* Asymmetric two-column: 55/45 */}
              <div className="grid grid-cols-1 lg:grid-cols-11 gap-0 lg:gap-12">
                {/* Protocol timeline — 6 units */}
                <div className="lg:col-span-6 lg:border-r lg:border-line lg:pr-12 pb-8 lg:pb-0">
                  <div className="text-[9px] font-mono text-inkDim tracking-[0.15em] uppercase mb-6">
                    Protocol Steps
                  </div>
                  <LiveFlowTimeline
                    flow={flow}
                    onEventClick={setSelectedEvent}
                    onAdvanceFlow={handleAdvanceFlow}
                    isAdvancing={isAdvancing}
                    onViewReport={() => setShowReport(true)}
                  />
                </div>

                {/* Inspector — 5 units */}
                <div className="lg:col-span-5">
                  <div className="flex items-center justify-between mb-6">
                    <div className="text-[9px] font-mono text-inkDim tracking-[0.15em] uppercase">
                      Protocol Inspector
                    </div>
                    {selectedEvent && (
                      <button
                        onClick={() => setSelectedEvent(null)}
                        className="text-[9px] font-mono text-inkDim hover:text-ink transition-colors"
                        data-cursor="pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {!selectedEvent ? (
                    <div className="py-12 text-center">
                      <div className="w-px h-8 bg-line mx-auto mb-4" />
                      <p className="text-[10px] font-mono text-inkDim/50">
                        Select a protocol step
                        <br />to inspect payload
                      </p>
                    </div>
                  ) : (
                    <div className="border border-line bg-panel/50">
                      {/* Inline inspector — compact version for desktop */}
                      <div className="px-4 py-3 border-b border-line flex items-center gap-2">
                        <span className="text-[10px] font-mono text-ink">{selectedEvent.step}</span>
                        <span
                          className="text-[9px] font-mono text-inkDim border border-line px-1.5 py-0.5 uppercase tracking-wider"
                        >
                          {selectedEvent.status}
                        </span>
                      </div>
                      <div className="p-4 max-h-[400px] overflow-auto">
                        <pre className="text-[10px] font-mono text-inkDim whitespace-pre-wrap break-all leading-relaxed">
                          {JSON.stringify(
                            typeof selectedEvent.payload === 'string'
                              ? JSON.parse(selectedEvent.payload)
                              : selectedEvent.payload,
                            null,
                            2
                          )}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ── Inspector Drawer — slides up from bottom on mobile/event click ── */}
      <InspectorDrawer
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />

      {/* ── Report / Case Dossier modal ─────────────────────────────────── */}
      {showReport && report && (
        <ReportView report={report} onClose={() => setShowReport(false)} />
      )}
    </div>
  );
};

export default MainFlow;
