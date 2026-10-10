import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import {
  Search,
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
  Sliders,
  ChevronRight,
  X
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
}

interface CommandItem {
  id: string;
  label: string;
  sublabel?: string;
  category: string;
  icon: any;
  action: () => void;
}

export const CommandPalette: React.FC<Props> = ({ isOpen, onClose, onOpenSettings }) => {
  const navigate = useNavigate();
  const { incidents, vulnerabilities, actors } = useData();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Static navigation commands
  const baseCommands: CommandItem[] = [
    { id: 'nav-overview', label: 'Go to Threat Overview', category: 'Navigation', icon: LayoutDashboard, action: () => navigate('/') },
    { id: 'nav-feed', label: 'Go to Threat Feed & Clusters', category: 'Navigation', icon: Rss, action: () => navigate('/feed') },
    { id: 'nav-vulns', label: 'Go to Vulnerability Center (CISA KEV)', category: 'Navigation', icon: Bug, action: () => navigate('/vulnerabilities') },
    { id: 'nav-investigation', label: 'Go to Incident Investigation', category: 'Navigation', icon: SearchCode, action: () => navigate('/investigation') },
    { id: 'nav-map', label: 'Go to Global Threat & Victim Map', category: 'Navigation', icon: Globe, action: () => navigate('/map') },
    { id: 'nav-analytics', label: 'Go to Threat Analytics & Trends', category: 'Navigation', icon: BarChart3, action: () => navigate('/analytics') },
    { id: 'nav-actors', label: 'Go to Threat Actors & ATT&CK Directory', category: 'Navigation', icon: Users, action: () => navigate('/actors') },
    { id: 'nav-briefing', label: 'Go to Intelligence Briefing Center', category: 'Navigation', icon: FileCheck2, action: () => navigate('/briefing') },
    { id: 'nav-watchlists', label: 'Go to Watchlists & Alerts', category: 'Navigation', icon: Bookmark, action: () => navigate('/watchlists') },
    { id: 'nav-ioc', label: 'Go to Local IOC & Hash Lookup', category: 'Navigation', icon: Fingerprint, action: () => navigate('/ioc-lookup') },
    { id: 'nav-sources', label: 'Go to Source Health Telemetry', category: 'Navigation', icon: Activity, action: () => navigate('/sources') },
    { id: 'nav-methodology', label: 'Go to Methodology & Algorithms', category: 'Navigation', icon: BookOpen, action: () => navigate('/methodology') },
    { id: 'action-settings', label: 'Configure Priority Scoring Weights', category: 'Settings', icon: Sliders, action: onOpenSettings }
  ];

  // Dynamic search results
  const searchResults = React.useMemo(() => {
    if (!query.trim()) return baseCommands;

    const q = query.toLowerCase().trim();
    const results: Array<{ id: string; label: string; sublabel?: string; category: string; icon: any; action: () => void }> = [];

    // Filter base commands
    baseCommands.forEach((cmd) => {
      if (cmd.label.toLowerCase().includes(q) || cmd.category.toLowerCase().includes(q)) {
        results.push(cmd);
      }
    });

    // Match CVEs
    vulnerabilities
      .filter((v) => v.cveId.toLowerCase().includes(q) || v.product.toLowerCase().includes(q))
      .slice(0, 4)
      .forEach((v) => {
        results.push({
          id: `cve-${v.cveId}`,
          label: `${v.cveId} - ${v.vendorProject} ${v.product}`,
          sublabel: `CVSS ${v.cvssScore || 'N/A'} · ${v.inKev ? 'CISA KEV Listed' : 'Vulnerability'}`,
          category: 'Vulnerabilities',
          icon: Bug,
          action: () => navigate(`/vulnerabilities?search=${v.cveId}`)
        });
      });

    // Match Actors
    actors
      .filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.mitreId?.toLowerCase().includes(q) ||
          a.aliases.some((al) => al.toLowerCase().includes(q))
      )
      .slice(0, 4)
      .forEach((a) => {
        results.push({
          id: `actor-${a.id}`,
          label: `${a.name} (${a.mitreId || 'Threat Actor'})`,
          sublabel: a.targetSectors.slice(0, 2).join(', '),
          category: 'Threat Actors',
          icon: Users,
          action: () => navigate(`/actors?search=${a.name}`)
        });
      });

    // Match Incidents
    incidents
      .filter((i) => i.title.toLowerCase().includes(q) || i.summary.toLowerCase().includes(q))
      .slice(0, 4)
      .forEach((i) => {
        results.push({
          id: `inc-${i.id}`,
          label: i.title,
          sublabel: `${i.date.split('T')[0]} · Score: ${i.priorityScore}`,
          category: 'Incidents',
          icon: SearchCode,
          action: () => navigate(`/investigation?id=${i.id}`)
        });
      });

    return results;
  }, [query, baseCommands, vulnerabilities, actors, incidents, navigate]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : searchResults.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (searchResults[selectedIndex]) {
          searchResults[selectedIndex].action();
          onClose();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, searchResults, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-950/70">
          <Search className="w-5 h-5 text-cyan-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command, page name, CVE (e.g. CVE-2024-3400), or threat actor..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="w-full bg-transparent border-none text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto p-2 space-y-1">
          {searchResults.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No matching commands, CVEs, or threat actors found.
            </div>
          ) : (
            searchResults.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = selectedIndex === idx;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-3 rounded-xl text-xs cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-cyan-500/15 border border-cyan-500/30 text-white'
                      : 'hover:bg-slate-800/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-lg ${
                        isSelected ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="font-semibold text-white truncate">{item.label}</div>
                      {item.sublabel && (
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                          {item.sublabel}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                      {item.category}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Hints */}
        <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span>Platform Command Center</span>
        </div>
      </div>
    </div>
  );
};
