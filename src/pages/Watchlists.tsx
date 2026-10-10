import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Incident } from '../types/schemas';
import {
  Bookmark,
  Bell,
  Plus,
  Trash2,
  CheckCircle2,
  Download,
  Upload,
  ChevronRight,
  X
} from 'lucide-react';

export interface WatchRule {
  id: string;
  name: string;
  type: 'cve' | 'actor' | 'vendor' | 'keyword' | 'sector';
  value: string;
  createdAt: string;
  enabled: boolean;
}

const STORAGE_KEY_WATCHLIST = 'cs_dashboard_watchrules_v1';

const DEFAULT_WATCH_RULES: WatchRule[] = [
  {
    id: 'rule-cve-pant',
    name: 'Palo Alto Edge Devices',
    type: 'cve',
    value: 'CVE-2024-3400',
    createdAt: '2026-10-01',
    enabled: true
  },
  {
    id: 'rule-actor-typhoon',
    name: 'Volt Typhoon Critical Infrastructure',
    type: 'actor',
    value: 'Volt Typhoon',
    createdAt: '2026-10-01',
    enabled: true
  },
  {
    id: 'rule-sector-health',
    name: 'Healthcare Sector Watch',
    type: 'sector',
    value: 'Healthcare',
    createdAt: '2026-10-01',
    enabled: true
  }
];

export const Watchlists: React.FC = () => {
  const { incidents } = useData();
  const [rules, setRules] = useState<WatchRule[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_WATCH_RULES;
    try {
      const saved = localStorage.getItem(STORAGE_KEY_WATCHLIST);
      return saved ? JSON.parse(saved) : DEFAULT_WATCH_RULES;
    } catch {
      return DEFAULT_WATCH_RULES;
    }
  });

  const [activeRuleId, setActiveRuleId] = useState<string | null>(null);
  const [newRuleModalOpen, setNewRuleModalOpen] = useState(false);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleType, setNewRuleType] = useState<WatchRule['type']>('keyword');
  const [newRuleValue, setNewRuleValue] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  // Save rules to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_WATCHLIST, JSON.stringify(rules));
    } catch (e) {
      console.error('Failed to save watch rules', e);
    }
  }, [rules]);

  // Evaluate matches per rule
  const ruleMatches = useMemo(() => {
    const map = new Map<string, Incident[]>();

    for (const rule of rules) {
      if (!rule.enabled) {
        map.set(rule.id, []);
        continue;
      }

      const q = rule.value.toLowerCase().trim();
      const matches = incidents.filter((inc) => {
        if (rule.type === 'cve') {
          return inc.cves.some((c) => c.toLowerCase().includes(q));
        }
        if (rule.type === 'actor') {
          return inc.actors.some((a) => a.name.toLowerCase().includes(q));
        }
        if (rule.type === 'sector') {
          return !!inc.sector && inc.sector.toLowerCase().includes(q);
        }
        if (rule.type === 'vendor') {
          return inc.targetOrg?.toLowerCase().includes(q);
        }
        // keyword matches title, summary, or targetOrg
        return (
          inc.title.toLowerCase().includes(q) ||
          inc.summary.toLowerCase().includes(q) ||
          (inc.targetOrg && inc.targetOrg.toLowerCase().includes(q))
        );
      });

      map.set(rule.id, matches);
    }

    return map;
  }, [rules, incidents]);

  // Total unmuted alert matches
  const totalMatchesCount = useMemo(() => {
    const uniqueIds = new Set<string>();
    ruleMatches.forEach((incList) => {
      incList.forEach((inc) => uniqueIds.add(inc.id));
    });
    return uniqueIds.size;
  }, [ruleMatches]);

  // Active selected rule matching incidents
  const displayedIncidents = useMemo(() => {
    if (activeRuleId) {
      return ruleMatches.get(activeRuleId) || [];
    }
    // All matching incidents across all enabled rules
    const unique = new Map<string, Incident>();
    ruleMatches.forEach((incList) => {
      incList.forEach((inc) => unique.set(inc.id, inc));
    });
    return Array.from(unique.values()).sort((a, b) => b.priorityScore - a.priorityScore);
  }, [activeRuleId, ruleMatches]);

  // Create new rule
  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName.trim() || !newRuleValue.trim()) return;

    const newRule: WatchRule = {
      id: `rule-${Date.now()}`,
      name: newRuleName.trim(),
      type: newRuleType,
      value: newRuleValue.trim(),
      createdAt: new Date().toISOString().split('T')[0],
      enabled: true
    };

    setRules([newRule, ...rules]);
    setNewRuleName('');
    setNewRuleValue('');
    setNewRuleModalOpen(false);
    setFeedback(`Watch rule "${newRule.name}" activated.`);
    setTimeout(() => setFeedback(null), 3000);
  };

  // Toggle rule
  const handleToggleRule = (id: string) => {
    setRules(
      rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  };

  // Delete rule
  const handleDeleteRule = (id: string) => {
    setRules(rules.filter((r) => r.id !== id));
    if (activeRuleId === id) setActiveRuleId(null);
  };

  // Export Rules JSON
  const handleExportRules = () => {
    const blob = new Blob([JSON.stringify(rules, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `threat-watchlists-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setFeedback('Watchlist rules exported to JSON.');
    setTimeout(() => setFeedback(null), 3000);
  };

  // Import Rules JSON
  const handleImportRules = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          setRules(imported);
          setFeedback(`Successfully imported ${imported.length} watch rules.`);
          setTimeout(() => setFeedback(null), 3000);
        }
      } catch {
        alert('Invalid JSON file format for watch rules.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Bookmark className="w-6 h-6 text-cyan-400" />
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
              Watchlists & Threat Alerts
            </h1>
          </div>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Persistent client-side monitors for high-priority CVEs, critical threat actors, and key industry sectors.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5" />
            <span>Import JSON</span>
            <input type="file" accept=".json" onChange={handleImportRules} className="hidden" />
          </label>

          <button
            onClick={handleExportRules}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={() => setNewRuleModalOpen(true)}
            className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-lg shadow-cyan-600/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Alert Rule</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Stats KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
            Active Watch Rules
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            {rules.filter((r) => r.enabled).length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">{rules.length} configured rules</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
            Total Incident Matches
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">
            {totalMatchesCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Across all enabled rules</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
            Storage Target
          </div>
          <div className="text-sm font-semibold text-white mt-1.5">
            Browser localStorage
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Private to your device</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
            Real-time Evaluation
          </div>
          <div className="text-sm font-semibold text-emerald-400 mt-1.5 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Continuous</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Re-evaluated on every ingest</div>
        </div>
      </div>

      {/* Main Rules and Matched Incidents Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Rules Management List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
            <span>Watch Rules</span>
            <button
              onClick={() => setActiveRuleId(null)}
              className={`text-[11px] ${
                activeRuleId === null ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Show All ({totalMatchesCount})
            </button>
          </div>

          <div className="space-y-2">
            {rules.map((rule) => {
              const matches = ruleMatches.get(rule.id) || [];
              const isActive = activeRuleId === rule.id;

              return (
                <div
                  key={rule.id}
                  onClick={() => setActiveRuleId(rule.id)}
                  className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-colors space-y-2.5 ${
                    isActive
                      ? 'bg-cyan-500/10 border-cyan-500/40'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span>{rule.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                        <span className="uppercase px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800">
                          {rule.type}
                        </span>
                        <span className="text-cyan-400 font-semibold truncate max-w-[150px]">
                          "{rule.value}"
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          matches.length > 0
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {matches.length} matches
                      </span>
                    </div>
                  </div>

                  {/* Rule actions */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px]">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleRule(rule.id);
                      }}
                      className={`text-[10px] font-medium px-2 py-0.5 rounded border ${
                        rule.enabled
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      {rule.enabled ? 'Active' : 'Muted'}
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRule(rule.id);
                      }}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                      title="Delete rule"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Matched Incidents Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-cyan-400" />
              <span>
                {activeRuleId
                  ? `Matches for "${rules.find((r) => r.id === activeRuleId)?.name}"`
                  : 'All Watchlist Matches'}
              </span>
            </div>
            <span className="font-mono text-cyan-400">{displayedIncidents.length} Incidents</span>
          </div>

          {displayedIncidents.length === 0 ? (
            <div className="p-8 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-3">
              <CheckCircle2 className="w-8 h-8 mx-auto text-slate-600" />
              <div className="text-sm font-semibold text-white">No Matching Incidents</div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                No incidents in the current ingested snapshot matched your active watchlist rules.
                Try adjusting keywords or adding additional target sectors.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayedIncidents.map((inc) => (
                <div
                  key={inc.id}
                  className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors space-y-2.5 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        {inc.category}
                      </span>
                      <span className="font-mono text-slate-400 text-[11px]">
                        {inc.date.split('T')[0]}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <span className="font-bold text-cyan-400">Score: {inc.priorityScore}/100</span>
                      <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                        {inc.dataStatus}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-bold text-white text-sm leading-snug">{inc.title}</h3>

                  <p className="text-slate-300 leading-relaxed line-clamp-2">{inc.summary}</p>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                    <div className="flex items-center gap-3">
                      <span>Source: <strong className="text-slate-300">{inc.sourceId}</strong></span>
                      {inc.cves.length > 0 && (
                        <span className="font-mono text-rose-400 font-semibold">
                          CVE: {inc.cves.join(', ')}
                        </span>
                      )}
                    </div>

                    <a
                      href={`#/investigation?id=${inc.id}`}
                      className="text-cyan-400 hover:underline flex items-center gap-1 font-medium"
                    >
                      <span>Investigate Incident</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* New Rule Modal */}
      {newRuleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <form
            onSubmit={handleAddRule}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">Create Threat Watch Rule</h3>
              <button
                type="button"
                onClick={() => setNewRuleModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Rule Name</label>
                <input
                  type="text"
                  placeholder="e.g. Critical Fortinet Vulnerabilities"
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Rule Type</label>
                <select
                  value={newRuleType}
                  onChange={(e) => setNewRuleType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="keyword">General Keyword (Title & Summary)</option>
                  <option value="cve">CVE Identifier</option>
                  <option value="actor">Threat Actor / Group</option>
                  <option value="sector">Industry Sector</option>
                  <option value="vendor">Target Organization / Vendor</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Target Value / Term</label>
                <input
                  type="text"
                  placeholder="e.g. CVE-2024-3400, LockBit, Healthcare"
                  value={newRuleValue}
                  onChange={(e) => setNewRuleValue(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                  required
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setNewRuleModalOpen(false)}
                className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium shadow-md shadow-cyan-600/20"
              >
                Save Rule
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
