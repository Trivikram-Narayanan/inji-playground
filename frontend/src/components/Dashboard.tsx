import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Activity, CheckCircle2, XCircle, Percent, AlertOctagon } from 'lucide-react';
import type { InteropReport } from '../types';
import { API_BASE } from '../api/client';
import { LabCard, BracketBadge } from './ui/LabPrimitives';

export const Dashboard: React.FC = () => {
  const [reports, setReports] = useState<InteropReport[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const formatBreakdown = useMemo(() => {
    const byFormat = new Map<string, { total: number; passed: number }>();
    for (const r of reports) {
      const entry = byFormat.get(r.format) ?? { total: 0, passed: 0 };
      entry.total += 1;
      if (r.outcome === 'pass') entry.passed += 1;
      byFormat.set(r.format, entry);
    }
    return Array.from(byFormat.entries()).map(([format, { total, passed }]) => ({
      format,
      total,
      passed,
      passRate: total > 0 ? Math.round((passed / total) * 100) : 0,
    }));
  }, [reports]);

  const compatibilityMatrix = useMemo(() => {
    const map = new Map<string, { total: number; passed: number; format: string }>();
    for (const r of reports) {
      const key = `${r.issuer} → ${r.wallet} → ${r.verifier}`;
      const existing = map.get(key) ?? { total: 0, passed: 0, format: r.format };
      existing.total += 1;
      if (r.outcome === 'pass') existing.passed += 1;
      map.set(key, existing);
    }
    return Array.from(map.entries()).map(([route, { total, passed, format }]) => ({
      route,
      total,
      passed,
      passRate: Math.round((passed / total) * 100),
      format,
    }));
  }, [reports]);

  if (isLoading) {
    return (
      <div role="status" aria-live="polite" className="flex flex-col gap-6">
        <span className="sr-only">Loading Interoperability Observatory…</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-[#0f1115] border border-[#ffffff14] p-4 h-24 animate-pulse" aria-hidden="true" />
          ))}
        </div>
        <div className="bg-[#0f1115] border border-[#ffffff14] h-64 animate-pulse" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header Banner matching Overview & Laboratory */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0f1115] border border-[#ffffff14] p-5">
        <div>
          <div className="text-[10px] font-mono text-[#535965] uppercase tracking-widest mb-1">
            // TELEMETRY_OBSERVATORY
          </div>
          <h2 className="text-xl font-bold font-mono tracking-tight text-[#f0f2f5] flex items-center gap-2">
            <span className="w-2 h-2 bg-[#e5a93c]" />
            INTEROPERABILITY OBSERVATORY
          </h2>
          <p className="text-xs text-[#8a919e] mt-0.5 font-sans">
            Continuous verification telemetry, format distributions, and tri-party routing health
          </p>
        </div>
        <div className="flex items-center gap-3">
          <BracketBadge variant="gold">
            {reports.length} VERIFIED RUNS
          </BracketBadge>
        </div>
      </div>

      {/* Telemetry Stat Cards: Neutral outline icons + Warm Gold / Crimson semantics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Runs */}
        <div className="bg-[#0f1115] border border-[#ffffff14] p-4 flex items-center gap-3.5">
          <div className="p-2 border border-[#ffffff14] text-[#8a919e]">
            <Activity size={18} />
          </div>
          <div className="font-mono">
            <div className="text-2xl font-bold text-[#f0f2f5]">{stats?.totalTests || 0}</div>
            <div className="text-[10px] uppercase tracking-wider text-[#535965]">TOTAL RUNS</div>
          </div>
        </div>

        {/* Passed */}
        <div className="bg-[#0f1115] border border-[#ffffff14] p-4 flex items-center gap-3.5">
          <div className="p-2 border border-[#22c55e]/30 text-[#22c55e]">
            <CheckCircle2 size={18} />
          </div>
          <div className="font-mono">
            <div className="text-2xl font-bold text-[#22c55e]">{stats?.passed || 0}</div>
            <div className="text-[10px] uppercase tracking-wider text-[#535965]">PASSED</div>
          </div>
        </div>

        {/* Failed */}
        <div className="bg-[#0f1115] border border-[#ffffff14] p-4 flex items-center gap-3.5">
          <div className="p-2 border border-[#ff4d2e]/30 text-[#ff4d2e]">
            <XCircle size={18} />
          </div>
          <div className="font-mono">
            <div className="text-2xl font-bold text-[#ff4d2e]">{stats?.failed || 0}</div>
            <div className="text-[10px] uppercase tracking-wider text-[#535965]">REJECTED</div>
          </div>
        </div>

        {/* Pass Rate */}
        <div className="bg-[#0f1115] border border-[#ffffff14] p-4 flex items-center gap-3.5">
          <div className="p-2 border border-[#e5a93c]/30 text-[#e5a93c]">
            <Percent size={18} />
          </div>
          <div className="font-mono">
            <div className="text-2xl font-bold text-[#f0f2f5]">{stats?.passRate ?? 0}%</div>
            <div className="text-[10px] uppercase tracking-wider text-[#535965]">Pass Rate</div>
          </div>
        </div>


        {/* Most Common Error */}
        <div className="bg-[#0f1115] border border-[#ffffff14] p-4 flex items-center gap-3.5">
          <div className="p-2 border border-[#ffffff14] text-[#8a919e]">
            <AlertOctagon size={18} />
          </div>
          <div className="min-w-0 font-mono">
            <div className="text-xs font-bold text-[#ff4d2e] truncate" title={stats?.mostCommonError}>
              {stats?.mostCommonError || 'NONE'}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-[#535965]">COMMON ERROR</div>
          </div>
        </div>
      </div>

      {/* Format Breakdown & Compatibility Matrix Grid */}
      {formatBreakdown.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Format Pass Rates */}
          <LabCard
            title="Pass Rate by Format"
            subtitle="Benchmark pass rates segmented by W3C VC, SD-JWT VC, and mDoc specification"
          >
            <div className="space-y-4">
              {formatBreakdown.map((f) => (
                <div key={f.format} className="flex flex-col gap-1.5 font-mono text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[#f0f2f5]">{f.format}</span>
                    <span className="text-[#8a919e]">
                      {f.passed}/{f.total} ({f.passRate}%)
                    </span>
                  </div>
                  <div
                    className="h-1.5 bg-[#090a0c] border border-[#ffffff14] overflow-hidden"
                    role="progressbar"
                    aria-valuenow={f.passRate}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${f.format} pass rate`}
                  >
                    <div
                      className={`h-full ${
                        f.passRate >= 80 ? 'bg-[#22c55e]' : f.passRate >= 50 ? 'bg-[#e5a93c]' : 'bg-[#ff4d2e]'
                      }`}
                      style={{ width: `${f.passRate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </LabCard>

          {/* Participant Route Compatibility Matrix */}
          <LabCard
            title="INTEROPERABILITY ROUTE MATRIX"
            subtitle="Tri-party verification health across Issuer → Wallet → Verifier vectors"
          >
            <div className="space-y-2 font-mono text-xs max-h-56 overflow-y-auto custom-scrollbar pr-1">
              {compatibilityMatrix.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-[#090a0c] border border-[#ffffff14] flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-[#f0f2f5] font-semibold truncate">{item.route}</div>
                    <div className="text-[10px] text-[#535965]">{item.format}</div>
                  </div>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold border shrink-0 ${
                      item.passRate === 100
                        ? 'text-[#22c55e] border-[#22c55e]/40'
                        : item.passRate > 0
                        ? 'text-[#e5a93c] border-[#e5a93c]/40'
                        : 'text-[#ff4d2e] border-[#ff4d2e]/40'
                    }`}
                  >
                    {item.passRate}% [{item.passed}/{item.total}]
                  </span>
                </div>
              ))}
            </div>
          </LabCard>
        </div>
      )}

      {/* Historical Audit Table */}
      <LabCard
        title="CRYPTOGRAPHIC AUDIT LOGS"
        subtitle="Chronological audit records of all simulated and live MOSIP protocol verification runs"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono text-[#8a919e]">
            <caption className="sr-only">Recent test runs with outcome and error details</caption>
            <thead className="text-[10px] uppercase tracking-wider text-[#535965] bg-[#090a0c] border-b border-[#ffffff14]">
              <tr>
                <th scope="col" className="px-3 py-2.5">TIMESTAMP</th>
                <th scope="col" className="px-3 py-2.5">FORMAT</th>
                <th scope="col" className="px-3 py-2.5">PROTOCOL VECTOR</th>
                <th scope="col" className="px-3 py-2.5">VERDICT</th>
                <th scope="col" className="px-3 py-2.5">DIAGNOSTIC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ffffff0a]">
              {reports.map((r) => (
                <tr key={r.flow_id} className="hover:bg-[#ffffff05] transition-colors">
                  <td className="px-3 py-2.5 text-[#535965] whitespace-nowrap">
                    {new Date(r.created_at).toLocaleTimeString()}
                  </td>
                  <td className="px-3 py-2.5 font-bold text-[#f0f2f5]">{r.format}</td>
                  <td className="px-3 py-2.5 text-[#8a919e]">
                    <span>{r.issuer}</span>
                    <span className="text-[#535965] mx-1">→</span>
                    <span className="text-[#e5a93c]">{r.wallet}</span>
                    <span className="text-[#535965] mx-1">→</span>
                    <span>{r.verifier}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`inline-block px-1.5 py-0.2 text-[10px] font-bold border uppercase ${
                        r.outcome === 'pass'
                          ? 'text-[#22c55e] border-[#22c55e]/40'
                          : 'text-[#ff4d2e] border-[#ff4d2e]/40'
                      }`}
                    >
                      {r.outcome}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-[10px]">
                    {r.error_code ? (
                      <span className="text-[#ff4d2e] font-mono">[{r.error_code}]</span>
                    ) : (
                      <span className="text-[#535965]">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {reports.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[#535965] font-mono">
                    No reports found. Run a test to generate data!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </LabCard>
    </div>
  );
};

export default Dashboard;
