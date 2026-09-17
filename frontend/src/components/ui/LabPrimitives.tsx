import React from 'react';

interface BracketBadgeProps {
  children: React.ReactNode;
  variant?: 'gold' | 'crimson' | 'emerald' | 'dim';
  pulse?: boolean;
  className?: string;
}

export const BracketBadge: React.FC<BracketBadgeProps> = ({
  children,
  variant = 'dim',
  pulse = false,
  className = '',
}) => {
  const styles = {
    gold: 'text-[#e5a93c] border-[#e5a93c]/40 bg-[#e5a93c]/10',
    crimson: 'text-[#ff4d2e] border-[#ff4d2e]/40 bg-[#ff4d2e]/10',
    emerald: 'text-[#22c55e] border-[#22c55e]/40 bg-[#22c55e]/10',
    dim: 'text-[#8a919e] border-[#ffffff14] bg-[#ffffff05]',
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-none text-xs font-mono uppercase tracking-wider border ${styles} ${className}`}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span
            className={`animate-ping absolute inline-flex h-full w-full opacity-75 ${
              variant === 'gold' ? 'bg-[#e5a93c]' :
              variant === 'crimson' ? 'bg-[#ff4d2e]' :
              variant === 'emerald' ? 'bg-[#22c55e]' : 'bg-[#8a919e]'
            }`}
          />
          <span
            className={`relative inline-flex h-1.5 w-1.5 ${
              variant === 'gold' ? 'bg-[#e5a93c]' :
              variant === 'crimson' ? 'bg-[#ff4d2e]' :
              variant === 'emerald' ? 'bg-[#22c55e]' : 'bg-[#8a919e]'
            }`}
          />
        </span>
      )}
      <span>[</span>
      <span>{children}</span>
      <span>]</span>
    </span>
  );
};

// Backwards compatibility alias
export const TerminalBadge = BracketBadge;

interface LabCardProps {
  children: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
  title?: string;
  subtitle?: string;
  badge?: React.ReactNode;
  id?: string;
}

export const LabCard: React.FC<LabCardProps> = ({
  children,
  className = '',
  header,
  title,
  subtitle,
  badge,
  id,
}) => {
  return (
    <div
      id={id}
      className={`bg-[#0f1115] border border-[#ffffff14] rounded-none p-5 md:p-6 transition-all duration-200 relative ${className}`}
    >
      {(header || title) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-5 border-b border-[#ffffff14]">
          <div>
            <div className="text-[10px] font-mono text-[#535965] uppercase tracking-widest mb-0.5">
              // SUBSYSTEM_VIEW
            </div>
            {title && (
              <h3 className="text-sm md:text-base font-bold text-[#f0f2f5] tracking-wide flex items-center gap-2 font-mono">
                <span className="w-1.5 h-1.5 bg-[#e5a93c] inline-block"></span>
                {title}
              </h3>
            )}
            {subtitle && <p className="text-xs text-[#8a919e] mt-0.5 font-sans">{subtitle}</p>}
          </div>
          {badge && <div>{badge}</div>}
          {header}
        </div>
      )}
      {children}
    </div>
  );
};
