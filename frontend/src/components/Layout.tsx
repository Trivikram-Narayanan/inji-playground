import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Beaker, LayoutDashboard } from 'lucide-react';

const Layout: React.FC = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 flex flex-col font-sans relative">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-indigo-500 focus:text-white"
      >
        Skip to main content
      </a>
      <header className="px-6 py-4 border-b border-slate-800 bg-slate-950 shadow-md z-10 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Inji Interoperability Playground
          </h1>
          <p className="text-sm text-slate-400 mt-1">Cross-module VC testing sandbox</p>
        </div>
        <nav className="flex items-center gap-2" aria-label="Primary">
          <Link
            to="/"
            aria-current={location.pathname === '/' ? 'page' : undefined}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 ${
              location.pathname === '/'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Beaker size={18} aria-hidden="true" />
            New Test
          </Link>
          <Link
            to="/dashboard"
            aria-current={location.pathname === '/dashboard' ? 'page' : undefined}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 ${
              location.pathname === '/dashboard'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <LayoutDashboard size={18} aria-hidden="true" />
            Dashboard
          </Link>
        </nav>
      </header>

      <main id="main-content" tabIndex={-1} className="flex-1 p-6 flex flex-col max-w-7xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
