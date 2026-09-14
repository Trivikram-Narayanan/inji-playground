import React from 'react';

interface TrustBoundaryProps {
  labelLeft?: string;
  labelRight?: string;
  format?: string;
}

/**
 * Section 18: Act II Spatial Trust Boundary.
 * Visually communicates that different systems (Issuer/Wallet vs Verifier)
 * do not automatically trust each other without cryptographic verification.
 */
export const TrustBoundary: React.FC<TrustBoundaryProps> = ({
  labelLeft = 'ISSUER / WALLET DOMAIN',
  labelRight = 'VERIFIER DOMAIN',
  format = 'SD-JWT',
}) => {
  return (
    <div className="w-full my-8 relative flex flex-col items-center">
      {/* Upper Boundary Context */}
      <div className="w-full flex items-center justify-between text-inkDim font-mono text-[10px] tracking-widest uppercase mb-3 px-2">
        <span>{labelLeft}</span>
        <span className="text-sealGold">FORMAT // {format.toUpperCase()}</span>
        <span>{labelRight}</span>
      </div>

      {/* The Physical Trust Threshold Line */}
      <div className="w-full h-px relative bg-line overflow-hidden">
        {/* Subtle traveling pulse across the threshold */}
        <div
          className="absolute top-0 bottom-0 w-32 bg-accent/40 blur-sm"
          style={{
            animation: 'travel 3.5s ease-in-out infinite alternate',
          }}
        />
      </div>

      {/* Central Spatial Boundary Pill */}
      <div className="absolute top-1/2 -translate-y-1/2 bg-void border border-line px-4 py-1 text-center">
        <span className="font-mono text-[9px] text-inkDim tracking-widest uppercase">
          CRYPTOGRAPHIC TRUST BOUNDARY
        </span>
      </div>

      <style>{`
        @keyframes travel {
          0% { left: 0%; }
          100% { left: calc(100% - 8rem); }
        }
      `}</style>
    </div>
  );
};
