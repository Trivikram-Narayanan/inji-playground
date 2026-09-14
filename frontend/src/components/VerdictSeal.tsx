import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface VerdictSealProps {
  outcome: 'pass' | 'fail' | 'expired';
}

/**
 * Section 19: Act III Verdict Seal animation.
 * Features SVG strokeDashoffset draw animation with power3.out reveal.
 */
export const VerdictSeal: React.FC<VerdictSealProps> = ({ outcome }) => {
  const circleRef = useRef<SVGCircleElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const circle = circleRef.current;
    const path = pathRef.current;
    if (!circle || !path) return;

    const circleLength = circle.getTotalLength();
    const pathLength = path.getTotalLength();

    gsap.set(circle, {
      strokeDasharray: circleLength,
      strokeDashoffset: circleLength,
    });
    gsap.set(path, {
      strokeDasharray: pathLength,
      strokeDashoffset: pathLength,
    });

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.to(circle, {
      strokeDashoffset: 0,
      duration: 0.8,
    }).to(
      path,
      {
        strokeDashoffset: 0,
        duration: 0.5,
      },
      '-=0.2'
    );

    return () => {
      tl.kill();
    };
  }, [outcome]);

  const config = {
    pass: {
      color: '#3FCC8F',
      label: 'VERIFIED',
      pathD: 'M28 48 L42 62 L72 32', // Clean Check
    },
    fail: {
      color: '#E4574F',
      label: 'REJECTED',
      pathD: 'M32 32 L68 68 M68 32 L32 68', // Fractured Cross
    },
    expired: {
      color: '#D8A63D',
      label: 'EXPIRED',
      pathD: 'M50 30 L50 52 L65 52', // Clock Time
    },
  }[outcome];

  return (
    <div className="flex flex-col items-center justify-center p-6 text-center">
      <div className="relative w-28 h-28 mb-4">
        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
          {/* Subtle background track */}
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="#171B22"
            strokeWidth="2"
          />
          {/* Animated animated seal ring */}
          <circle
            ref={circleRef}
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke={config.color}
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>

        {/* Interior Animated Path */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
          <path
            ref={pathRef}
            d={config.pathD}
            fill="none"
            stroke={config.color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <h2
        className="font-display text-4xl md:text-5xl font-light tracking-wide mb-1"
        style={{ color: config.color }}
      >
        {config.label}
      </h2>
      <span className="font-mono text-xs text-inkDim tracking-widest uppercase">
        CRYPTOGRAPHIC CHAIN RESOLUTION
      </span>
    </div>
  );
};
