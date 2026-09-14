import React, { useRef, useCallback, useEffect } from 'react';
import gsap from 'gsap';

interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  strength?: number;
  id?: string;
}

/**
 * MagneticButton — GSAP quickTo spring attraction.
 * Physical, tactile press feedback.
 * Restricted to exactly 2 instances: hero CTA and selector CTA.
 */
const MagneticButton: React.FC<MagneticButtonProps> = ({
  children,
  className = '',
  strength = 0.4,
  onClick,
  id,
  ...rest
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const xTo = useRef<ReturnType<typeof gsap.quickTo> | null>(null);
  const yTo = useRef<ReturnType<typeof gsap.quickTo> | null>(null);

  useEffect(() => {
    if (!buttonRef.current) return;
    xTo.current = gsap.quickTo(buttonRef.current, 'x', { duration: 0.5, ease: 'power3.out' });
    yTo.current = gsap.quickTo(buttonRef.current, 'y', { duration: 0.5, ease: 'power3.out' });
    return () => {
      gsap.set(buttonRef.current, { x: 0, y: 0 });
    };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current || !xTo.current || !yTo.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = (e.clientX - centerX) * strength;
    const dy = (e.clientY - centerY) * strength;
    xTo.current(dx);
    yTo.current(dy);
  }, [strength]);

  const handleMouseLeave = useCallback(() => {
    if (!xTo.current || !yTo.current) return;
    xTo.current(0);
    yTo.current(0);
  }, []);

  const handleMouseDown = useCallback(() => {
    if (!buttonRef.current) return;
    gsap.to(buttonRef.current, { scale: 0.95, duration: 0.12, ease: 'power2.out' });
  }, []);

  const handleMouseUp = useCallback(() => {
    if (!buttonRef.current) return;
    gsap.to(buttonRef.current, { scale: 1, duration: 0.3, ease: 'elastic.out(1.2, 0.5)' });
  }, []);

  return (
    <button
      ref={buttonRef}
      id={id}
      className={className}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      {...rest}
    >
      {children}
    </button>
  );
};

export default MagneticButton;
