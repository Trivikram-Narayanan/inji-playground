import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

/**
 * Section 24: Custom cursor with central dot and trailing spring ring.
 * Reacts to interactive elements, transforms into expanded ring on hover.
 * Automatically deactivates on touch devices.
 */
export const CustomCursor: React.FC = () => {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Disable on touch devices
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    // Fast quickTo setters for 60fps tracking
    const setDotX = gsap.quickTo(dot, 'x', { duration: 0.08, ease: 'power2.out' });
    const setDotY = gsap.quickTo(dot, 'y', { duration: 0.08, ease: 'power2.out' });

    const setRingX = gsap.quickTo(ring, 'x', { duration: 0.22, ease: 'power3.out' });
    const setRingY = gsap.quickTo(ring, 'y', { duration: 0.22, ease: 'power3.out' });

    let isVisible = false;

    const onMouseMove = (e: MouseEvent) => {
      if (!isVisible) {
        gsap.to([dot, ring], { opacity: 1, duration: 0.2 });
        isVisible = true;
      }
      setDotX(e.clientX);
      setDotY(e.clientY);
      setRingX(e.clientX);
      setRingY(e.clientY);
    };

    const onMouseEnterInteractive = () => {
      gsap.to(ring, {
        scale: 1.8,
        borderColor: '#C9A24B',
        backgroundColor: 'rgba(201, 162, 75, 0.08)',
        duration: 0.2,
      });
      gsap.to(dot, { scale: 0.5, backgroundColor: '#C9A24B', duration: 0.2 });
    };

    const onMouseLeaveInteractive = () => {
      gsap.to(ring, {
        scale: 1,
        borderColor: 'rgba(237, 239, 243, 0.35)',
        backgroundColor: 'transparent',
        duration: 0.2,
      });
      gsap.to(dot, { scale: 1, backgroundColor: '#EDEFF3', duration: 0.2 });
    };

    const onMouseDown = () => {
      gsap.to([dot, ring], { scale: 0.85, duration: 0.1 });
    };

    const onMouseUp = () => {
      gsap.to([dot, ring], { scale: 1, duration: 0.15 });
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);

    const attachListeners = () => {
      const interactives = document.querySelectorAll('button, a, input, select, [data-interactive="true"]');
      interactives.forEach((el) => {
        el.addEventListener('mouseenter', onMouseEnterInteractive);
        el.addEventListener('mouseleave', onMouseLeaveInteractive);
      });
    };

    attachListeners();
    const observer = new MutationObserver(attachListeners);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <div
        ref={dotRef}
        className="pointer-events-none fixed top-0 left-0 z-[9999] -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-ink opacity-0 transition-opacity duration-150"
        aria-hidden="true"
      />
      <div
        ref={ringRef}
        className="pointer-events-none fixed top-0 left-0 z-[9998] -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full border border-ink/40 opacity-0 transition-opacity duration-150"
        aria-hidden="true"
      />
    </>
  );
};
