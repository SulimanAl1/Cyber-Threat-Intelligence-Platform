import React, { useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  ExternalLink,
  Copy,
  Check,
  Download,
  FileText,
  Bug,
  Users,
  ShieldCheck,
  ArrowLeft
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { DataStatusBadge, EvidenceLevelBadge } from '../components/common/Badge';
import { PriorityScoreChip } from '../components/common/PriorityScoreChip';
import { EmptyState } from '../components/common/EmptyState';
import { Incident, EventCluster, ExtractedIndicator } from '../types/schemas';

export const IncidentInvestigation: React.FC = () => {
  const [searchParams] = useSearchParams();
  const incidentId = searchParams.get('id');
  const { incidents, clusters, isLoading } = useData();

  const [copiedIoc, setCopiedIoc] = useState<string | null>(null);

  // Active incident selection
  const incident = useMemo<Incident | null>(() => {
    if (!incidentId) return incidents[0] || null;
    return incidents.find((i: Incident) => i.id === incidentId) || incidents[0] || null;
  }, [incidentId, incidents]);

  // Find linked cluster if present
  const cluster = useMemo<EventCluster | null>(() => {
    if (!incident || !incident.clusterId) return null;
    return clusters.find((c: EventCluster) => c.id === incident.clusterId) || null;
  }, [incident, clusters]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIoc(id);
    setTimeout(() => setCopiedIoc(null), 2000);
  };

  const exportAsJson = () => {
    if (!incident) return;
    const blob = new Blob([JSON.stringify(incident, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `incident-${incident.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAsMarkdown = () => {
    if (!incident) return;
    const md = `# Threat Intelligence Report: ${incident.title}

- **Date:** ${incident.date}
- **Source:** ${incident.sourceName} (${incident.url})
- **Category:** ${incident.category}
- **Data Status:** ${incident.dataStatus}
- **Priority Score:** ${incident.priorityScore} / 100
- **Priority Breakdown:** ${incident.priorityFactors.summary}

## 1. Reported Facts (Source Citations)
${incident.contentSnippet || incident.summary}

## 2. Dashboard Analysis & Inferences
- **Target Organization:** ${incident.targetOrg || 'Undisclosed'}
- **Critical Sector:** ${incident.sector || 'Unassigned'}
- **Location:** ${incident.victimLocation ? `${incident.victimLocation.country} (${incident.victimLocation.evidenceText})` : 'Unverified'}
- **Classification Rationale:** ${incident.whyCategory.rule} (Matched: ${incident.whyCategory.matchedKeywords.join(', ')})

## 3. Threat Actor Attribution
${
  incident.actors.length > 0
    ? incident.actors
        .map((a) => `- **${a.name}** [${a.attributionLevel}]: ${a.evidenceSnippet || 'Cited in report'}`)
        .join('\n')
    : 'No threat actor attributed.'
}

## 4. Indicators of Compromise (Defanged)
${
  incident.indicators.length > 0
    ? incident.indicators.map((ind) => `- \`${ind.defanged}\` (${ind.type})`).join('\n')
    : 'No atomic indicators extracted.'
}

## 5. Defensive Guidance
- Implement strict multi-factor authentication (FIDO2).
- Apply vendor security patches for related CVEs immediately.
- Review upstream firewall rules for identified C2 indicators.
`;
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `incident-${incident.id}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return <div className="h-96 rounded-xl bg-slate-900 animate-pulse" />;
  }

  if (!incident) {
    return (
      <EmptyState
        title="Incident Not Found"
        description="The requested incident identifier does not exist in the active snapshot."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/feed"
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Return to feed"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <PriorityScoreChip score={incident.priorityScore} factors={incident.priorityFactors} />
              <DataStatusBadge status={incident.dataStatus} />
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {incident.category}
              </span>
              {cluster && (
                <span className="text-[11px] font-mono text-indigo-400 bg-indigo-950/60 border border-indigo-800 px-2 py-0.5 rounded">
                  Cluster: {cluster.id} ({cluster.sourceCount} sources)
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">{incident.title}</h2>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={exportAsMarkdown}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Markdown</span>
          </button>
          <button
            onClick={exportAsJson}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>JSON</span>
          </button>
          <a
            href={incident.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-slate-950 transition-colors"
          >
            <span>Original Source</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Facts vs Analysis */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section A: Reported Facts (Direct Quotations & Citations) */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span>Reported by Sources (Verifiable Facts & Citations)</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                Source: {incident.sourceName} · {incident.date}
              </span>
            </div>

            <div className="p-4 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-200 leading-relaxed font-sans">
              {incident.summary}
            </div>

            {incident.costs && (
              <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-300">
                <strong>Stated Financial Impact:</strong> {incident.costs.amountText}
                <span className="block text-[11px] text-slate-400 mt-0.5">
                  Extracted Context: {incident.costs.statedContext}
                </span>
              </div>
            )}
          </div>

          {/* Section B: Dashboard Analysis (Inferences & Evidence Rules) */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                <span>Dashboard Analysis (Inferences & Applied Rules)</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-400">Transparent Methodology</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Categorization Rationale
                </span>
                <span className="font-semibold text-slate-200">{incident.whyCategory.rule}</span>
                <div className="text-[11px] text-slate-400 mt-1 font-mono">
                  Triggers: {incident.whyCategory.matchedKeywords.join(', ')}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Sector Classification
                </span>
                <span className="font-semibold text-slate-200">{incident.sector || 'General Commercial'}</span>
                <div className="text-[11px] text-slate-400 mt-1">
                  Inferred from entity naming heuristics
                </div>
              </div>
            </div>

            {/* Geographical Extraction Proof */}
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Victim Location Extraction
              </span>
              {incident.victimLocation ? (
                <div className="space-y-1">
                  <div className="font-semibold text-slate-200">
                    {incident.victimLocation.country} ({incident.victimLocation.countryCode})
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Evidence Citation: {incident.victimLocation.evidenceText}
                  </div>
                </div>
              ) : (
                <div className="text-slate-400 italic">
                  No verified geographical location cited in source narrative. (Unlocated per integrity guidelines).
                </div>
              )}
            </div>
          </div>

          {/* Section C: Threat Actor Attribution */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2 border-b border-slate-800 pb-2.5">
              <Users className="w-4 h-4" />
              <span>Threat Actor Attribution & Mentions</span>
            </h3>

            {incident.actors.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No specific threat actor moniker detected in report.</p>
            ) : (
              <div className="space-y-3">
                {incident.actors.map((actor, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-white">{actor.name}</span>
                        <EvidenceLevelBadge level={actor.attributionLevel} />
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Context Snippet: {actor.evidenceSnippet || 'Named in narrative'}
                      </div>
                    </div>
                    {actor.mitreId && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 shrink-0">
                        MITRE {actor.mitreId}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section D: Indicators of Compromise */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2 border-b border-slate-800 pb-2.5">
              <Bug className="w-4 h-4" />
              <span>Extracted Indicators of Compromise (Defanged)</span>
            </h3>

            {incident.indicators.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No atomic IP/domain/hash indicators extracted from narrative text.</p>
            ) : (
              <div className="space-y-2 font-mono text-xs">
                {incident.indicators.map((ind: ExtractedIndicator) => (
                  <div
                    key={ind.id}
                    className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        {ind.type}
                      </span>
                      <span className="text-slate-200 truncate">{ind.defanged}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => copyToClipboard(ind.defanged, ind.id)}
                        className="p-1 rounded text-slate-400 hover:text-white"
                        title="Copy defanged indicator"
                      >
                        {copiedIoc === ind.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col): Mitigations & Related CVEs */}
        <div className="space-y-6">
          {/* Defensive Mitigations Mapped to CISA Guidance */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2 border-b border-slate-800 pb-2.5">
              <ShieldCheck className="w-4 h-4" />
              <span>Recommended Defensive Measures</span>
            </h3>

            <div className="space-y-3 text-xs leading-relaxed text-slate-300">
              <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/30 space-y-1">
                <strong className="text-emerald-400 block font-semibold">1. Credential & MFA Hardening</strong>
                <p className="text-[11px] text-slate-300">
                  Enforce hardware FIDO2 or phishing-resistant MFA across all administrative and remote-access gateways (CISA Cross-Sector Cybersecurity Performance Goals).
                </p>
              </div>

              <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/30 space-y-1">
                <strong className="text-emerald-400 block font-semibold">2. Rapid Patch Application</strong>
                <p className="text-[11px] text-slate-300">
                  Prioritize remediation of listed KEV CVEs within organizational SLA windows. Isolate non-patchable edge appliances.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/30 space-y-1">
                <strong className="text-emerald-400 block font-semibold">3. Offline Immutable Backups</strong>
                <p className="text-[11px] text-slate-300">
                  Ensure air-gapped immutable backup architecture is tested for ransomware resiliency without reliance on online AD forest.
                </p>
              </div>
            </div>
          </div>

          {/* Related CVEs */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2 border-b border-slate-800 pb-2.5">
              <Bug className="w-4 h-4" />
              <span>Associated CVE Identifiers ({incident.cves.length})</span>
            </h3>

            {incident.cves.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No specific CVE cited in this report.</p>
            ) : (
              <div className="space-y-2">
                {incident.cves.map((cve: string) => (
                  <Link
                    key={cve}
                    to={`/vulnerabilities?search=${cve}`}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-amber-500/40 text-xs font-mono transition-colors"
                  >
                    <span className="text-amber-400 font-bold">{cve}</span>
                    <span className="text-[11px] text-slate-400 font-sans">Inspect KEV &rarr;</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
