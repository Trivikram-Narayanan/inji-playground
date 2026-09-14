import React, { useEffect, useState } from 'react';
import type { InteropReport } from '../types/flow';

interface DashboardProps {
  onSelectReport?: (reportId: string) => void;
}

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3000/api';

/**
 * Section 22: Dashboard as "Case Files".
 * Styled like a technical ledger / film archive of past protocol runs with filters.
 */
export const Dashboard: React.FC<DashboardProps> = () => {
  const [reports, setReports] = useState<InteropReport[]>([]);
  const [stats, setStats] = useState<{
    totalTests: number;
    passed: number;
    failed: number;
  }>({ totalTests: 0, passed: 0, failed: 0 });
  const [formatFilter, setFormatFilter] = useState('all');
  const [outcomeFilter, setOutcomeFilter] = useState('all');

  useEffect(() => {
    fetch(`${API_BASE}/reports`)
      .then((res) => res.json())
      .then((data: InteropReport[]) => setReports(data))
      .catch(() => {});

    fetch(`${API_BASE}/reports/stats`)
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch(() => {});
  }, []);

  const filteredReports = reports.filter((r) => {
    if (formatFilter !== 'all' && r.format !== formatFilter) return false;
    if (outcomeFilter !== 'all' && r.outcome !== outcomeFilter) return false;
    return true;
  });

  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-12 flex flex-col gap-8">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-line pb-6 gap-4">
        <div>
          <span className="font-mono text-xs text-sealGold uppercase tracking-widest block mb-1">
            ARCHIVE // PROTOCOL LEDGER
          </span>
          <h1 className="font-display text-4xl font-normal text-ink">Case Files</h1>
        </div>

        {/* Global Statistics Counter */}
        <div className="flex items-center gap-6 font-mono text-xs">
          <div>
            <span className="text-inkDim block text-[10px]">TOTAL RUNS</span>
            <span className="text-ink text-base font-semibold">{stats.totalTests}</span>
          </div>
          <div>
            <span className="text-inkDim block text-[10px]">VERIFIED</span>
            <span className="text-verified text-base font-semibold">{stats.passed}</span>
          </div>
          <div>
            <span className="text-inkDim block text-[10px]">REJECTED</span>
            <span className="text-rejected text-base font-semibold">{stats.failed}</span>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
        <span className="text-inkDim">FILTER:</span>
        <select
          value={formatFilter}
          onChange={(e) => setFormatFilter(e.target.value)}
          className="bg-panelLit border border-line px-3 py-1.5 text-ink focus:outline-none"
        >
          <option value="all">ALL FORMATS</option>
          <option value="w3c-vc-jsonld">W3C JSON-LD</option>
          <option value="sd-jwt-vc">SD-JWT</option>
          <option value="mdoc">mDoc</option>
        </select>

        <select
          value={outcomeFilter}
          onChange={(e) => setOutcomeFilter(e.target.value)}
          className="bg-panelLit border border-line px-3 py-1.5 text-ink focus:outline-none"
        >
          <option value="all">ALL OUTCOMES</option>
          <option value="pass">VERIFIED (PASS)</option>
          <option value="fail">REJECTED (FAIL)</option>
        </select>
      </div>

      {/* Ledger Case Files Table */}
      <div className="border border-line divide-y divide-line bg-panel/30">
        {filteredReports.length === 0 ? (
          <div className="p-12 text-center font-mono text-xs text-inkDim">
            No case files recorded yet. Execute an exchange to log a verification file.
          </div>
        ) : (
          filteredReports.map((report, idx) => (
            <div
              key={report.id || report.flow_id || idx}
              className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-panelLit/40 transition-colors"
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3 font-mono text-xs">
                  <span className="text-sealGold">FILE #{String(idx + 1).padStart(3, '0')}</span>
                  <span className="text-ink font-medium">
                    {report.issuer} → {report.wallet} → {report.verifier}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-[11px] font-mono text-inkDim">
                  <span>FORMAT: {report.format.toUpperCase()}</span>
                  <span>DURATION: {report.duration_ms}ms</span>
                  <span>{new Date(report.created_at).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span
                  className={`font-mono text-xs px-3 py-1 uppercase tracking-wider ${
                    report.outcome === 'pass'
                      ? 'text-verified border border-verified/30 bg-verified/10'
                      : 'text-rejected border border-rejected/30 bg-rejected/10'
                  }`}
                >
                  {report.outcome === 'pass' ? 'VERIFIED' : 'REJECTED'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
