import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Activity, CheckCircle, XCircle, Percent } from 'lucide-react';
import type { InteropReport } from './ReportView';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3000/api';

const Dashboard: React.FC = () => {
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

  if (isLoading) {
    return (
      <div role="status" aria-live="polite" className="flex flex-col gap-6">
        <span className="sr-only">Loading dashboard…</span>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 shadow-lg h-[76px] animate-pulse" aria-hidden="true" />
          ))}
        </div>
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 shadow-lg h-64 animate-pulse" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 shadow-lg flex items-center gap-4">
          <div className="p-3 bg-blue-500/20 rounded-lg"><Activity className="text-blue-400" aria-hidden="true" /></div>
          <div>
            <div className="text-2xl font-bold text-slate-200">{stats?.totalTests || 0}</div>
            <div className="text-sm text-slate-400">Total Runs</div>
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 shadow-lg flex items-center gap-4">
          <div className="p-3 bg-green-500/20 rounded-lg"><CheckCircle className="text-green-400" aria-hidden="true" /></div>
          <div>
            <div className="text-2xl font-bold text-slate-200">{stats?.passed || 0}</div>
            <div className="text-sm text-slate-400">Passed</div>
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 shadow-lg flex items-center gap-4">
          <div className="p-3 bg-red-500/20 rounded-lg"><XCircle className="text-red-400" aria-hidden="true" /></div>
          <div>
            <div className="text-2xl font-bold text-slate-200">{stats?.failed || 0}</div>
            <div className="text-sm text-slate-400">Failed</div>
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 shadow-lg flex items-center gap-4">
          <div className="p-3 bg-indigo-500/20 rounded-lg"><Percent className="text-indigo-400" aria-hidden="true" /></div>
          <div>
            <div className="text-2xl font-bold text-slate-200">{stats?.passRate ?? 0}%</div>
            <div className="text-sm text-slate-400">Pass Rate</div>
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 shadow-lg flex flex-col justify-center gap-1">
          <div className="text-sm text-slate-400">Common Error</div>
          <div className="text-lg font-bold text-slate-200 truncate" title={stats?.mostCommonError}>
            {stats?.mostCommonError || 'N/A'}
          </div>
        </div>
      </div>

      {/* Format Breakdown */}
      {formatBreakdown.length > 0 && (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700 bg-slate-800/80">
            <h2 className="text-lg font-bold text-slate-200">Pass Rate by Format</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {formatBreakdown.map((f) => (
              <div key={f.format} className="flex flex-col gap-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300 font-medium">{f.format}</span>
                  <span className="text-slate-400">{f.passed}/{f.total} ({f.passRate}%)</span>
                </div>
                <div
                  className="h-2 rounded-full bg-slate-700 overflow-hidden"
                  role="progressbar"
                  aria-valuenow={f.passRate}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${f.format} pass rate`}
                >
                  <div
                    className={`h-full ${f.passRate >= 80 ? 'bg-green-500' : f.passRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${f.passRate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reports Table */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700 shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700 bg-slate-800/80">
          <h2 className="text-lg font-bold text-slate-200">Recent Test Runs</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <caption className="sr-only">Recent test runs with outcome and error details</caption>
            <thead className="text-xs text-slate-400 uppercase bg-slate-900/50 border-b border-slate-700">
              <tr>
                <th scope="col" className="px-6 py-3">Date</th>
                <th scope="col" className="px-6 py-3">Format</th>
                <th scope="col" className="px-6 py-3">Issuer / Wallet / Verifier</th>
                <th scope="col" className="px-6 py-3">Outcome</th>
                <th scope="col" className="px-6 py-3">Error (if any)</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.flow_id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="px-6 py-4 font-medium">{r.format}</td>
                  <td className="px-6 py-4 text-xs text-slate-400 space-y-1">
                    <div>I: <span className="text-slate-300">{r.issuer}</span></div>
                    <div>W: <span className="text-slate-300">{r.wallet}</span></div>
                    <div>V: <span className="text-slate-300">{r.verifier}</span></div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      r.outcome === 'pass' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {r.outcome.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-red-300">
                    {r.error_code || '-'}
                  </td>
                </tr>
              ))}
              {reports.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No reports found. Run a test to generate data!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
