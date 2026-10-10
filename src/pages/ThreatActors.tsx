import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { ThreatActor } from '../types/schemas';
import {
  Users,
  Search,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Building2,
  Globe,
  Info,
  ChevronRight,
  X
} from 'lucide-react';

export const ThreatActors: React.FC = () => {
  const { actors, incidents } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('ALL');
  const [selectedActor, setSelectedActor] = useState<ThreatActor | null>(null);

  // Distinct sectors across all actors
  const allSectors = useMemo(() => {
    const set = new Set<string>();
    for (const a of actors) {
      a.targetSectors.forEach((s) => set.add(s));
    }
    return Array.from(set).sort();
  }, [actors]);

  // Enrich actors with dynamic incident links and attribution levels
  const enrichedActors = useMemo(() => {
    return actors.map((actor) => {
      // Find all incidents that mention this actor or aliases
      const matchedIncidents = incidents.filter((inc) => {
        if (!inc.actors || inc.actors.length === 0) return false;
        return inc.actors.some(
          (a) =>
            a.name.toLowerCase() === actor.name.toLowerCase() ||
            actor.aliases.some((alias) => alias.toLowerCase() === a.name.toLowerCase())
        );
      });

      // Collect attribution levels
      const attributionTiers = new Set<string>();
      matchedIncidents.forEach((inc) => {
        const actorMatch = inc.actors.find(
          (a) =>
            a.name.toLowerCase() === actor.name.toLowerCase() ||
            actor.aliases.some((alias) => alias.toLowerCase() === a.name.toLowerCase())
        );
        if (actorMatch) attributionTiers.add(actorMatch.attributionLevel);
      });

      return {
        ...actor,
        resolvedIncidents: matchedIncidents,
        attributionTiers: Array.from(attributionTiers)
      };
    });
  }, [actors, incidents]);

  // Filtered actors
  const filteredActors = useMemo(() => {
    return enrichedActors.filter((actor) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        actor.name.toLowerCase().includes(q) ||
        actor.mitreId?.toLowerCase().includes(q) ||
        actor.aliases.some((a) => a.toLowerCase().includes(q)) ||
        actor.description.toLowerCase().includes(q);

      const matchesSector =
        selectedSector === 'ALL' || actor.targetSectors.includes(selectedSector);

      return matchesSearch && matchesSector;
    });
  }, [enrichedActors, searchTerm, selectedSector]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-cyan-400" />
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
              Threat Actors & ATT&CK Groups
            </h1>
          </div>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            MITRE ATT&CK Enterprise threat groups correlated with live incident feeds and strict attribution criteria.
          </p>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          <span className="text-cyan-400 font-bold">{filteredActors.length}</span> of {actors.length} Groups
        </div>
      </div>

      {/* Attribution Protocol Disclosure */}
      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-start sm:items-center gap-3 text-xs">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5 sm:mt-0" />
        <div className="text-slate-300">
          <strong className="text-white">Strict Attribution Safeguard:</strong> Keyword mentions in news articles are labeled{' '}
          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] border border-slate-700">
            Keyword-mention
          </span>{' '}
          and are <span className="text-rose-400 font-semibold underline">never</span> treated as verified attribution.
          Only official advisories (`Confirmed`) or cited vendor research (`Vendor-assessed`) represent attribution.
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by actor name, alias, or MITRE ID (e.g. G0082, Cozy Bear)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <span className="text-slate-400 shrink-0">Sector:</span>
          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Sectors</option>
            {allSectors.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Actors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredActors.map((actor) => (
          <div
            key={actor.id}
            className="p-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2.5">
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-white text-base leading-tight">{actor.name}</h3>
                  {actor.mitreId && (
                    <a
                      href={actor.mitreUrl || `https://attack.mitre.org/groups/${actor.mitreId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-mono text-cyan-400 hover:underline mt-0.5"
                    >
                      <span>MITRE {actor.mitreId}</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>

                {/* Linked Incident Badge */}
                {actor.resolvedIncidents.length > 0 ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                    {actor.resolvedIncidents.length} Linked
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400">
                    Reference
                  </span>
                )}
              </div>

              {/* Aliases */}
              {actor.aliases.length > 1 && (
                <div className="flex flex-wrap gap-1">
                  {actor.aliases.slice(1, 4).map((alias) => (
                    <span
                      key={alias}
                      className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-950 text-slate-400 border border-slate-800"
                    >
                      {alias}
                    </span>
                  ))}
                  {actor.aliases.length > 4 && (
                    <span className="text-[10px] text-slate-500 font-mono self-center">
                      +{actor.aliases.length - 4}
                    </span>
                  )}
                </div>
              )}

              {/* Description */}
              <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                {actor.description}
              </p>
            </div>

            {/* Target Sectors & Attribution State */}
            <div className="space-y-3 pt-3 border-t border-slate-800/80 text-xs">
              <div className="flex flex-wrap gap-1">
                {actor.targetSectors.slice(0, 3).map((sec) => (
                  <span
                    key={sec}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-300"
                  >
                    {sec}
                  </span>
                ))}
              </div>

              {/* Card Footer action */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  {actor.attributionTiers.includes('Confirmed') ? (
                    <span className="flex items-center gap-1 text-emerald-400 font-medium">
                      <ShieldCheck className="w-3.5 h-3.5" /> Confirmed
                    </span>
                  ) : actor.attributionTiers.includes('Claimed') ? (
                    <span className="flex items-center gap-1 text-amber-400 font-medium">
                      <AlertTriangle className="w-3.5 h-3.5" /> Claimed
                    </span>
                  ) : actor.attributionTiers.includes('Keyword-mention') ? (
                    <span className="flex items-center gap-1 text-slate-400 font-mono text-[10px]">
                      Mentioned in text
                    </span>
                  ) : (
                    <span>0 active claims</span>
                  )}
                </div>

                <button
                  onClick={() => setSelectedActor(actor)}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-xs flex items-center gap-1 border border-slate-700 transition-colors"
                >
                  <span>Profile</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Actor Profile Modal */}
      {selectedActor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">{selectedActor.name}</h2>
                  {selectedActor.mitreId && (
                    <a
                      href={selectedActor.mitreUrl || `https://attack.mitre.org/groups/${selectedActor.mitreId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-0.5 rounded text-[11px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center gap-1 hover:underline"
                    >
                      <span>MITRE {selectedActor.mitreId}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                {selectedActor.aliases.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    <span className="text-[10px] text-slate-500 uppercase font-mono mr-1 self-center">
                      Aliases:
                    </span>
                    {selectedActor.aliases.map((al) => (
                      <span
                        key={al}
                        className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-950 text-slate-300 border border-slate-800"
                      >
                        {al}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => setSelectedActor(null)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
              {/* Description */}
              <div>
                <h4 className="font-semibold text-slate-400 uppercase text-[11px] tracking-wider mb-1">
                  Threat Group Profile
                </h4>
                <p className="text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800">
                  {selectedActor.description}
                </p>
              </div>

              {/* Target Sectors & Countries */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px] uppercase font-semibold">
                    <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Targeted Sectors</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {selectedActor.targetSectors.map((s) => (
                      <span
                        key={s}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px] uppercase font-semibold">
                    <Globe className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Targeted Regions</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {selectedActor.targetCountries.map((c) => (
                      <span
                        key={c}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Linked Ingested Incidents */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-slate-400 uppercase text-[11px] tracking-wider">
                    Linked Ingested Incidents ({selectedActor.linkedIncidentIds.length || 'Direct Matches'})
                  </h4>
                  <span className="text-[10px] text-slate-400">Evaluated with Attribution Engine</span>
                </div>

                {incidents.filter((i) =>
                  i.actors?.some(
                    (a) =>
                      a.name.toLowerCase() === selectedActor.name.toLowerCase() ||
                      selectedActor.aliases.some((al) => al.toLowerCase() === a.name.toLowerCase())
                  )
                ).length === 0 ? (
                  <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-center text-slate-500">
                    No active incident bulletins in the current rolling window match this actor.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {incidents
                      .filter((i) =>
                        i.actors?.some(
                          (a) =>
                            a.name.toLowerCase() === selectedActor.name.toLowerCase() ||
                            selectedActor.aliases.some((al) => al.toLowerCase() === a.name.toLowerCase())
                        )
                      )
                      .map((inc) => {
                        const actorEvidence = inc.actors.find(
                          (a) =>
                            a.name.toLowerCase() === selectedActor.name.toLowerCase() ||
                            selectedActor.aliases.some((al) => al.toLowerCase() === a.name.toLowerCase())
                        );

                        return (
                          <div
                            key={inc.id}
                            className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5"
                          >
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="font-mono text-slate-400">{inc.date.split('T')[0]}</span>
                              {actorEvidence?.attributionLevel === 'Confirmed' ? (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-medium">
                                  Confirmed Attribution
                                </span>
                              ) : actorEvidence?.attributionLevel === 'Claimed' ? (
                                <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 font-medium">
                                  Extortion Claim
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                                  Mentioned in text only
                                </span>
                              )}
                            </div>
                            <div className="font-medium text-white">{inc.title}</div>
                            {actorEvidence?.evidenceSnippet && (
                              <div className="text-[11px] text-slate-400 italic bg-slate-900/80 p-1.5 rounded">
                                Evidence: {actorEvidence.evidenceSnippet}
                              </div>
                            )}
                            <div className="pt-1 flex justify-end">
                              <a
                                href={`#/investigation?id=${inc.id}`}
                                className="text-cyan-400 hover:underline flex items-center gap-1 text-[11px]"
                              >
                                <span>Investigate Incident</span>
                                <ChevronRight className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedActor(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
