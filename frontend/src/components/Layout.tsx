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
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col font-sans relative selection:bg-indigo-500/30 selection:text-indigo-200">
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
      <header className="px-6 py-4 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 shadow-lg z-30 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 p-[1px] shadow-sm">
            <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
              <span className="font-serif font-bold text-indigo-300 text-lg">I</span>
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold font-serif tracking-tight text-slate-100 flex items-center gap-2">
              Inji Interoperability Playground
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                v2.0 3D
              </span>
            </h1>
            <p className="text-xs text-slate-400">OpenID4VCI & OpenID4VP Cross-Module Testing Sandbox</p>
          </div>
        </div>

        <nav className="flex items-center gap-2">
          <Link
            to="/"
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium tracking-wide transition-all ${
              location.pathname === '/'
                ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-800/80'
            }`}
          >
            <Beaker size={15} />
            Exchange Console
          </Link>
          <Link
            to="/dashboard"
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium tracking-wide transition-all ${
              location.pathname === '/dashboard'
                ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-800/80'
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
