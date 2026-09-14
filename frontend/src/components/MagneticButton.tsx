import React, { useRef } from 'react';
import gsap from 'gsap';

interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'subtle';
}

/**
 * Section 15: Primary CTA button with magnetic spring movement, tactile press,
 * and disciplined accent usage.
 */
export const MagneticButton: React.FC<MagneticButtonProps> = ({
  children,
  className = '',
  variant = 'primary',
  disabled,
  onClick,
  ...props
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLSpanElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || !buttonRef.current || !contentRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);

    gsap.to(buttonRef.current, {
      x: x * 0.28,
      y: y * 0.28,
      duration: 0.3,
      ease: 'power2.out',
    });

    gsap.to(contentRef.current, {
      x: x * 0.14,
      y: y * 0.14,
      duration: 0.3,
      ease: 'power2.out',
    });
  };

  const handleMouseLeave = () => {
    if (!buttonRef.current || !contentRef.current) return;
    gsap.to(buttonRef.current, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
    gsap.to(contentRef.current, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
  };

  const handleMouseDown = () => {
    if (disabled || !buttonRef.current) return;
    gsap.to(buttonRef.current, { scale: 0.96, duration: 0.1 });
  };

  const handleMouseUp = () => {
    if (disabled || !buttonRef.current) return;
    gsap.to(buttonRef.current, { scale: 1, duration: 0.2 });
  };

  const baseStyle =
    'relative inline-flex items-center justify-center font-ui text-xs tracking-wider uppercase font-medium transition-colors select-none focus:outline-none';

  const variants = {
    primary:
      'px-8 py-3.5 bg-ink text-void hover:bg-white border border-ink active:bg-inkDim disabled:opacity-30 disabled:pointer-events-none',
    secondary:
      'px-6 py-3 bg-panelLit text-ink hover:bg-panel border border-line hover:border-inkDim active:bg-panel disabled:opacity-30 disabled:pointer-events-none',
    subtle:
      'px-4 py-2 bg-transparent text-inkDim hover:text-ink border border-transparent hover:border-line disabled:opacity-30 disabled:pointer-events-none',
  };

  return (
    <button
      ref={buttonRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${className}`}
      {...props}
    >
      <span ref={contentRef} className="relative z-10 flex items-center gap-2">
        {children}
      </span>
    </button>
  );
};
