import React, { useState, useEffect } from 'react';
import axios from 'axios';
import type { InteropReport } from './ReportView';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3000/api';

type FilterKey = 'all' | string;

const Dashboard: React.FC = () => {
  const [reports, setReports] = useState<InteropReport[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [outcomeFilter, setOutcomeFilter] = useState<FilterKey>('all');
  const [formatFilter, setFormatFilter] = useState<FilterKey>('all');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [reportsRes, statsRes] = await Promise.all([
          axios.get(`${API_BASE}/reports`),
          axios.get(`${API_BASE}/reports/stats`),
        ]);
        setReports(reportsRes.data);
        setStats(statsRes.data);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-24 text-inkDim font-mono text-xs tracking-widest uppercase">
        Loading…
      </div>
    );
  }

  const filteredReports = reports.filter((r) => {
    const matchOutcome = outcomeFilter === 'all' || r.outcome === outcomeFilter;
    const matchFormat = formatFilter === 'all' || r.format === formatFilter;
    return matchOutcome && matchFormat;
  });

  const uniqueFormats = [...new Set(reports.map((r) => r.format))];
  const passRate =
    stats?.totalTests > 0
      ? Math.round((stats.passed / stats.totalTests) * 100)
      : 0;

  return (
    <div className="min-h-screen px-6 lg:px-12 pt-24 pb-16 flex flex-col gap-12">
      {/* ── Section header ─────────────────────────────────────────────────── */}
      <div className="border-b border-line pb-8">
        <div className="text-[10px] font-mono text-inkDim tracking-[0.2em] uppercase mb-3">
          Archive · {reports.length} exchange{reports.length !== 1 ? 's' : ''}
        </div>
        <h1 className="font-display text-4xl lg:text-5xl font-light tracking-tight text-ink">
          Case Files
        </h1>
        <p className="text-inkDim text-sm mt-3 max-w-xl font-ui">
          Aggregated verification outcomes, cross-ecosystem pass rates, and failure diagnostics.
        </p>
      </div>

      {/* ── Stat row — oversized numbers, minimal labels ────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-0">
        {[
          { value: stats?.totalTests ?? 0, label: 'Total runs' },
          { value: stats?.passed ?? 0, label: 'Verified', color: '#3FCC8F' },
          { value: stats?.failed ?? 0, label: 'Rejected', color: '#E4574F' },
          { value: `${passRate}%`, label: 'Pass rate' },
        ].map((stat, i) => (
          <div key={i} className="border-r border-b border-line last:border-r-0 p-6 lg:p-8">
            <div
              className="text-4xl lg:text-5xl font-mono font-light tracking-tight mb-2"
              style={{ color: stat.color || '#EDEFF3' }}
            >
              {stat.value}
            </div>
            <div className="text-[10px] font-mono text-inkDim tracking-[0.15em] uppercase">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* ── Filter bar — text tabs ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-0 border-b border-line">
        {/* Outcome filters */}
        <div className="flex items-center gap-0 mr-8">
          <span className="text-[10px] font-mono text-inkDim tracking-[0.15em] uppercase px-3 py-3 shrink-0">
            Outcome
          </span>
          {['all', 'pass', 'fail'].map((f) => (
            <button
              key={f}
              onClick={() => setOutcomeFilter(f)}
              className={`relative px-3 py-3 text-xs font-mono transition-colors duration-150 ${
                outcomeFilter === f ? 'text-ink' : 'text-inkDim hover:text-ink/70'
              }`}
              data-cursor="pointer"
            >
              {f === 'all' ? 'All' : f === 'pass' ? 'Verified' : 'Rejected'}
              {outcomeFilter === f && (
                <span className="absolute bottom-0 left-0 right-0 h-px bg-ink" />
              )}
            </button>
          ))}
        </div>

        {/* Format filters */}
        {uniqueFormats.length > 0 && (
          <div className="flex items-center gap-0">
            <span className="text-[10px] font-mono text-inkDim tracking-[0.15em] uppercase px-3 py-3 shrink-0">
              Format
            </span>
            {['all', ...uniqueFormats].map((f) => (
              <button
                key={f}
                onClick={() => setFormatFilter(f)}
                className={`relative px-3 py-3 text-xs font-mono transition-colors duration-150 ${
                  formatFilter === f ? 'text-ink' : 'text-inkDim hover:text-ink/70'
                }`}
                data-cursor="pointer"
              >
                {f === 'all' ? 'All' : f}
                {formatFilter === f && (
                  <span className="absolute bottom-0 left-0 right-0 h-px bg-ink" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Exchange ledger — editorial layout ──────────────────────────────── */}
      <div className="flex flex-col gap-0">
        {/* Column headers */}
        <div className="grid grid-cols-12 gap-4 px-0 py-3 border-b border-line">
          {['Timestamp', 'Format', 'Chain', 'Outcome'].map((h, i) => (
            <div
              key={h}
              className={`text-[9px] font-mono text-inkDim tracking-[0.15em] uppercase ${
                i === 0 ? 'col-span-2' : i === 1 ? 'col-span-2' : i === 2 ? 'col-span-6' : 'col-span-2'
              }`}
            >
              {h}
            </div>
          ))}
        </div>

        {filteredReports.map((r) => (
          <div
            key={r.flow_id}
            className="grid grid-cols-12 gap-4 py-5 border-b border-line/40 group hover:bg-panelLit/20 transition-colors duration-150"
          >
            {/* Timestamp */}
            <div className="col-span-2 flex flex-col gap-1">
              <span className="text-[10px] font-mono text-inkDim">
                {new Date(r.created_at).toLocaleDateString()}
              </span>
              <span className="text-[10px] font-mono text-inkDim/50">
                {new Date(r.created_at).toLocaleTimeString()}
              </span>
            </div>

            {/* Format */}
            <div className="col-span-2 flex items-start">
              <span className="text-[10px] font-mono text-ink">{r.format}</span>
            </div>

            {/* Chain: ISSUER → WALLET → VERIFIER */}
            <div className="col-span-6 flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono text-ink">{r.issuer}</span>
              <span className="text-inkDim/40 text-xs">→</span>
              <span className="text-xs font-mono text-inkDim">{r.wallet}</span>
              <span className="text-inkDim/40 text-xs">→</span>
              <span className="text-xs font-mono text-inkDim">{r.verifier}</span>
            </div>

            {/* Outcome */}
            <div className="col-span-2 flex flex-col gap-1 items-start">
              <span
                className="text-[10px] font-mono tracking-widest uppercase"
                style={{
                  color: r.outcome === 'pass' ? '#3FCC8F' : '#E4574F',
                }}
              >
                {r.outcome === 'pass' ? 'Verified' : 'Rejected'}
              </span>
              {r.error_code && (
                <span className="text-[9px] font-mono text-inkDim/50 leading-tight">
                  {r.error_code}
                </span>
              )}
            </div>
          </div>
        ))}

        {filteredReports.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-xs font-mono text-inkDim">
              {reports.length === 0
                ? 'No exchanges recorded. Execute a protocol run to populate the ledger.'
                : 'No exchanges match the current filter.'}
            </p>
          </div>
        )}
      </div>

      {/* Failure signature */}
      {stats?.mostCommonError && stats.mostCommonError !== 'None' && (
        <div className="border-t border-line pt-6">
          <div className="text-[9px] font-mono text-inkDim tracking-[0.15em] uppercase mb-2">
            Most Common Failure Signature
          </div>
          <div className="font-mono text-sm text-rejected">{stats.mostCommonError}</div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
