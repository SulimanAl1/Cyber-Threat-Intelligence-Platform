import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Indicator } from '../types/schemas';
import { defangIndicator } from '../pipeline/defang';
import {
  Fingerprint,
  Search,
  Copy,
  Check,
  Lock,
  ChevronRight,
  Radio
} from 'lucide-react';

export const IocLookup: React.FC = () => {
  const { indicators, incidents } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'ip' | 'domain' | 'url' | 'hash'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Combine indicators from indicators.json and incidents
  const allIndicators = useMemo(() => {
    const list: Indicator[] = [...indicators];

    // Harvest indicators embedded inside incidents
    for (const inc of incidents) {
      if (inc.indicators && inc.indicators.length > 0) {
        for (const ind of inc.indicators) {
          if (!list.some((existing) => existing.value.toLowerCase() === ind.raw.toLowerCase())) {
            list.push({
              id: ind.id,
              type: ind.type as any,
              value: ind.raw,
              defangedValue: ind.defanged,
              raw: ind.raw,
              defanged: ind.defanged,
              threatType: 'Incident Extracted IOC',
              malware: inc.actors?.[0]?.name || 'Unknown Threat',
              source: inc.sourceName || inc.sourceId,
              firstSeen: inc.date.split('T')[0]
            });
          }
        }
      }
    }

    return list;
  }, [indicators, incidents]);

  // Filter indicators
  const filteredIndicators = useMemo(() => {
    const q = searchTerm.toLowerCase().trim().replace(/\[\.\]/g, '.').replace(/hxxp/g, 'http');

    return allIndicators.filter((ind) => {
      const matchesType = selectedType === 'all' || ind.type === selectedType;
      const matchesSearch =
        !q ||
        ind.value.toLowerCase().includes(q) ||
        ind.defangedValue.toLowerCase().includes(q) ||
        ind.threatType.toLowerCase().includes(q) ||
        ind.malware?.toLowerCase().includes(q) ||
        ind.source.toLowerCase().includes(q);

      return matchesType && matchesSearch;
    });
  }, [allIndicators, searchTerm, selectedType]);

  // Find linked incidents for an indicator
  const getLinkedIncidents = (indValue: string) => {
    const clean = indValue.toLowerCase().trim().replace(/\[\.\]/g, '.');
    return incidents.filter(
      (inc) =>
        inc.title.toLowerCase().includes(clean) ||
        inc.summary.toLowerCase().includes(clean) ||
        inc.indicators?.some((i) => i.raw.toLowerCase() === clean)
    );
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Fingerprint className="w-6 h-6 text-cyan-400" />
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
              Local IOC & Hash Intelligence Lookup
            </h1>
          </div>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Zero-third-party indicator search: query botnet C2 IPs, malicious domains, and payloads strictly within your local dataset.
          </p>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          <span className="text-cyan-400 font-bold">{allIndicators.length}</span> Ingested Indicators
        </div>
      </div>

      {/* OPSEC Guarantee Disclosure */}
      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-start sm:items-center gap-3 text-xs">
        <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5 sm:mt-0" />
        <div className="text-slate-300">
          <strong className="text-white">OPSEC Privacy Guarantee:</strong> Queries executed in this tool{' '}
          <strong className="text-emerald-400 underline">never leave your browser</strong>. No requests are sent to VirusTotal,
          Shodan, or external threat aggregators, preventing leakage of active target investigations.
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full md:w-96">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search IP, domain, URL, or hash (e.g. 192.168, QakBot)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>

        {/* Type Tabs */}
        <div className="flex p-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-medium overflow-x-auto w-full md:w-auto">
          {(['all', 'ip', 'domain', 'url', 'hash'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`px-3 py-1.5 rounded-md uppercase text-[10px] tracking-wider transition-colors ${
                selectedType === t
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t === 'all' ? 'All Types' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Results Table */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>Found {filteredIndicators.length} matching indicators</span>
          <span>Defanged for operational safety</span>
        </div>

        {filteredIndicators.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Radio className="w-8 h-8 mx-auto text-slate-600" />
            <div className="text-sm font-semibold text-white">No Matching Indicators Found</div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              No indicator in the current Feodo Tracker, ThreatFox, or incident feeds matches your search query.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider font-mono border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Defanged Indicator Value</th>
                  <th className="px-4 py-3">Threat Classification</th>
                  <th className="px-4 py-3">Malware / Actor</th>
                  <th className="px-4 py-3">Source Feed</th>
                  <th className="px-4 py-3">First Seen</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filteredIndicators.slice(0, 50).map((ind) => {
                  const linkedIncidents = getLinkedIncidents(ind.value);

                  return (
                    <tr key={ind.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-950 text-cyan-400 border border-slate-800">
                          {ind.type}
                        </span>
                      </td>

                      <td className="px-4 py-3 font-mono text-white font-medium break-all max-w-xs">
                        {ind.defangedValue || defangIndicator(ind.value, ind.type)}
                      </td>

                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          {ind.threatType}
                        </span>
                      </td>

                      <td className="px-4 py-3 font-semibold text-slate-200">
                        {ind.malware || 'Unspecified'}
                      </td>

                      <td className="px-4 py-3 font-mono text-[11px] text-slate-400">
                        {ind.source}
                      </td>

                      <td className="px-4 py-3 font-mono text-[11px] text-slate-400">
                        {ind.firstSeen}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleCopy(ind.id, ind.defangedValue || ind.value)}
                            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                            title="Copy defanged value"
                          >
                            {copiedId === ind.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {linkedIncidents.length > 0 && (
                            <a
                              href={`#/investigation?id=${linkedIncidents[0].id}`}
                              className="px-2 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-medium flex items-center gap-1"
                              title="View linked incident"
                            >
                              <span>Incident</span>
                              <ChevronRight className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {filteredIndicators.length > 50 && (
          <div className="text-center py-2 text-xs text-slate-400 font-mono">
            Showing top 50 indicators of {filteredIndicators.length}. Refine search query to filter further.
          </div>
        )}
      </div>
    </div>
  );
};
