import React from 'react';

interface ActRailProps {
  currentAct: 1 | 2 | 3;
  onSelectAct?: (act: 1 | 2 | 3) => void;
  canAdvance?: boolean;
  onAdvance?: () => void;
}

const ACTS = [
  { id: 1, label: 'ISSUANCE', subtitle: 'Genesis & Sealing' },
  { id: 2, label: 'TRANSIT', subtitle: 'Boundary Cross' },
  { id: 3, label: 'VERDICT', subtitle: 'Resolution' },
] as const;

/**
 * Section 16: Cinematic Act Rail chapter marker.
 * Persistent visual narrative rail with explicit Advance control for live demos.
 */
export const ActRail: React.FC<ActRailProps> = ({
  currentAct,
  onSelectAct,
  canAdvance = false,
  onAdvance,
}) => {
  return (
    <div className="w-full flex items-center justify-between border-b border-line bg-void/90 py-4 px-6 md:px-12 backdrop-blur-sm sticky top-0 z-40">
      <div className="flex items-center gap-6 md:gap-12">
        {ACTS.map((act) => {
          const isActive = currentAct === act.id;
          const isPassed = currentAct > act.id;

          return (
            <button
              key={act.id}
              onClick={() => onSelectAct && onSelectAct(act.id)}
              disabled={!onSelectAct}
              className={`flex items-center gap-3 text-left transition-opacity duration-200 group focus:outline-none ${
                isActive ? 'opacity-100' : isPassed ? 'opacity-65 hover:opacity-90' : 'opacity-40 hover:opacity-60'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full border flex items-center justify-center font-mono text-[10px] transition-colors ${
                  isActive
                    ? 'border-sealGold text-sealGold'
                    : isPassed
                    ? 'border-verified text-verified'
                    : 'border-line text-inkDim'
                }`}
              >
                0{act.id}
              </div>
              <div className="flex flex-col">
                <span
                  className={`font-ui text-xs tracking-wider uppercase font-medium ${
                    isActive ? 'text-ink' : 'text-inkDim'
                  }`}
                >
                  {act.label}
                </span>
                <span className="font-mono text-[9px] text-inkDim hidden md:inline">
                  {act.subtitle}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Explicit Advance affordance for judged demos (Section 16 requirement) */}
      {canAdvance && onAdvance && (
        <button
          onClick={onAdvance}
          className="flex items-center gap-2 px-3 py-1.5 border border-sealGold/50 bg-sealGold/10 hover:bg-sealGold/20 text-sealGold font-mono text-xs tracking-wider transition-colors"
        >
          <span>ADVANCE STEP</span>
          <span className="text-[10px] opacity-75">→</span>
        </button>
      )}
    </div>
  );
};
