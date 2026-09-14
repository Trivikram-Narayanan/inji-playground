import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

/**
 * CustomCursor — central dot + trailing ring.
 * Reacts to data-cursor="pointer" (ring expands + fills slightly)
 * and data-cursor="3d" (crosshair state on the credential canvas).
 * Disabled on touch devices.
 */
const CustomCursor: React.FC = () => {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const xDot = useRef<ReturnType<typeof gsap.quickTo> | null>(null);
  const yDot = useRef<ReturnType<typeof gsap.quickTo> | null>(null);
  const xRing = useRef<ReturnType<typeof gsap.quickTo> | null>(null);
  const yRing = useRef<ReturnType<typeof gsap.quickTo> | null>(null);

  useEffect(() => {
    // Disable on touch devices
    if (window.matchMedia('(hover: none)').matches) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    // QuickTo setters — dot snaps, ring trails
    xDot.current = gsap.quickTo(dot, 'x', { duration: 0.1, ease: 'power3.out' });
    yDot.current = gsap.quickTo(dot, 'y', { duration: 0.1, ease: 'power3.out' });
    xRing.current = gsap.quickTo(ring, 'x', { duration: 0.55, ease: 'power3.out' });
    yRing.current = gsap.quickTo(ring, 'y', { duration: 0.55, ease: 'power3.out' });

    const onMove = (e: MouseEvent) => {
      const x = e.clientX;
      const y = e.clientY;
      xDot.current!(x);
      yDot.current!(y);
      xRing.current!(x);
      yRing.current!(y);

      // State detection via data-cursor attribute
      const target = e.target as HTMLElement;
      const cursorState = target?.closest('[data-cursor]')?.getAttribute('data-cursor');

      if (cursorState === 'pointer') {
        gsap.to(ring, { scale: 1.8, borderColor: 'rgba(237,239,243,0.5)', duration: 0.3, ease: 'power2.out' });
        gsap.to(dot, { scale: 0, duration: 0.2 });
      } else if (cursorState === '3d') {
        gsap.to(ring, { scale: 2.5, borderColor: 'rgba(91,127,255,0.4)', duration: 0.4, ease: 'power2.out' });
        gsap.to(dot, { scale: 0.5, duration: 0.2 });
      } else {
        gsap.to(ring, { scale: 1, borderColor: 'rgba(237,239,243,0.3)', duration: 0.4, ease: 'power2.out' });
        gsap.to(dot, { scale: 1, duration: 0.2 });
      }
    };

    const onLeave = () => {
      gsap.to([dot, ring], { opacity: 0, duration: 0.3 });
    };
    const onEnter = () => {
      gsap.to([dot, ring], { opacity: 1, duration: 0.3 });
    };

    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseleave', onLeave);
    document.addEventListener('mouseenter', onEnter);

    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('mouseenter', onEnter);
    };
  }, []);

  return (
    <>
      {/* Central dot — snaps instantly */}
      <div
        ref={dotRef}
        className="pointer-events-none fixed z-[9999] rounded-full bg-ink"
        style={{
          width: '5px',
          height: '5px',
          transform: 'translate(-50%, -50%)',
          top: 0,
          left: 0,
          willChange: 'transform',
        }}
      />
      {/* Trailing ring — slower follow */}
      <div
        ref={ringRef}
        className="pointer-events-none fixed z-[9998] rounded-full border"
        style={{
          width: '28px',
          height: '28px',
          transform: 'translate(-50%, -50%)',
          top: 0,
          left: 0,
          borderColor: 'rgba(237,239,243,0.3)',
          willChange: 'transform',
        }}
      />
    </>
  );
};

export default CustomCursor;
