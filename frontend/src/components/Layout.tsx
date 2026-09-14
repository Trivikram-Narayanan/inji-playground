import React, { useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import CustomCursor from './CustomCursor';
import GrainOverlay from './GrainOverlay';

const Layout: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    const rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  const isExchange = location.pathname === '/';

  return (
    <div className="min-h-screen bg-void text-ink flex flex-col font-ui relative">
      {/* Film Grain */}
      <GrainOverlay />

      {/* Custom cursor */}
      <CustomCursor />

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-30 px-6 lg:px-12 py-5 flex items-center justify-between">
        {/* Left: Wordmark */}
        <div className="flex items-center gap-4">
          {/* Geometric mark — a small precision square */}
          <div
            className="w-5 h-5 border border-sealGold/60 relative flex items-center justify-center shrink-0"
            style={{ transform: 'rotate(45deg)' }}
          >
            <div className="w-2 h-2 bg-sealGold/80" />
          </div>
          <div>
            <span className="font-display text-sm font-semibold text-ink tracking-tight leading-none">
              Inji Playground
            </span>
            <div className="text-[10px] font-mono text-inkDim tracking-widest uppercase mt-0.5 leading-none">
              OpenID4VCI · OpenID4VP
            </div>
          </div>
        </div>

        {/* Right: Minimal nav */}
        <nav className="flex items-center gap-1">
          <Link
            to="/"
            className={`relative px-4 py-2 text-xs font-mono tracking-wide transition-colors duration-200 ${
              isExchange ? 'text-ink' : 'text-inkDim hover:text-ink'
            }`}
            data-cursor="pointer"
          >
            Exchange Console
            {isExchange && (
              <span className="absolute bottom-0 left-4 right-4 h-px bg-ink" />
            )}
          </Link>
          <span className="text-line text-xs select-none">·</span>
          <Link
            to="/dashboard"
            className={`relative px-4 py-2 text-xs font-mono tracking-wide transition-colors duration-200 ${
              !isExchange ? 'text-ink' : 'text-inkDim hover:text-ink'
            }`}
            data-cursor="pointer"
          >
            Case Files
            {!isExchange && (
              <span className="absolute bottom-0 left-4 right-4 h-px bg-ink" />
            )}
          </Link>
        </nav>
      </header>

      {/* ── Main ───────────────────────────────────────────────────────── */}
      <main className="flex-1 pt-16">
        <Outlet />
      </main>

      {/* ── Footer rule ────────────────────────────────────────────────── */}
      <footer className="px-6 lg:px-12 py-6 border-t border-line flex items-center justify-between">
        <span className="text-[10px] font-mono text-inkDim tracking-widest uppercase">
          MOSIP · Inji Interoperability Playground
        </span>
        <span className="text-[10px] font-mono text-inkDim">
          OpenID4VCI · OpenID4VP · W3C VC
        </span>
      </footer>
    </div>
  );
};

export default Layout;
