import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download } from 'lucide-react';
import VerdictSeal from './VerdictSeal';

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
  const isExpired = report.error_code === 'CREDENTIAL_EXPIRED';

  const verdict = isPass ? 'verified' : isExpired ? 'expired' : 'rejected';

  const downloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2));
    const el = document.createElement('a');
    el.setAttribute('href', dataStr);
    el.setAttribute('download', `report-${report.flow_id.slice(0, 8)}.json`);
    el.click();
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-void/90 backdrop-blur-md z-50 flex items-center justify-center p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-panel border border-line w-full max-w-xl flex flex-col max-h-[85vh] overflow-hidden"
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 360, delay: 0.05 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-8 pt-8 pb-4 border-b border-line flex items-start justify-between">
            <div>
              <div className="text-[9px] font-mono text-inkDim tracking-[0.2em] uppercase mb-2">
                Interoperability Case Dossier
              </div>
              <div className="text-[10px] font-mono text-inkDim/50">
                Flow: {report.flow_id}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-inkDim hover:text-ink text-xl leading-none transition-colors mt-1"
              data-cursor="pointer"
            >
              ×
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-8">
            {/* Verdict — using VerdictSeal as the cinematic centre */}
            <VerdictSeal verdict={verdict} visible={true} />

            {/* Technical details — two-column mono grid */}
            <div className="border-t border-line pt-6">
              <div className="grid grid-cols-2 gap-6">
                {[
                  { label: 'Issuer Authority', value: report.issuer },
                  { label: 'Holder Wallet', value: report.wallet },
                  { label: 'Relying Party', value: report.verifier },
                  { label: 'Format', value: report.format },
                  { label: 'Proof Type', value: report.proof_type },
                  { label: 'Duration', value: `${report.duration_ms}ms` },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div className="text-[9px] font-mono text-inkDim tracking-[0.15em] uppercase mb-1">
                      {label}
                    </div>
                    <div className="text-xs font-mono text-ink">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Failure signature */}
            {!isPass && report.error_code && (
              <div className="border-t border-line pt-6">
                <div className="text-[9px] font-mono text-inkDim tracking-[0.15em] uppercase mb-3">
                  Failure Signature
                </div>
                <div className="font-mono text-sm text-rejected mb-2">{report.error_code}</div>
                {report.error_detail && (
                  <p className="text-xs font-ui text-inkDim leading-relaxed">{report.error_detail}</p>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 pb-6 pt-4 border-t border-line flex items-center justify-between">
            <button
              onClick={onClose}
              className="text-[10px] font-mono text-inkDim border-b border-inkDim/30 pb-px hover:text-ink hover:border-ink/60 transition-colors"
              data-cursor="pointer"
            >
              Dismiss
            </button>
            <button
              onClick={downloadJson}
              className="flex items-center gap-2 text-[10px] font-mono text-inkDim hover:text-ink transition-colors"
              data-cursor="pointer"
            >
              <Download size={11} />
              Download JSON
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ReportView;
