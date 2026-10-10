import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Incident } from '../types/schemas';
import {
  FolderKanban,
  Plus,
  Download,
  ArrowRightLeft,
  CheckCircle2,
  X,
  ExternalLink
} from 'lucide-react';

interface CaseInvestigation {
  id: string;
  title: string;
  notes: string;
  incidentIds: string[];
  createdAt: string;
}

const STORAGE_KEY_CASES = 'cs_dashboard_cases_v1';

export const CaseBoard: React.FC = () => {
  const { incidents } = useData();
  const [cases, setCases] = useState<CaseInvestigation[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CASES);
      if (saved) return JSON.parse(saved);
      // Seed default case
      return [
        {
          id: 'case-demo-1',
          title: 'Critical Infrastructure & Extortion Correlation',
          notes: 'Analyzing correlation between active zero-day edge exploits and ransomware extortion campaigns.',
          incidentIds: incidents.slice(0, 2).map((i) => i.id),
          createdAt: new Date().toISOString().split('T')[0]
        }
      ];
    } catch {
      return [];
    }
  });

  const [activeCaseId, setActiveCaseId] = useState<string>(cases[0]?.id || '');
  const [feedback, setFeedback] = useState<string | null>(null);

  // Active case
  const activeCase = useMemo(() => {
    return cases.find((c) => c.id === activeCaseId) || cases[0];
  }, [cases, activeCaseId]);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CASES, JSON.stringify(cases));
    } catch (e) {
      console.error('Failed to save cases', e);
    }
  }, [cases]);

  // Incidents in active case
  const comparedIncidents = useMemo(() => {
    if (!activeCase) return [];
    return activeCase.incidentIds
      .map((id) => incidents.find((i) => i.id === id))
      .filter(Boolean) as Incident[];
  }, [activeCase, incidents]);

  // Add incident to case
  const handleAddIncidentToCase = (incId: string) => {
    if (!activeCase || activeCase.incidentIds.includes(incId)) return;
    setCases(
      cases.map((c) =>
        c.id === activeCase.id ? { ...c, incidentIds: [...c.incidentIds, incId] } : c
      )
    );
  };

  // Remove incident from case
  const handleRemoveIncidentFromCase = (incId: string) => {
    if (!activeCase) return;
    setCases(
      cases.map((c) =>
        c.id === activeCase.id
          ? { ...c, incidentIds: c.incidentIds.filter((id) => id !== incId) }
          : c
      )
    );
  };

  // Update notes
  const handleUpdateNotes = (notes: string) => {
    if (!activeCase) return;
    setCases(
      cases.map((c) => (c.id === activeCase.id ? { ...c, notes } : c))
    );
  };

  // Create new case
  const handleCreateCase = () => {
    const newCase: CaseInvestigation = {
      id: `case-${Date.now()}`,
      title: `Case #${cases.length + 1} - ${new Date().toISOString().split('T')[0]}`,
      notes: '',
      incidentIds: [],
      createdAt: new Date().toISOString().split('T')[0]
    };
    setCases([newCase, ...cases]);
    setActiveCaseId(newCase.id);
  };

  // Delete case
  const handleDeleteCase = (caseId: string) => {
    const updated = cases.filter((c) => c.id !== caseId);
    setCases(updated);
    if (activeCaseId === caseId) {
      setActiveCaseId(updated[0]?.id || '');
    }
  };

  // Export Case JSON
  const handleExportCase = () => {
    if (!activeCase) return;
    const exportData = {
      case: activeCase,
      incidents: comparedIncidents
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `incident-case-${activeCase.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setFeedback('Case exported to JSON');
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <FolderKanban className="w-6 h-6 text-cyan-400" />
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
              Incident Case Board & Comparison
            </h1>
          </div>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Side-by-side incident correlation, factor decomposition, and triage notes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCase}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Case</span>
          </button>
          <button
            onClick={handleCreateCase}
            className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-lg shadow-cyan-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>New Case</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Case Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800">
        {cases.map((c) => (
          <div
            key={c.id}
            onClick={() => setActiveCaseId(c.id)}
            className={`px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors flex items-center gap-2 shrink-0 ${
              activeCase?.id === c.id
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <span>{c.title}</span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-950">
              {c.incidentIds.length}
            </span>
            {cases.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteCase(c.id);
                }}
                className="hover:text-rose-400 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Case Details and Notes */}
      {activeCase && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Notes & Add Incident Panel */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Case Title
              </label>
              <input
                type="text"
                value={activeCase.title}
                onChange={(e) => {
                  const val = e.target.value;
                  setCases(
                    cases.map((c) => (c.id === activeCase.id ? { ...c, title: val } : c))
                  );
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Analyst Triage Notes
              </label>
              <textarea
                rows={5}
                value={activeCase.notes}
                onChange={(e) => handleUpdateNotes(e.target.value)}
                placeholder="Document technical hypothesis, attribution notes, and IOC overlaps..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Add Incident to Case
              </label>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddIncidentToCase(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="">Select an incident to add...</option>
                {incidents
                  .filter((i) => !activeCase.incidentIds.includes(i.id))
                  .slice(0, 30)
                  .map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.title.slice(0, 50)}... ({i.date.split('T')[0]})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Side-by-Side Comparison Matrix */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-cyan-400" />
                <span>Side-by-Side Comparison Matrix</span>
              </div>
              <span className="font-mono text-cyan-400">{comparedIncidents.length} Linked</span>
            </div>

            {comparedIncidents.length === 0 ? (
              <div className="p-12 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-3">
                <ArrowRightLeft className="w-8 h-8 mx-auto text-slate-600" />
                <div className="text-sm font-semibold text-white">No Incidents in this Case</div>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Add incidents using the dropdown on the left to inspect multi-factor scoring,
                  attribution confidence, and indicators side-by-side.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {comparedIncidents.map((inc) => (
                  <div
                    key={inc.id}
                    className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 text-xs flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                          {inc.category}
                        </span>
                        <button
                          onClick={() => handleRemoveIncidentFromCase(inc.id)}
                          className="text-slate-500 hover:text-rose-400 p-0.5"
                          title="Remove from case"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <h3 className="font-bold text-white text-sm leading-snug">{inc.title}</h3>
                      <p className="text-slate-300 leading-relaxed line-clamp-3">{inc.summary}</p>
                    </div>

                    {/* Comparison metrics */}
                    <div className="space-y-2 pt-2 border-t border-slate-800/80 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Priority Score:</span>
                        <span className="font-mono font-bold text-cyan-400">
                          {inc.priorityScore}/100
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-slate-400">Evidence Status:</span>
                        <span className="font-mono text-slate-200">{inc.dataStatus}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-slate-400">Target Sector:</span>
                        <span className="text-slate-200">{inc.sector}</span>
                      </div>

                      {inc.cves.length > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">CVEs:</span>
                          <span className="font-mono text-rose-400">{inc.cves.join(', ')}</span>
                        </div>
                      )}

                      {inc.actors.length > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Attribution:</span>
                          <span className="font-mono text-amber-400">
                            {inc.actors[0].name} ({inc.actors[0].attributionLevel})
                          </span>
                        </div>
                      )}

                      <div className="pt-2 flex justify-end">
                        <a
                          href={`#/investigation?id=${inc.id}`}
                          className="text-cyan-400 hover:underline flex items-center gap-1 font-medium"
                        >
                          <span>Full Dossier</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
