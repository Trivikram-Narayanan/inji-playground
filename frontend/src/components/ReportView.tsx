import React from 'react';
import { Download, FileText, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

export interface InteropReport {
  flow_id: string;
  issuer: string;
  wallet: string;
  verifier: string;
  format: string;
  proof_type: string;
  outcome: 'pass' | 'fail';
  duration_ms: number;
  error_code?: string;
  error_detail?: string;
  created_at: string;
}

interface ReportViewProps {
  report: InteropReport;
  onClose: () => void;
}

const ReportView: React.FC<ReportViewProps> = ({ report, onClose }) => {
  const isPass = report.outcome === 'pass';

  const downloadJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `report-${report.flow_id.slice(0,8)}.json`);
    dlAnchorElem.click();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-slate-900 border border-slate-700 shadow-2xl rounded-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
          <div className="flex items-center gap-3">
            <FileText className="text-indigo-400" />
            <h2 className="text-xl font-bold text-slate-200">Interoperability Report</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-2xl leading-none">&times;</button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 flex flex-col gap-6">
          <div className={`p-6 rounded-xl flex items-center gap-4 ${isPass ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
            {isPass ? (
              <CheckCircle2 className="text-green-500 w-12 h-12" />
            ) : report.error_code === 'CREDENTIAL_EXPIRED' ? (
              <AlertTriangle className="text-yellow-500 w-12 h-12" />
            ) : (
              <XCircle className="text-red-500 w-12 h-12" />
            )}
            <div>
              <h3 className={`text-2xl font-bold ${isPass ? 'text-green-400' : 'text-red-400'}`}>
                {isPass ? 'Test Passed' : 'Test Failed'}
              </h3>
              <p className="text-slate-400 text-sm mt-1">Run ID: <span className="font-mono text-slate-500">{report.flow_id}</span></p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
              <div className="text-slate-500 text-sm mb-1">Issuer</div>
              <div className="text-slate-200 font-medium">{report.issuer}</div>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
              <div className="text-slate-500 text-sm mb-1">Wallet</div>
              <div className="text-slate-200 font-medium">{report.wallet}</div>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
              <div className="text-slate-500 text-sm mb-1">Verifier</div>
              <div className="text-slate-200 font-medium">{report.verifier}</div>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
              <div className="text-slate-500 text-sm mb-1">Format & Proof</div>
              <div className="text-slate-200 font-medium">{report.format} <span className="text-slate-500">({report.proof_type})</span></div>
            </div>
          </div>

          {!isPass && report.error_code && (
            <div className="bg-red-950/30 border border-red-500/20 p-4 rounded-lg">
              <h4 className="text-red-400 font-semibold mb-2">Error Details</h4>
              <p className="text-slate-300 font-mono text-sm">{report.error_code}</p>
              {report.error_detail && <p className="text-slate-400 text-sm mt-2">{report.error_detail}</p>}
            </div>
          )}

          <div className="text-slate-500 text-sm text-center">
            Completed in {report.duration_ms}ms at {new Date(report.created_at).toLocaleString()}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-800 bg-slate-800/50 flex justify-end">
          <button 
            onClick={downloadJson}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors font-medium text-sm"
          >
            <Download size={16} />
            Export JSON
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportView;
