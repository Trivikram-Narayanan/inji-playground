import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Beaker, LayoutDashboard } from 'lucide-react';

const Layout: React.FC = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 flex flex-col font-sans relative">
      <header className="px-6 py-4 border-b border-slate-800 bg-slate-950 shadow-md z-10 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Inji Interoperability Playground
          </h1>
          <p className="text-sm text-slate-400 mt-1">Cross-module VC testing sandbox</p>
        </div>
        <nav className="flex items-center gap-2">
          <Link
            to="/"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              location.pathname === '/' 
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Beaker size={18} />
            New Test
          </Link>
          <Link
            to="/dashboard"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              location.pathname === '/dashboard' 
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </Link>
        </nav>
      </header>

      <main className="flex-1 p-6 flex flex-col max-w-7xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
