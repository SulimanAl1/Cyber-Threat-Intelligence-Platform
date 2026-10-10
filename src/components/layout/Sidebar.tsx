import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Rss,
  Bug,
  SearchCode,
  Activity,
  BookOpen,
  Globe,
  BarChart3,
  Users,
  FileCheck2,
  Bookmark,
  Fingerprint,
  FolderKanban,
  X
} from 'lucide-react';
import { useData } from '../../context/DataContext';

interface Props {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<Props> = ({ mobileOpen, onCloseMobile }) => {
  const { meta, sourceStatuses } = useData();

  const healthyCount = sourceStatuses.filter((s) => s.status === 'healthy').length;

  const navSection1 = [
    { to: '/', label: 'Overview', icon: LayoutDashboard, badge: null },
    { to: '/feed', label: 'Threat Feed', icon: Rss, badge: meta?.incidentCount },
    { to: '/vulnerabilities', label: 'Vulnerability Center', icon: Bug, badge: meta?.vulnerabilityCount },
    { to: '/investigation', label: 'Investigation', icon: SearchCode, badge: null },
    { to: '/sources', label: 'Source Health', icon: Activity, badge: `${healthyCount}/${sourceStatuses.length}` },
    { to: '/methodology', label: 'Methodology', icon: BookOpen, badge: null }
  ];

  const navSection2 = [
    { to: '/map', label: 'Global Threat Map', icon: Globe, badge: 'Offline' },
    { to: '/analytics', label: 'Analytics', icon: BarChart3, badge: null },
    { to: '/actors', label: 'Threat Actors', icon: Users, badge: meta?.actorCount },
    { to: '/briefing', label: 'Briefing Center', icon: FileCheck2, badge: 'TLP' }
  ];

  const navSection3 = [
    { to: '/watchlists', label: 'Watchlists & Alerts', icon: Bookmark, badge: null },
    { to: '/ioc-lookup', label: 'Local IOC Lookup', icon: Fingerprint, badge: null },
    { to: '/cases', label: 'Case Comparison', icon: FolderKanban, badge: null }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-200 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800 md:hidden">
          <span className="text-sm font-bold text-white tracking-wider">NAVIGATION</span>
          <button onClick={onCloseMobile} className="p-1 rounded text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {/* Phase 1 Section */}
          <div>
            <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Phase 1 · Core SOC
            </div>
            <nav className="space-y-1">
              {navSection1.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onCloseMobile}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-cyan-500/15 text-cyan-400 font-semibold border border-cyan-500/30'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`
                    }
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== null && item.badge !== undefined && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Phase 2 Section */}
          <div>
            <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Phase 2 · Intelligence
            </div>
            <nav className="space-y-1">
              {navSection2.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onCloseMobile}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-cyan-500/15 text-cyan-400 font-semibold border border-cyan-500/30'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`
                    }
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Phase 3 Section */}
          <div>
            <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Phase 3 · Analyst Tools
            </div>
            <nav className="space-y-1">
              {navSection3.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onCloseMobile}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-cyan-500/15 text-cyan-400 font-semibold border border-cyan-500/30'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`
                    }
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </div>
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Academic / Author footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 text-[11px] text-slate-400 space-y-1">
          <div className="font-semibold text-slate-300">Zayed University</div>
          <div>Security and Networks Project</div>
          <div className="text-[10px] text-slate-400">Author: Sulaiman Alhabsi</div>
        </div>
      </aside>
    </>
  );
};
