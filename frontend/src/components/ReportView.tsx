import React from 'react';
import { Download, FileText, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import MagneticButton from './MagneticButton';

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

  const verdictLabel = isPass
    ? 'VERIFIED'
    : report.error_code === 'CREDENTIAL_EXPIRED'
    ? 'EXPIRED'
    : 'REJECTED';

  const verdictSubline = isPass
    ? 'Cryptographic integrity and claim signatures confirmed across modules.'
    : report.error_code === 'CREDENTIAL_EXPIRED'
    ? 'Cryptographic signatures verified, but validity period has elapsed.'
    : 'This credential did not survive cross-module boundary verification.';

  return (
    <div className="fixed inset-0 bg-void/85 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="bg-panel border border-line shadow-2xl rounded-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-line flex justify-between items-center bg-panelLit">
          <div className="flex items-center gap-3">
            <FileText className="text-inkDim" size={20} />
            <h2 className="text-lg font-display font-semibold text-ink tracking-tight">Interoperability Case Dossier</h2>
          </div>
          <button
            onClick={onClose}
            className="text-inkDim hover:text-ink text-2xl leading-none transition-colors cursor-pointer"
          >
            &times;
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 flex flex-col gap-6">
          {/* Signature Verdict Banner */}
          <div
            className={`p-6 rounded-xl flex items-center gap-5 border transition-all ${
              isPass
                ? 'bg-verified/10 border-verified/30'
                : report.error_code === 'CREDENTIAL_EXPIRED'
                ? 'bg-pending/10 border-pending/30'
                : 'bg-rejected/10 border-rejected/30'
            }`}
          >
            {isPass ? (
              <CheckCircle2 className="text-verified w-12 h-12 shrink-0" />
            ) : report.error_code === 'CREDENTIAL_EXPIRED' ? (
              <AlertTriangle className="text-pending w-12 h-12 shrink-0" />
            ) : (
              <XCircle className="text-rejected w-12 h-12 shrink-0" />
            )}
            <div>
              {/* Serif Display Verdict */}
              <h3
                className={`text-3xl font-display font-semibold tracking-tight ${
                  isPass ? 'text-verified' : report.error_code === 'CREDENTIAL_EXPIRED' ? 'text-pending' : 'text-rejected'
                }`}
              >
                {verdictLabel}
              </h3>
              <p className="text-inkDim text-sm mt-1">{verdictSubline}</p>
              <p className="text-inkDim/70 font-mono text-xs mt-2">
                Flow ID: <span className="text-ink font-mono">{report.flow_id}</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-panelLit p-4 rounded-xl border border-line">
              <div className="text-inkDim text-xs font-mono uppercase tracking-wider mb-1">Issuer Authority</div>
              <div className="text-ink font-medium">{report.issuer}</div>
            </div>
            <div className="bg-panelLit p-4 rounded-xl border border-line">
              <div className="text-inkDim text-xs font-mono uppercase tracking-wider mb-1">Holder Wallet</div>
              <div className="text-ink font-medium">{report.wallet}</div>
            </div>
            <div className="bg-panelLit p-4 rounded-xl border border-line">
              <div className="text-inkDim text-xs font-mono uppercase tracking-wider mb-1">Relying Party Verifier</div>
              <div className="text-ink font-medium">{report.verifier}</div>
            </div>
            <div className="bg-panelLit p-4 rounded-xl border border-line">
              <div className="text-inkDim text-xs font-mono uppercase tracking-wider mb-1">Format & Cryptography</div>
              <div className="text-ink font-medium">
                {report.format} <span className="text-sealGold font-mono text-xs">({report.proof_type})</span>
              </div>
            </div>
          </div>

          {!isPass && report.error_code && (
            <div className="bg-rejected/10 border border-rejected/25 p-4 rounded-xl">
              <h4 className="text-rejected font-semibold text-sm mb-2 font-mono uppercase tracking-wide">
                Diagnosed Failure Signature
              </h4>
              <p className="text-ink font-mono text-sm font-semibold">{report.error_code}</p>
              {report.error_detail && <p className="text-inkDim text-sm mt-2 leading-relaxed">{report.error_detail}</p>}
            </div>
          )}

          <div className="text-inkDim text-xs text-center font-mono">
            Transaction finalized in <span className="text-ink font-bold">{report.duration_ms}ms</span> •{' '}
            {new Date(report.created_at).toLocaleString()}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-line bg-panelLit flex justify-between items-center">
          <button
            onClick={onClose}
            className="text-xs font-medium text-inkDim hover:text-ink transition-colors cursor-pointer"
          >
            Dismiss Dossier
          </button>
          <MagneticButton
            onClick={downloadJson}
            className="flex items-center gap-2 px-5 py-2.5 bg-panel hover:bg-line text-ink border border-line rounded-xl transition-all font-medium text-xs shadow-sm cursor-pointer"
          >
            <Download size={14} className="text-inkDim" />
            Open Full Report (JSON)
          </MagneticButton>
        </div>
      </div>
    </div>
  );
};

export default ReportView;
