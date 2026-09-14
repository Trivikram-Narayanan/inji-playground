import React from 'react';

interface Act {
  number: string;
  title: string;
  description: string;
}

const ACTS: Act[] = [
  { number: '01', title: 'Issuance', description: 'Offer → Token → Credential' },
  { number: '02', title: 'Transit', description: 'Boundary crossing' },
  { number: '03', title: 'Verdict', description: 'Cryptographic resolution' },
];

type ActId = 0 | 1 | 2;

interface ActRailProps {
  activeAct: ActId;
}

const ActRail: React.FC<ActRailProps> = ({ activeAct }) => {
  return (
    <div className="flex flex-row lg:flex-col gap-0 lg:gap-0">
      {ACTS.map((act, i) => {
        const isActive = i === activeAct;
        const isPast = i < activeAct;

        return (
          <div key={act.number} className="flex flex-col lg:flex-col relative">
            {/* Connecting line between acts */}
            {i > 0 && (
              <div
                className={`hidden lg:block w-px self-start ml-[9px] transition-all duration-500 ${
                  isPast ? 'h-6 bg-ink/30' : 'h-6 bg-line/50'
                }`}
              />
            )}

            {/* Act marker */}
            <div
              className={`flex items-start gap-3 py-3 transition-all duration-400 ${
                isActive ? 'opacity-100' : isPast ? 'opacity-40' : 'opacity-30'
              }`}
            >
              {/* Dot */}
              <div
                className={`w-[6px] h-[6px] rounded-full mt-1.5 shrink-0 transition-all duration-300 ${
                  isActive ? 'bg-ink scale-110' : isPast ? 'bg-inkDim' : 'bg-line'
                }`}
              />

              {/* Text */}
              <div className="hidden lg:block">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[10px] font-mono text-inkDim tracking-widest">{act.number}</span>
                  <span
                    className={`text-xs font-ui font-medium tracking-wide ${
                      isActive ? 'text-ink' : 'text-inkDim'
                    }`}
                  >
                    {act.title}
                  </span>
                </div>
                {isActive && (
                  <p className="text-[10px] font-mono text-inkDim mt-0.5 act-underline">
                    {act.description}
                  </p>
                )}
              </div>

              {/* Mobile: number only */}
              <span className="lg:hidden text-[10px] font-mono text-inkDim tracking-widest">
                {act.number}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ActRail;
