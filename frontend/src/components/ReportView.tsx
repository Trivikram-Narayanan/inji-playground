import React, { useEffect } from 'react';
import { Download, FileText, CheckCircle2, XCircle, AlertTriangle, Clock } from 'lucide-react';
import type { InteropReport } from '../types';

interface ReportViewProps {
  report: InteropReport;
  onClose: () => void;
}

export const ReportView: React.FC<ReportViewProps> = ({ report, onClose }) => {
  const isPass = report.outcome === 'pass';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const downloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `interop-report-${report.flow_id.slice(0, 8)}.json`);
    dlAnchorElem.click();
  };

  return (
    <div
      className="fixed inset-0 bg-[#090a0c]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-view-title"
        onClick={(e) => e.stopPropagation()}
        className="bg-[#0f1115] border border-[#ffffff14] shadow-2xl rounded-none w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden relative"
      >
        {/* Hairline accent line */}
        <div className={`h-[2px] w-full ${isPass ? 'bg-[#22c55e]' : 'bg-[#ff4d2e]'}`} />

        {/* Header */}
        <div className="px-5 py-3 border-b border-[#ffffff14] flex justify-between items-center bg-[#090a0c]">
          <div className="flex items-center gap-2 font-mono">
            <FileText size={15} className="text-[#e5a93c]" />
            <h2 id="report-view-title" className="text-sm font-bold text-[#f0f2f5] tracking-wide">
              INTEROPERABILITY_CERTIFICATE
            </h2>
            <span className="text-[#535965] text-xs">:: {report.flow_id.slice(0, 8)}</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close report"
            className="text-[#8a919e] hover:text-[#f0f2f5] text-lg leading-none px-2 py-0.5 border border-[#ffffff14] hover:border-[#ffffff2e]"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto custom-scrollbar flex-1 flex flex-col gap-4 font-mono">
          {/* Outcome Banner */}
          <div
            className={`p-4 border flex items-center gap-3.5 ${
              isPass
                ? 'bg-[#22c55e]/10 border-[#22c55e]/40 text-[#22c55e]'
                : 'bg-[#ff4d2e]/10 border-[#ff4d2e]/40 text-[#ff4d2e]'
            }`}
          >
            {isPass ? (
              <CheckCircle2 size={24} />
            ) : report.error_code === 'CREDENTIAL_EXPIRED' ? (
              <AlertTriangle size={24} className="text-[#e5a93c]" />
            ) : (
              <XCircle size={24} />
            )}
            <div>
              <div className="text-base font-bold tracking-wider">
                {isPass ? 'CRYPTOGRAPHIC VERIFICATION VALID' : 'CRYPTOGRAPHIC VERIFICATION REJECTED'}
              </div>
              <div className="text-xs opacity-80 mt-0.5">
                PROOF TYPE: {report.proof_type || 'DIGITAL_SIGNATURE'}
              </div>
            </div>
          </div>

          {/* Grid of Actors & Format */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-[#090a0c] p-2.5 border border-[#ffffff14]">
              <div className="text-[#535965] text-[9px] uppercase tracking-wider mb-1">ISSUER</div>
              <div className="text-[#f0f2f5] font-bold truncate">{report.issuer}</div>
            </div>
            <div className="bg-[#090a0c] p-2.5 border border-[#ffffff14]">
              <div className="text-[#535965] text-[9px] uppercase tracking-wider mb-1">WALLET</div>
              <div className="text-[#e5a93c] font-bold truncate">{report.wallet}</div>
            </div>
            <div className="bg-[#090a0c] p-2.5 border border-[#ffffff14]">
              <div className="text-[#535965] text-[9px] uppercase tracking-wider mb-1">VERIFIER</div>
              <div className="text-[#f0f2f5] font-bold truncate">{report.verifier}</div>
            </div>
            <div className="bg-[#090a0c] p-2.5 border border-[#ffffff14]">
              <div className="text-[#535965] text-[9px] uppercase tracking-wider mb-1">FORMAT</div>
              <div className="text-[#f0f2f5] font-bold truncate">{report.format}</div>
            </div>
          </div>

          {/* Error Diagnostics (if failed) */}
          {!isPass && report.error_code && (
            <div className="bg-[#090a0c] border border-[#ff4d2e]/40 p-3.5">
              <div className="text-[#ff4d2e] font-bold text-xs uppercase tracking-wider mb-1">
                DIAGNOSTIC_CODE: [{report.error_code}]
              </div>
              {report.error_detail && (
                <p className="text-[#8a919e] text-xs mt-1 leading-relaxed font-sans">
                  {report.error_detail}
                </p>
              )}
            </div>
          )}

          {/* Telemetry info */}
          <div className="flex items-center justify-between text-[#535965] text-[10px] pt-2 border-t border-[#ffffff0f]">
            <span className="flex items-center gap-1">
              <Clock size={11} />
              LATENCY: {report.duration_ms}ms
            </span>
            <span>RECORDED_AT: {new Date(report.created_at).toLocaleString()}</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-2.5 border-t border-[#ffffff14] bg-[#090a0c] flex justify-end">
          <button
            onClick={downloadJson}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#e5a93c] hover:bg-[#d4982c] text-[#090a0c] text-xs font-mono font-bold uppercase rounded-none transition-colors"
          >
            <Download size={13} />
            EXPORT JSON
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportView;
