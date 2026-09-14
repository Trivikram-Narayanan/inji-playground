import React from 'react';
import type { InteropReport } from '../types/flow';
import { VerdictSeal } from './VerdictSeal';
import { MagneticButton } from './MagneticButton';

interface ReportViewProps {
  report: InteropReport;
  onReset: () => void;
}

/**
 * Sections 19 & 20: Act III Verdict and Architectural Information Hierarchy.
 * The final verdict dominates the screen, with secondary technical details positioned below.
 */
export const ReportView: React.FC<ReportViewProps> = ({ report, onReset }) => {
  const isPass = report.outcome === 'pass';
  const outcomeKey: 'pass' | 'fail' | 'expired' =
    report.error_code === 'CREDENTIAL_EXPIRED'
      ? 'expired'
      : isPass
      ? 'pass'
      : 'fail';

  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-12 flex flex-col items-center">
      {/* Chapter Marker */}
      <span className="font-mono text-xs text-sealGold uppercase tracking-widest mb-6">
        ACT III // FINAL RESOLUTION
      </span>

      {/* Primary Hero Moment: Animated Verdict Seal */}
      <div className="w-full border border-line bg-panel/40 p-8 md:p-12 flex flex-col items-center justify-center mb-8">
        <VerdictSeal outcome={outcomeKey} />

        {report.error_code && (
          <div className="mt-4 px-4 py-2 border border-rejected/40 bg-rejected/10 text-rejected font-mono text-xs">
            ERROR: {report.error_code} — {report.error_detail || 'Verification check failed'}
          </div>
        )}
      </div>

      {/* Section 20: Secondary Information Hierarchy */}
      <div className="w-full border border-line bg-panel/20 p-6 md:p-8 flex flex-col gap-6 mb-8">
        <div className="flex items-center justify-between border-b border-line pb-4">
          <span className="font-mono text-xs text-inkDim uppercase tracking-wider">
            EXCHANGE AUDIT TRAIL
          </span>
          <span className="font-mono text-xs text-inkDim">
            FLOW: {report.flow_id}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex flex-col">
            <span className="font-mono text-[10px] text-inkDim uppercase">ISSUER</span>
            <span className="font-mono text-xs text-ink mt-1">{report.issuer}</span>
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-[10px] text-inkDim uppercase">WALLET</span>
            <span className="font-mono text-xs text-ink mt-1">{report.wallet}</span>
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-[10px] text-inkDim uppercase">VERIFIER</span>
            <span className="font-mono text-xs text-ink mt-1">{report.verifier}</span>
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-[10px] text-inkDim uppercase">FORMAT</span>
            <span className="font-mono text-xs text-sealGold mt-1 uppercase">
              {report.format}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 border-t border-line/60 pt-4">
          <div className="flex flex-col">
            <span className="font-mono text-[10px] text-inkDim uppercase">PROOF TYPE</span>
            <span className="font-mono text-xs text-ink mt-1">
              {report.proof_type || 'Ed25519Signature2020'}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-[10px] text-inkDim uppercase">TOTAL DURATION</span>
            <span className="font-mono text-xs text-ink mt-1">{report.duration_ms} ms</span>
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-[10px] text-inkDim uppercase">RECORDED AT</span>
            <span className="font-mono text-xs text-ink mt-1">
              {new Date(report.created_at).toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>

      {/* Action Affordance */}
      <div className="flex items-center gap-4">
        <MagneticButton onClick={onReset} variant="primary">
          INITIATE NEW EXCHANGE
        </MagneticButton>
      </div>
    </div>
  );
};
