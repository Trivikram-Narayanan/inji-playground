import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, CheckCircle, XCircle, AlertOctagon } from 'lucide-react';
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

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center text-accent font-mono text-sm">
        Loading Historical Ledger...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Editorial Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-display font-semibold text-ink">Historical Interoperability Ledger</h2>
        <p className="text-xs text-inkDim">Aggregated verification outcomes, cross-ecosystem pass rates, and failure diagnostics.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-panel rounded-2xl p-5 border border-line shadow-lg flex items-center gap-4">
          <div className="p-3 bg-panelLit border border-line rounded-xl">
            <Activity className="text-ink" size={20} />
          </div>
          <div>
            <div className="text-2xl font-mono font-bold text-ink">{stats?.totalTests || 0}</div>
            <div className="text-xs text-inkDim font-medium">Total Flow Runs</div>
          </div>
        </div>

        <div className="bg-panel rounded-2xl p-5 border border-line shadow-lg flex items-center gap-4">
          <div className="p-3 bg-verified/15 border border-verified/30 rounded-xl">
            <CheckCircle className="text-verified" size={20} />
          </div>
          <div>
            <div className="text-2xl font-mono font-bold text-ink">{stats?.passed || 0}</div>
            <div className="text-xs text-inkDim font-medium">Valid Verifications</div>
          </div>
        </div>

        <div className="bg-panel rounded-2xl p-5 border border-line shadow-lg flex items-center gap-4">
          <div className="p-3 bg-rejected/15 border border-rejected/30 rounded-xl">
            <XCircle className="text-rejected" size={20} />
          </div>
          <div>
            <div className="text-2xl font-mono font-bold text-ink">{stats?.failed || 0}</div>
            <div className="text-xs text-inkDim font-medium">Rejected / Tampered</div>
          </div>
        </div>

        <div className="bg-panel rounded-2xl p-5 border border-line shadow-lg flex items-center gap-4">
          <div className="p-3 bg-panelLit border border-line rounded-xl">
            <AlertOctagon className="text-inkDim" size={20} />
          </div>
          <div className="overflow-hidden">
            <div className="text-xs text-inkDim font-medium mb-0.5">Top Failure Code</div>
            <div className="text-sm font-mono font-bold text-ink truncate" title={stats?.mostCommonError}>
              {stats?.mostCommonError || 'None'}
            </div>
          </div>
        </div>
      </div>

      {/* Reports Ledger Table */}
      <div className="bg-panel rounded-2xl border border-line shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-line bg-panelLit flex items-center justify-between">
          <h3 className="text-sm font-display font-semibold text-ink tracking-tight">Recorded Execution Transactions</h3>
          <span className="text-xs font-mono text-inkDim">{reports.length} records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-ink">
            <thead className="text-[11px] text-inkDim uppercase font-mono bg-panelLit/50 border-b border-line tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Timestamp</th>
                <th className="px-6 py-3.5">Credential Format</th>
                <th className="px-6 py-3.5">Actors (Issuer → Wallet → Verifier)</th>
                <th className="px-6 py-3.5">Outcome</th>
                <th className="px-6 py-3.5">Diagnosed Signature</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {reports.map((r) => (
                <tr key={r.flow_id} className="hover:bg-panelLit/40 transition-colors">
                  <td className="px-6 py-4 font-mono text-inkDim whitespace-nowrap">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 font-mono font-medium text-ink">
                    {r.format}
                  </td>
                  <td className="px-6 py-4 text-inkDim font-mono space-y-0.5">
                    <div><span className="text-inkDim/60">I:</span> <span className="text-ink">{r.issuer}</span></div>
                    <div><span className="text-inkDim/60">W:</span> <span className="text-ink">{r.wallet}</span></div>
                    <div><span className="text-inkDim/60">V:</span> <span className="text-ink">{r.verifier}</span></div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full font-mono text-[10px] font-bold border ${
                        r.outcome === 'pass'
                          ? 'bg-verified/15 text-verified border-verified/30'
                          : 'bg-rejected/15 text-rejected border-rejected/30'
                      }`}
                    >
                      {r.outcome.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-[11px] font-medium text-rejected">
                    {r.error_code || <span className="text-inkDim/40">-</span>}
                  </td>
                </tr>
              ))}
              {reports.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-inkDim font-mono">
                    No transactions recorded. Execute a protocol run to populate the ledger.
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
