import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  Flame,
  Bug,
  Activity,
  Layers,
  ArrowUpRight,
  Clock,
  Info,
  ChevronRight
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { SeverityBadge, DataStatusBadge } from '../components/common/Badge';
import { PriorityScoreChip } from '../components/common/PriorityScoreChip';
import { EmptyState } from '../components/common/EmptyState';

export const Overview: React.FC = () => {
  const { incidents, clusters, vulnerabilities, sourceStatuses, meta, isLoading, error } = useData();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-slate-900 border border-slate-800" />
          ))}
        </div>
        <div className="h-96 rounded-xl bg-slate-900 border border-slate-800" />
      </div>
    );
  }

  if (error || incidents.length === 0) {
    return (
      <EmptyState
        title="No Intelligence Snapshots Loaded"
        description={error || "The platform has not yet ingested feed data. Run 'npm run pipeline' to populate snapshots."}
        icon="alert"
      />
    );
  }

  // Real KPIs with transparent calculations
  const totalIncidents = incidents.length;
  const activeClustersCount = clusters.length;
  const kevCount = vulnerabilities.filter((v) => v.inKev).length;
  const ransomwareClaimsCount = incidents.filter((i) => i.category === 'Ransomware' || i.dataStatus === 'Claimed').length;
  const healthySourcesCount = sourceStatuses.filter((s) => s.status === 'healthy').length;

  // Top 10 priority incidents
  const topPriority = [...incidents]
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, 10);

  // Critical alerts (Score >= 80)
  const criticalAlerts = incidents.filter((i) => i.priorityScore >= 80).slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Page Title & Scope Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Threat Intelligence Overview</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Aggregated situational awareness from connected authoritative feeds and incident disclosures.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>Scope: {meta?.dateRangeStart} to {meta?.dateRangeEnd}</span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1: Ingested Incidents */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 relative group hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Logged Reports</span>
            <Flame className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-black font-mono text-white tracking-tight">{totalIncidents}</div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1" title="Count of individual reports parsed across all active sources">
            <Info className="w-3 h-3 text-slate-400" />
            <span>Across {sourceStatuses.length} feeds</span>
          </div>
        </div>

        {/* KPI 2: Active Event Clusters */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 relative group hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Event Clusters</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-black font-mono text-white tracking-tight">{activeClustersCount}</div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1" title="Deduplicated incident clusters grouped by CVE, victim, and token similarity">
            <Info className="w-3 h-3 text-slate-400" />
            <span>Deduplicated events</span>
          </div>
        </div>

        {/* KPI 3: CISA KEV Exploited CVEs */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 relative group hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>CISA KEV Catalog</span>
            <Bug className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black font-mono text-amber-400 tracking-tight">{kevCount}</div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1" title="Total active CVEs in the CISA Known Exploited Vulnerabilities catalog">
            <Info className="w-3 h-3 text-slate-400" />
            <span>Mandatory federal action</span>
          </div>
        </div>

        {/* KPI 4: Ransomware Extortion Claims */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 relative group hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Ransomware / Claims</span>
            <ShieldAlert className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-black font-mono text-purple-400 tracking-tight">{ransomwareClaimsCount}</div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1" title="Incidents categorized as Ransomware or sourced from leak-site tracking">
            <Info className="w-3 h-3 text-slate-400" />
            <span>Includes leak-site claims</span>
          </div>
        </div>

        {/* KPI 5: Healthy Source Connectors */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 relative group hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Healthy Feeds</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black font-mono text-emerald-400 tracking-tight">
            {healthySourcesCount}<span className="text-slate-400 text-lg font-normal">/{sourceStatuses.length}</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1" title="Number of feed connectors reporting HTTP 200 without parse errors">
            <Info className="w-3 h-3 text-slate-400" />
            <span>Live telemetry</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Top Priority Queue & Critical Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: High Priority Incident Stream */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>Prioritized Incident Stream</span>
            </h3>
            <Link
              to="/feed"
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition-colors"
            >
              <span>Explore all feed</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Score</th>
                    <th className="py-3 px-4">Incident / Target</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Evidence</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {topPriority.map((inc) => (
                    <tr key={inc.id} className="hover:bg-slate-800/40 transition-colors group">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <PriorityScoreChip score={inc.priorityScore} factors={inc.priorityFactors} />
                      </td>
                      <td className="py-3.5 px-4 font-sans">
                        <Link
                          to={`/investigation?id=${inc.id}`}
                          className="font-semibold text-slate-200 group-hover:text-cyan-400 transition-colors line-clamp-1"
                        >
                          {inc.title}
                        </Link>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                          <span>{inc.date}</span>
                          <span>·</span>
                          <span className="text-slate-400">{inc.sourceName}</span>
                          {inc.targetOrg && (
                            <>
                              <span>·</span>
                              <span className="text-cyan-400">{inc.targetOrg}</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap font-sans">
                        <span className="text-[11px] font-medium text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
                          {inc.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap font-sans">
                        <DataStatusBadge status={inc.dataStatus} />
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <Link
                          to={`/investigation?id=${inc.id}`}
                          className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold"
                        >
                          <span>Analyze</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Critical Radar & Intelligence Disclaimers */}
        <div className="space-y-6">
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span>Critical Alerts (Score &ge; 80)</span>
            </h3>

            {criticalAlerts.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No incidents currently exceed the 80-point priority threshold.</p>
            ) : (
              <div className="space-y-3">
                {criticalAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-3 rounded-lg bg-red-950/20 border border-red-900/30 hover:border-red-800/50 transition-colors"
                  >
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <SeverityBadge severity="Critical" />
                      <span className="font-mono text-slate-400">{alert.date}</span>
                    </div>
                    <Link
                      to={`/investigation?id=${alert.id}`}
                      className="text-xs font-semibold text-slate-200 hover:text-red-400 line-clamp-2 block mb-1.5"
                    >
                      {alert.title}
                    </Link>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Category: <span className="text-slate-300">{alert.category}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Academic & Scope Transparency Box */}
          <div className="rounded-xl bg-slate-950 border border-slate-800/80 p-5 space-y-3 text-xs text-slate-400 leading-relaxed">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-2">
              <Info className="w-4 h-4 text-cyan-400" />
              <span>Scope & Academic Context</span>
            </h4>
            <p>
              This platform aggregates cyber threat reports from connected public sources. It does not monitor all cyberattacks worldwide.
            </p>
            <p className="text-[11px] text-slate-400">
              Developed for the <strong>Security and Networks</strong> course at <strong>Zayed University</strong> by <strong>Sulaiman Alhabsi</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
