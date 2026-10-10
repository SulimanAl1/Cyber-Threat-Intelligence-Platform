import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Layers
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { DataStatusBadge } from '../components/common/Badge';
import { PriorityScoreChip } from '../components/common/PriorityScoreChip';
import { EmptyState } from '../components/common/EmptyState';
import { Incident, EventCluster } from '../types/schemas';

export const ThreatFeed: React.FC = () => {
  const { incidents, clusters, isLoading, error } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedSource, setSelectedSource] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'priority' | 'date'>('priority');
  const [groupByClusters, setGroupByClusters] = useState<boolean>(true);
  const [expandedClusters, setExpandedClusters] = useState<Set<string>>(new Set());

  const categories = useMemo<string[]>(() => {
    return Array.from(new Set(incidents.map((i: Incident) => i.category))).sort();
  }, [incidents]);

  const toggleClusterExpand = (clusterId: string) => {
    setExpandedClusters((prev) => {
      const next = new Set(prev);
      if (next.has(clusterId)) next.delete(clusterId);
      else next.add(clusterId);
      return next;
    });
  };

  const filteredIncidents = useMemo<Incident[]>(() => {
    return incidents.filter((inc: Incident) => {
      if (selectedCategory !== 'ALL' && inc.category !== selectedCategory) return false;
      if (selectedStatus !== 'ALL' && inc.dataStatus !== selectedStatus) return false;
      if (selectedSource !== 'ALL' && inc.sourceId !== selectedSource) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchesTitle = inc.title.toLowerCase().includes(q);
        const matchesTarget = inc.targetOrg?.toLowerCase().includes(q);
        const matchesCve = inc.cves.some((c) => c.toLowerCase().includes(q));
        const matchesActor = inc.actors.some((a) => a.name.toLowerCase().includes(q));
        const matchesSector = inc.sector?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesTarget && !matchesCve && !matchesActor && !matchesSector) {
          return false;
        }
      }
      return true;
    }).sort((a: Incident, b: Incident) => {
      if (sortBy === 'priority') {
        const diff = b.priorityScore - a.priorityScore;
        if (diff !== 0) return diff;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [incidents, selectedCategory, selectedStatus, selectedSource, searchTerm, sortBy]);

  const filteredClusters = useMemo<EventCluster[]>(() => {
    if (!groupByClusters) return [];
    const validIncidentIds = new Set(filteredIncidents.map((i: Incident) => i.id));
    return clusters
      .filter((cl: EventCluster) => cl.incidentIds.some((id: string) => validIncidentIds.has(id)))
      .sort((a: EventCluster, b: EventCluster) => {
        if (sortBy === 'priority') return b.maxPriorityScore - a.maxPriorityScore;
        return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
      });
  }, [clusters, filteredIncidents, groupByClusters, sortBy]);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-12 bg-slate-900 rounded-xl" />
        <div className="h-96 bg-slate-900 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return <EmptyState title="Feed Failed to Load" description={error} icon="alert" />;
  }

  return (
    <div className="space-y-6">
      {/* Feed Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Threat Intelligence Feed</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-400">
              {filteredIncidents.length} items
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Correlated vulnerability disclosures, breach reports, and attacker extortion activities.
          </p>
        </div>

        {/* Group by cluster toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setGroupByClusters(!groupByClusters)}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              groupByClusters
                ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Group by Event Cluster ({clusters.length})</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 p-4 rounded-xl bg-slate-900 border border-slate-800">
        {/* Search */}
        <div className="relative lg:col-span-2">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search feed (target, CVE, actor, method)..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-800 focus:border-cyan-500 text-slate-100 placeholder-slate-500 focus:outline-none"
          />
        </div>

        {/* Category filter */}
        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full py-1.5 px-2.5 text-xs rounded-lg bg-slate-950 border border-slate-800 focus:border-cyan-500 text-slate-200 focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Evidence Status filter */}
        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full py-1.5 px-2.5 text-xs rounded-lg bg-slate-950 border border-slate-800 focus:border-cyan-500 text-slate-200 focus:outline-none"
          >
            <option value="ALL">All Data Statuses</option>
            <option value="Confirmed">Confirmed (Official/KEV)</option>
            <option value="Reported">Reported (News)</option>
            <option value="Claimed">Claimed (Leak Site)</option>
          </select>
        </div>

        {/* Sort selector */}
        <div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full py-1.5 px-2.5 text-xs rounded-lg bg-slate-950 border border-slate-800 focus:border-cyan-500 text-slate-200 focus:outline-none"
          >
            <option value="priority">Sort by Priority Score</option>
            <option value="date">Sort by Recent Date</option>
          </select>
        </div>
      </div>

      {/* Main Feed Content */}
      {filteredIncidents.length === 0 ? (
        <EmptyState
          title="No Matching Incidents Found"
          description="Try adjusting your search criteria, category filters, or resetting filter selections."
          actionText="Reset Filters"
          onAction={() => {
            setSearchTerm('');
            setSelectedCategory('ALL');
            setSelectedStatus('ALL');
            setSelectedSource('ALL');
          }}
        />
      ) : groupByClusters ? (
        /* Event Clusters List */
        <div className="space-y-4">
          {filteredClusters.map((cluster: EventCluster) => {
            const isExpanded = expandedClusters.has(cluster.id);
            const clusterMembers = incidents.filter((i: Incident) => cluster.incidentIds.includes(i.id));
            const primaryInc = clusterMembers.find((i: Incident) => i.id === cluster.primaryIncidentId) || clusterMembers[0];

            return (
              <div
                key={cluster.id}
                className="rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors overflow-hidden"
              >
                {/* Cluster Header Bar */}
                <div
                  onClick={() => toggleClusterExpand(cluster.id)}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer bg-slate-900/60"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <PriorityScoreChip
                        score={cluster.maxPriorityScore}
                        factors={primaryInc.priorityFactors}
                      />
                      <span className="text-[11px] font-medium text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
                        {cluster.category}
                      </span>
                      {cluster.sourceCount > 1 && (
                        <span className="text-[11px] font-semibold text-indigo-400 bg-indigo-950/60 border border-indigo-800 px-2 py-0.5 rounded flex items-center gap-1">
                          <Layers className="w-3 h-3" />
                          <span>{cluster.sourceCount} Sources Corroborating</span>
                        </span>
                      )}
                      <DataStatusBadge status={primaryInc.dataStatus} />
                    </div>

                    <h3 className="text-base font-bold text-white hover:text-cyan-400 transition-colors">
                      {cluster.title}
                    </h3>

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed font-sans">
                      {cluster.summary}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-mono pt-1">
                      <span>Timeline: {cluster.firstSeen} to {cluster.lastSeen}</span>
                      {cluster.targetOrg && (
                        <>
                          <span>·</span>
                          <span className="text-cyan-400">Target: {cluster.targetOrg}</span>
                        </>
                      )}
                      {cluster.cves.length > 0 && (
                        <>
                          <span>·</span>
                          <span className="text-amber-400">{cluster.cves.join(', ')}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:self-center shrink-0">
                    <Link
                      to={`/investigation?id=${primaryInc.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="px-3 py-1.5 rounded text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-slate-950 transition-colors"
                    >
                      Investigate
                    </Link>
                    <button
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                      aria-label="Expand cluster details"
                    >
                      {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Supporting Reports Drawer */}
                {isExpanded && (
                  <div className="border-t border-slate-800/80 bg-slate-950/80 p-4 sm:p-5 space-y-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Corroborating Feed Coverage ({clusterMembers.length} Reports)</span>
                    </div>

                    <div className="space-y-2">
                      {clusterMembers.map((m: Incident) => (
                        <div
                          key={m.id}
                          className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-cyan-400 font-mono">{m.sourceName}</span>
                              <span className="text-slate-400">·</span>
                              <span className="text-slate-400 font-mono">{m.date}</span>
                              <DataStatusBadge status={m.dataStatus} className="text-[10px]" />
                            </div>
                            <div className="font-medium text-slate-200">{m.title}</div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Link
                              to={`/investigation?id=${m.id}`}
                              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300"
                            >
                              Details
                            </Link>
                            <a
                              href={m.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded text-slate-400 hover:text-white"
                              title="Open original external article"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Flat Table of Individual Reports */
        <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Title / Incident</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Links</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredIncidents.map((inc: Incident) => (
                  <tr key={inc.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <PriorityScoreChip score={inc.priorityScore} factors={inc.priorityFactors} />
                    </td>
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">{inc.date}</td>
                    <td className="py-3 px-4 font-sans">
                      <Link
                        to={`/investigation?id=${inc.id}`}
                        className="font-semibold text-slate-200 hover:text-cyan-400 line-clamp-1"
                      >
                        {inc.title}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-cyan-400 whitespace-nowrap">{inc.sourceName}</td>
                    <td className="py-3 px-4 whitespace-nowrap font-sans">
                      <DataStatusBadge status={inc.dataStatus} />
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap font-sans">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/investigation?id=${inc.id}`}
                          className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
                        >
                          Analyze
                        </Link>
                        <a
                          href={inc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-slate-400 hover:text-white"
                          title="Open original report"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
