import React, { useEffect, useRef } from 'react';

/**
 * VerdictSeal — the second major cinematic moment.
 * SVG-based seal/check drawn via strokeDashoffset.
 * Fraunces display verdict typography.
 * No alert box. No lucide icon. No coloured background card.
 */

type VerdictType = 'verified' | 'rejected' | 'expired';

interface VerdictSealProps {
  verdict: VerdictType;
  visible: boolean;
  onViewReport?: () => void;
}

const VERDICT_CONFIG = {
  verified: {
    color: '#3FCC8F',
    label: 'Verified',
    sublabel: 'Cryptographic integrity confirmed across trust boundary.',
  },
  rejected: {
    color: '#E4574F',
    label: 'Rejected',
    sublabel: 'Presentation signature or claim integrity failed verification.',
  },
  expired: {
    color: '#D8A63D',
    label: 'Expired',
    sublabel: 'Signatures valid — validity period has elapsed.',
  },
};

const VerdictSeal: React.FC<VerdictSealProps> = ({ verdict, visible, onViewReport }) => {
  const sealRef = useRef<SVGCircleElement>(null);
  const checkRef = useRef<SVGPathElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const config = VERDICT_CONFIG[verdict];

  useEffect(() => {
    if (!visible) return;

    // Brief delay then trigger CSS animations
    const t1 = setTimeout(() => {
      if (sealRef.current) {
        sealRef.current.style.strokeDashoffset = '0';
        sealRef.current.style.transition = 'stroke-dashoffset 1.1s cubic-bezier(0.16, 1, 0.3, 1)';
      }
    }, 100);

    const t2 = setTimeout(() => {
      if (checkRef.current) {
        checkRef.current.style.strokeDashoffset = '0';
        checkRef.current.style.transition = 'stroke-dashoffset 0.7s cubic-bezier(0.16, 1, 0.3, 1)';
      }
    }, 600);

    const t3 = setTimeout(() => {
      if (contentRef.current) {
        contentRef.current.classList.add('verdict-reveal');
        contentRef.current.style.opacity = '1';
      }
    }, 900);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [visible]);

  if (!visible) return null;

  // SVG path for verified check vs rejected cross vs expired dash
  const markPath =
    verdict === 'verified'
      ? 'M 14 26 L 22 34 L 36 18'
      : verdict === 'rejected'
      ? 'M 16 16 L 34 34 M 34 16 L 16 34'
      : 'M 14 25 L 36 25';

  const markLength = verdict === 'verified' ? 28 : verdict === 'rejected' ? 50 : 22;

  return (
    <div className="flex flex-col items-center text-center py-10 gap-6">
      {/* SVG Seal */}
      <div className="relative">
        <svg width="100" height="100" viewBox="0 0 50 50" fill="none">
          {/* Outer ring — draws first */}
          <circle
            ref={sealRef}
            cx="25"
            cy="25"
            r="22"
            stroke={config.color}
            strokeWidth="0.8"
            strokeDasharray="138.2"
            strokeDashoffset="138.2"
            strokeLinecap="round"
            fill="none"
            style={{
              transform: 'rotate(-90deg)',
              transformOrigin: '50% 50%',
            }}
          />
          {/* Tick marks (decorative precision detail) */}
          {Array.from({ length: 36 }, (_, i) => {
            const angle = (i / 36) * 360;
            const r = 20;
            const isMajor = i % 9 === 0;
            const len = isMajor ? 1.2 : 0.6;
            const x1 = 25 + r * Math.cos((angle * Math.PI) / 180);
            const y1 = 25 + r * Math.sin((angle * Math.PI) / 180);
            const x2 = 25 + (r + len) * Math.cos((angle * Math.PI) / 180);
            const y2 = 25 + (r + len) * Math.sin((angle * Math.PI) / 180);
            return (
              <line
                key={i}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={config.color}
                strokeWidth={isMajor ? 0.5 : 0.25}
                strokeOpacity={isMajor ? 0.5 : 0.2}
              />
            );
          })}
          {/* Check / cross / dash — draws second */}
          <path
            ref={checkRef}
            d={markPath}
            stroke={config.color}
            strokeWidth={verdict === 'verified' ? 1.8 : 1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={markLength}
            strokeDashoffset={markLength}
            fill="none"
            style={{ transition: 'none' }}
          />
        </svg>
      </div>

      {/* Verdict typography — appears after seal draws */}
      <div
        ref={contentRef}
        className="flex flex-col items-center gap-3"
        style={{ opacity: 0 }}
      >
        <h2
          className="font-display text-5xl font-light tracking-tight italic"
          style={{ color: config.color }}
        >
          {config.label}
        </h2>
        <p className="text-sm text-inkDim font-ui max-w-xs leading-relaxed">
          {config.sublabel}
        </p>

        {onViewReport && (
          <button
            onClick={onViewReport}
            className="mt-2 text-xs font-mono text-inkDim border-b border-inkDim/30 pb-px hover:text-ink hover:border-ink/60 transition-colors duration-200"
            data-cursor="pointer"
          >
            Open case dossier
          </button>
        )}
      </div>
    </div>
  );
};

export default VerdictSeal;
