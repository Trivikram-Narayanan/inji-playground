import React from 'react';

/**
 * GrainOverlay — full-bleed animated film grain texture.
 * Fixed position, pointer-events-none, z-50.
 * Restricted to mix-blend-mode: overlay at very low opacity.
 * The grain prevents the UI from feeling digitally sterile.
 */
const GrainOverlay: React.FC = () => {
  return (
    <div
      className="grain-animate pointer-events-none fixed inset-0 z-50"
      style={{
        opacity: 0.025,
        mixBlendMode: 'overlay',
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '256px 256px',
        willChange: 'transform',
      }}
      aria-hidden="true"
    />
  );
};

export default GrainOverlay;
