import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

export const Layout: React.FC = () => {
  const location = useLocation();

  const isCurrent = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#090a0c] text-[#f0f2f5] selection:bg-[#e5a93c] selection:text-[#090a0c]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-3 focus:py-1 focus:bg-[#e5a93c] focus:text-[#090a0c] font-mono text-xs font-bold"
      >
        Skip to main content
      </a>

      {/* Flat hairline top bar with monospace notation */}
      <header className="px-6 py-3 border-b border-[#ffffff14] bg-[#090a0c]/90 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between">
        <div className="flex items-center gap-3 font-mono">
          <Link to="/" className="text-sm font-bold tracking-tight text-[#f0f2f5] hover:text-[#e5a93c] transition-colors flex items-center gap-2">
            <span className="w-2 h-2 bg-[#e5a93c] inline-block" />
            INJI_INTEROP // CONSOLE
          </Link>
          <span className="text-[#535965] text-xs hidden sm:inline">v2.0-sec_audit</span>
        </div>

        {/* Text-only nav with [ACTIVE] bracket notation */}
        <nav className="flex items-center gap-6 font-mono text-xs tracking-wider" aria-label="Primary">
          <Link
            to="/"
            className={`transition-colors py-1 ${
              isCurrent('/')
                ? 'text-[#e5a93c] font-bold border-b border-[#e5a93c]'
                : 'text-[#8a919e] hover:text-[#f0f2f5]'
            }`}
          >
            {isCurrent('/') ? '[00_OVERVIEW]' : '00_OVERVIEW'}
          </Link>

          <Link
            to="/lab"
            className={`transition-colors py-1 ${
              isCurrent('/lab')
                ? 'text-[#e5a93c] font-bold border-b border-[#e5a93c]'
                : 'text-[#8a919e] hover:text-[#f0f2f5]'
            }`}
          >
            {isCurrent('/lab') ? '[01_LABORATORY]' : '01_LABORATORY'}
          </Link>

          <Link
            to="/dashboard"
            className={`transition-colors py-1 ${
              isCurrent('/dashboard')
                ? 'text-[#e5a93c] font-bold border-b border-[#e5a93c]'
                : 'text-[#8a919e] hover:text-[#f0f2f5]'
            }`}
          >
            {isCurrent('/dashboard') ? '[02_OBSERVATORY]' : '02_OBSERVATORY'}
          </Link>
        </nav>
      </header>

      {/* Main Content Area */}
      <main id="main-content" tabIndex={-1} className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-6">
        <Outlet />
      </main>

      {/* Hairline status footer */}
      <footer className="border-t border-[#ffffff14] bg-[#090a0c] px-6 py-2.5 text-xs font-mono text-[#535965] flex flex-col sm:flex-row items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-[#e5a93c]" />
          STANDARDS: OpenID4VCI (Draft 13) • OpenID4VP (Draft 20) • ISO 18013-5
        </span>
        <span className="text-[#8a919e]/80">ENVIRONMENT: MOSIP COLLAB / LOCAL BFF</span>
      </footer>
    </div>
  );
};

export default Layout;
