import React, { useEffect } from 'react';
import Lenis from 'lenis';
import { GrainOverlay } from './GrainOverlay';
import { CustomCursor } from './CustomCursor';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'flow' | 'archive';
  onSelectTab: (tab: 'flow' | 'archive') => void;
}

/**
 * Layout shell providing:
 * - Minimal architectural header with tab switcher
 * - Smooth scrolling with Lenis (Section 25)
 * - Subtle animated grain overlay (Section 27)
 * - Spring magnetic custom cursor (Section 24)
 */
export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onSelectTab }) => {
  useEffect(() => {
    // Check prefers-reduced-motion (Section 30 requirement)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  return (
    <div className="min-h-screen bg-void text-ink selection:bg-accent/25 selection:text-ink font-ui relative">
      <GrainOverlay />
      <CustomCursor />

      {/* Global Architectural Navigation Bar */}
      <header className="border-b border-line bg-void/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 bg-sealGold" />
            <span className="font-mono text-xs tracking-wider uppercase font-semibold text-ink">
              INJI INTEROPERABILITY PLAYGROUND
            </span>
          </div>

          {/* Navigation Controls */}
          <nav className="flex items-center gap-6">
            <button
              onClick={() => onSelectTab('flow')}
              className={`font-mono text-xs uppercase tracking-wider transition-colors ${
                activeTab === 'flow'
                  ? 'text-sealGold border-b border-sealGold pb-0.5'
                  : 'text-inkDim hover:text-ink'
              }`}
            >
              EXCHANGE FLOW
            </button>
            <button
              onClick={() => onSelectTab('archive')}
              className={`font-mono text-xs uppercase tracking-wider transition-colors ${
                activeTab === 'archive'
                  ? 'text-sealGold border-b border-sealGold pb-0.5'
                  : 'text-inkDim hover:text-ink'
              }`}
            >
              CASE FILES
            </button>
          </nav>
        </div>
      </header>

      {/* Primary Experience Stage */}
      <main className="w-full relative">{children}</main>
    </div>
  );
};
