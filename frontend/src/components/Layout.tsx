import React, { useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Beaker, LayoutDashboard } from 'lucide-react';
import Lenis from 'lenis';
import CustomCursor from './CustomCursor';

const Layout: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    // Lenis smooth inertia scrolling
    const lenis = new Lenis({
      duration: 1.2,
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

  return (
    <div className="min-h-screen bg-void text-ink flex flex-col font-ui relative selection:bg-accent/30 selection:text-ink">
      {/* Texture Layer: Full-bleed Film Grain */}
      <div
        className="pointer-events-none fixed inset-0 z-40 opacity-[0.03] mix-blend-screen"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Global Interactive Cursor */}
      <CustomCursor />

      {/* Editorial Header */}
      <header className="px-6 py-4 border-b border-line bg-panel/80 backdrop-blur-md sticky top-0 shadow-lg z-30 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-accent via-accent/80 to-sealGold p-[1px] shadow-sm">
            <div className="w-full h-full bg-void rounded-[11px] flex items-center justify-center">
              <span className="font-display font-semibold text-sealGold text-lg">I</span>
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold font-display tracking-tight text-ink flex items-center gap-2">
              Inji Interoperability Playground
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-sealGold/10 text-sealGold border border-sealGold/20">
                v2.0 3D
              </span>
            </h1>
            <p className="text-xs text-inkDim">OpenID4VCI & OpenID4VP Cross-Module Testing Sandbox</p>
          </div>
        </div>

        <nav className="flex items-center gap-2 font-ui">
          <Link
            to="/"
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium tracking-wide transition-all ${
              location.pathname === '/'
                ? 'bg-accent text-white shadow-[0_0_15px_rgba(91,127,255,0.35)]'
                : 'text-inkDim hover:text-ink hover:bg-panelLit border border-line'
            }`}
          >
            <Beaker size={15} />
            Exchange Console
          </Link>
          <Link
            to="/dashboard"
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium tracking-wide transition-all ${
              location.pathname === '/dashboard'
                ? 'bg-accent text-white shadow-[0_0_15px_rgba(91,127,255,0.35)]'
                : 'text-inkDim hover:text-ink hover:bg-panelLit border border-line'
            }`}
          >
            <LayoutDashboard size={15} />
            Historical Ledger
          </Link>
        </nav>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-6 lg:p-8 flex flex-col max-w-7xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
