import React from 'react';
import { Search, Sun, Moon, RefreshCw, Shield, Menu } from 'lucide-react';
import { useData } from '../../context/DataContext';

interface Props {
  onToggleMobileSidebar: () => void;
  onOpenSettings: () => void;
  onOpenCommandPalette?: () => void;
}

export const Header: React.FC<Props> = ({ onToggleMobileSidebar, onOpenSettings }) => {
  const { theme, toggleTheme, meta, isStale, refreshData, searchQuery, setSearchQuery } = useData();

  const dataAgeHours = meta
    ? Math.max(0, Math.round((Date.now() - new Date(meta.generatedAt).getTime()) / (1000 * 60 * 60)))
    : 0;

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 h-16 px-4 md:px-6 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          aria-label="Toggle navigation drawer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              <span>Cyber Threat Intelligence</span>
              <span className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                v3.0 SOC
              </span>
            </h1>
            <p className="text-[10px] text-slate-400 hidden sm:block">Zayed University · Security and Networks</p>
          </div>
        </div>
      </div>

      {/* Global search */}
      <div className="flex-1 max-w-md mx-2 hidden md:block">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Global search (CVE, actor, organization, sector)..."
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-800 focus:border-cyan-500 text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Freshness Status Pill */}
        <div
          title={`Snapshot generated ${meta ? new Date(meta.generatedAt).toLocaleString() : 'N/A'}`}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium border bg-slate-950 border-slate-800"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isStale ? 'bg-amber-400 animate-pulse' : dataAgeHours > 12 ? 'bg-amber-400' : 'bg-emerald-400'
            }`}
          />
          <span className="text-slate-300 hidden sm:inline">
            {isStale ? 'Stale Data' : dataAgeHours === 0 ? 'Live Feed' : `${dataAgeHours}h ago`}
          </span>
        </div>

        {/* Refresh snapshot button */}
        <button
          onClick={() => refreshData()}
          title="Refresh intelligence snapshot"
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Refresh intelligence snapshot"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-cyan-400" />}
        </button>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
        >
          Weights
        </button>
      </div>
    </header>
  );
};
