import React from 'react';

/**
 * Section 27: Subtle animated grain texture for the application shell.
 * Uses mix-blend-mode: overlay with extremely low opacity.
 */
export const GrainOverlay: React.FC = () => {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
      aria-hidden="true"
    >
      <svg
        className="absolute inset-[-200%] w-[400%] h-[400%] opacity-[0.035] animate-grain"
        style={{ mixBlendMode: 'overlay' }}
      >
        <filter id="grain-noise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.75"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain-noise)" />
      </svg>
    </div>
  );
};
