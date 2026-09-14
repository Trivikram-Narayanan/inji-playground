import React from 'react';

/**
 * TrustBoundary — the spatial divider between Act I (issuance domain)
 * and Act II (verifier domain). A precise 1px architectural line.
 * Not a thick divider. Not a decorative element.
 * Communicates: different systems do not automatically trust each other.
 */

interface TrustBoundaryProps {
  visible?: boolean;
  format?: string;
}

const TrustBoundary: React.FC<TrustBoundaryProps> = ({
  visible = true,
  format = 'OpenID4VP',
}) => {
  return (
    <div
      className={`relative py-6 transition-opacity duration-700 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      aria-label="Trust boundary between issuer and verifier domains"
    >
      <div className="flex items-center gap-0">
        {/* Left label — issuer domain */}
        <div className="flex flex-col items-start shrink-0 mr-4">
          <span className="text-[9px] font-mono text-inkDim tracking-[0.2em] uppercase">
            Issuer Domain
          </span>
          <span className="text-[9px] font-mono text-inkDim/50">
            OpenID4VCI
          </span>
        </div>

        {/* The boundary line — this is the design element */}
        <div className="flex-1 relative h-px overflow-visible">
          {/* Main line */}
          <div
            className={`h-px bg-line ${visible ? 'line-draw' : ''}`}
            style={{ width: '100%' }}
          />
          {/* Dashed overlay — communicates protocol handoff */}
          <div
            className="absolute top-0 left-0 h-px w-full"
            style={{
              backgroundImage: 'repeating-linear-gradient(90deg, rgba(91,127,255,0.3) 0, rgba(91,127,255,0.3) 4px, transparent 4px, transparent 12px)',
              maskImage: 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.5) 30%, rgba(0,0,0,0.5) 70%, transparent 100%)',
            }}
          />

          {/* Protocol label — center of the boundary */}
          <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 top-0 px-3 bg-void">
            <span className="text-[9px] font-mono text-inkDim/60 tracking-[0.15em] uppercase whitespace-nowrap">
              {format} · Trust Boundary
            </span>
          </div>
        </div>

        {/* Right label — verifier domain */}
        <div className="flex flex-col items-end shrink-0 ml-4">
          <span className="text-[9px] font-mono text-inkDim tracking-[0.2em] uppercase">
            Verifier Domain
          </span>
          <span className="text-[9px] font-mono text-inkDim/50">
            OpenID4VP
          </span>
        </div>
      </div>
    </div>
  );
};

export default TrustBoundary;
