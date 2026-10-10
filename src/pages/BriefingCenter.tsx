import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import {
  FileText,
  Printer,
  Download,
  Copy,
  Check,
  AlertTriangle,
  Lock,
  ExternalLink,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

type TlpLevel = 'TLP:CLEAR' | 'TLP:GREEN' | 'TLP:AMBER' | 'TLP:RED';
type BriefingPeriod = '24h' | '7d' | '30d';

export const BriefingCenter: React.FC = () => {
  const { incidents, vulnerabilities, sourceStatuses } = useData();
  const [tlp, setTlp] = useState<TlpLevel>('TLP:CLEAR');
  const [period, setPeriod] = useState<BriefingPeriod>('7d');
  const [copied, setCopied] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  // Filter incidents for briefing period
  const briefingIncidents = useMemo(() => {
    const now = Date.now();
    const days = period === '24h' ? 1 : period === '7d' ? 7 : 30;
    const cutoff = now - days * 24 * 60 * 60 * 1000;

    return incidents
      .filter((i) => {
        const d = new Date(i.date).getTime();
        return !isNaN(d) && d >= cutoff;
      })
      .sort((a, b) => b.priorityScore - a.priorityScore);
  }, [incidents, period]);

  // Top critical incidents (top 5 by priority score)
  const topPriorityIncidents = useMemo(() => {
    return briefingIncidents.slice(0, 5);
  }, [briefingIncidents]);

  // Top critical vulnerabilities in period
  const relevantVulnerabilities = useMemo(() => {
    return vulnerabilities
      .filter((v) => v.inKev || (v.epssScore && v.epssScore > 0.5))
      .sort((a, b) => (b.epssScore || 0) - (a.epssScore || 0))
      .slice(0, 5);
  }, [vulnerabilities]);

  // Active extortion claims in period
  const extortionClaims = useMemo(() => {
    return briefingIncidents.filter(
      (i) => i.dataStatus === 'Claimed' || i.sourceId === 'ransomware-live'
    );
  }, [briefingIncidents]);

  // TLP Styling & Guidelines
  const tlpConfig: Record<TlpLevel, { color: string; bg: string; border: string; desc: string }> = {
    'TLP:CLEAR': {
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      desc: 'Recipients may share this briefing with the public without restriction.'
    },
    'TLP:GREEN': {
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/30',
      desc: 'Recipients may share within their community or industry peer group.'
    },
    'TLP:AMBER': {
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      desc: 'Recipients may only share with members of their own organization on need-to-know.'
    },
    'TLP:RED': {
      color: 'text-rose-400',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/30',
      desc: 'Strictly restricted to designated individual participants only.'
    }
  };

  // Generate Markdown Briefing Text
  const generateMarkdownBriefing = () => {
    const dateStr = new Date().toISOString().split('T')[0];
    return `# CYBER THREAT INTELLIGENCE EXECUTIVE BRIEFING
**Classification:** ${tlp}
**Date Generated:** ${dateStr}
**Monitoring Window:** Past ${period.toUpperCase()}
**Platform:** Zayed University Threat Intelligence Platform

---

## 1. EXECUTIVE SUMMARY
Over the monitored ${period} period, the platform ingested and analyzed **${briefingIncidents.length} threat incidents** across ${sourceStatuses.length} verified threat intelligence feeds.
- **Top Threat Vector:** ${briefingIncidents[0]?.category || 'Ransomware / Vulnerability Exploitation'}
- **Extortion Syndicates:** ${extortionClaims.length} attacker leak-site claims recorded.
- **Actively Exploited CVEs:** ${relevantVulnerabilities.length} vulnerabilities prioritized under CISA KEV and EPSS thresholds.

---

## 2. KEY THREAT INCIDENTS
${topPriorityIncidents
  .map(
    (inc, idx) => `### ${idx + 1}. ${inc.title}
- **Priority Score:** ${inc.priorityScore}/100
- **Category:** ${inc.category}
- **Data Status:** ${inc.dataStatus}
- **Date:** ${inc.date.split('T')[0]}
- **Summary:** ${inc.summary}
- **Source Citation:** [${inc.sourceId}](${inc.url})
`
  )
  .join('\n')}

---

## 3. CRITICAL VULNERABILITY WATCHLIST
${relevantVulnerabilities
  .map(
    (v) => `- **${v.cveId}** (${v.vendorProject} ${v.product}): CVSS ${v.cvssScore || 'N/A'}, EPSS ${((v.epssScore || 0) * 100).toFixed(1)}%. CISA KEV Action: ${v.requiredAction || 'Apply vendor patches'}. Due: ${v.kevDueDate || 'Immediate'}.`
  )
  .join('\n')}

---

## 4. STRATEGIC DEFENSIVE RECOMMENDATIONS
1. **Mandatory Perimeter Patching:** Audit external-facing appliances for CISA KEV entries identified in Section 3.
2. **Credential & Session Token Revocation:** Enforce FIDO2 MFA across all identity providers (IdPs) and validate administrative session limits.
3. **Offline Backup Verification:** Test restore processes from immutable, air-gapped backups against active ransomware playbooks.

*Notice: This briefing was synthesized by automated intelligence pipelines adhering to the Data Integrity Charter.*
`;
  };

  // Handle Copy
  const handleCopy = () => {
    navigator.clipboard.writeText(generateMarkdownBriefing());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Handle Markdown Download
  const handleDownload = () => {
    const md = generateMarkdownBriefing();
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `threat-briefing-${tlp.replace(':', '_')}-${period}-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);

    setDownloadSuccess('Briefing downloaded as Markdown');
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  // Handle Print (Browser PDF)
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls (Hidden during print) */}
      <div className="print:hidden flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-cyan-400" />
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
              Intelligence Briefing Center
            </h1>
          </div>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Automated executive intelligence dossier generator with TLP markings and citation traceability.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied Markdown' : 'Copy Text'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .MD</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-lg shadow-cyan-600/20 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {downloadSuccess && (
        <div className="print:hidden p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{downloadSuccess}</span>
        </div>
      )}

      {/* Briefing Generator Configuration Controls (Hidden during print) */}
      <div className="print:hidden p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
        {/* TLP Selector */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">TLP Marking:</span>
          <div className="flex p-0.5 bg-slate-950 border border-slate-800 rounded-lg">
            {(['TLP:CLEAR', 'TLP:GREEN', 'TLP:AMBER', 'TLP:RED'] as TlpLevel[]).map((level) => (
              <button
                key={level}
                onClick={() => setTlp(level)}
                className={`px-2.5 py-1 rounded-md font-mono text-[11px] font-bold transition-colors ${
                  tlp === level
                    ? `${tlpConfig[level].bg} ${tlpConfig[level].color} border ${tlpConfig[level].border}`
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Time Window Selector */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Monitoring Window:</span>
          <div className="flex p-0.5 bg-slate-950 border border-slate-800 rounded-lg font-medium">
            <button
              onClick={() => setPeriod('24h')}
              className={`px-3 py-1 rounded-md transition-colors ${
                period === '24h'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              24 Hours
            </button>
            <button
              onClick={() => setPeriod('7d')}
              className={`px-3 py-1 rounded-md transition-colors ${
                period === '7d'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setPeriod('30d')}
              className={`px-3 py-1 rounded-md transition-colors ${
                period === '30d'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              30 Days
            </button>
          </div>
        </div>
      </div>

      {/* Rendered Intelligence Briefing Document */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 lg:p-10 space-y-8 shadow-2xl print:bg-white print:text-black print:border-none print:p-0 print:shadow-none">
        {/* TLP Header Banner */}
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 ${tlpConfig[tlp].bg} ${tlpConfig[tlp].border} print:border-black print:bg-slate-100`}
        >
          <div className="flex items-center gap-2.5">
            <Lock className={`w-4 h-4 ${tlpConfig[tlp].color} print:text-black`} />
            <span className={`font-mono font-bold tracking-wider ${tlpConfig[tlp].color} print:text-black`}>
              {tlp}
            </span>
          </div>
          <div className="text-[11px] text-slate-300 print:text-slate-800 text-right">
            {tlpConfig[tlp].desc}
          </div>
        </div>

        {/* Document Header */}
        <div className="space-y-2 border-b border-slate-800 pb-6 print:border-slate-300">
          <div className="text-[10px] uppercase font-mono tracking-widest text-cyan-400 print:text-slate-600">
            Zayed University Threat Operations Center
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white print:text-black tracking-tight">
            Executive Cyber Threat Intelligence Dossier
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 print:text-slate-600 font-mono pt-1">
            <span>Date: {new Date().toISOString().split('T')[0]}</span>
            <span>•</span>
            <span>Period: Past {period.toUpperCase()}</span>
            <span>•</span>
            <span>Sampled: {briefingIncidents.length} Events</span>
          </div>
        </div>

        {/* Section 1: Executive Summary */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-400 print:text-slate-900 flex items-center gap-2">
            <span>1.0 Executive Summary</span>
          </h2>
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 print:bg-slate-50 print:border-slate-200 text-xs text-slate-300 print:text-slate-800 leading-relaxed space-y-2">
            <p>
              During the analyzed {period} window, the platform registered <strong>{briefingIncidents.length} threat incidents</strong> across connected government CERT feeds, commercial intelligence outlets, and extortion leak-sites.
            </p>
            <p>
              The primary observed attack vector remains <strong>{briefingIncidents[0]?.category || 'Exploited Vulnerability / Zero-Day'}</strong>, followed by persistent ransomware extortion syndicates. There were <strong>{extortionClaims.length} extortion claims</strong> documented across attacker leak sites. Security operations teams are advised to focus patch prioritization on CISA KEV entries with high EPSS scores.
            </p>
          </div>
        </div>

        {/* Section 2: Priority Threat Incidents */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-400 print:text-slate-900 flex items-center gap-2">
            <span>2.0 Key Threat Incidents (Top Priority)</span>
          </h2>

          <div className="space-y-3">
            {topPriorityIncidents.map((inc, idx) => (
              <div
                key={inc.id}
                className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 print:bg-slate-50 print:border-slate-200 space-y-2 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white print:text-black">
                      #{idx + 1}
                    </span>
                    <span className="font-bold text-white print:text-black text-sm">
                      {inc.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 print:border-slate-300 print:text-slate-800">
                      Score: {inc.priorityScore}/100
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 print:bg-slate-200 print:text-slate-800">
                      {inc.dataStatus}
                    </span>
                  </div>
                </div>

                <p className="text-slate-300 print:text-slate-700 leading-relaxed">
                  {inc.summary}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 print:border-slate-200 text-[11px] text-slate-400 print:text-slate-600">
                  <div className="flex items-center gap-3">
                    <span>Source: <strong className="text-slate-300 print:text-black">{inc.sourceId}</strong></span>
                    <span>Date: {inc.date.split('T')[0]}</span>
                    {inc.cves.length > 0 && (
                      <span className="font-mono text-cyan-400 print:text-black">
                        CVE: {inc.cves.join(', ')}
                      </span>
                    )}
                  </div>
                  <a
                    href={inc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:underline flex items-center gap-1 print:hidden"
                  >
                    <span>View Citation</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Critical Vulnerability Watchlist */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-400 print:text-slate-900 flex items-center gap-2">
            <span>3.0 Active Exploitation Watchlist (CISA KEV & EPSS)</span>
          </h2>

          <div className="overflow-x-auto rounded-xl border border-slate-800 print:border-slate-300">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider font-mono print:bg-slate-100 print:text-black border-b border-slate-800 print:border-slate-300">
                <tr>
                  <th className="px-4 py-2.5">CVE Identifier</th>
                  <th className="px-4 py-2.5">Vendor / Product</th>
                  <th className="px-4 py-2.5">Exploit Status</th>
                  <th className="px-4 py-2.5">EPSS Prob.</th>
                  <th className="px-4 py-2.5">Remediation Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 print:divide-slate-200 text-slate-300 print:text-slate-800">
                {relevantVulnerabilities.map((v) => (
                  <tr key={v.cveId} className="hover:bg-slate-800/40 print:hover:bg-transparent">
                    <td className="px-4 py-2.5 font-mono font-bold text-white print:text-black">
                      {v.cveId}
                    </td>
                    <td className="px-4 py-2.5">
                      {v.vendorProject} {v.product}
                    </td>
                    <td className="px-4 py-2.5">
                      {v.inKev ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-rose-500/15 text-rose-400 border border-rose-500/30 print:text-black">
                          CISA KEV Listed
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">High EPSS</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-cyan-400 print:text-black">
                      {((v.epssScore || 0) * 100).toFixed(1)}%
                    </td>
                    <td className="px-4 py-2.5 text-slate-400 print:text-slate-700 truncate max-w-xs">
                      {v.requiredAction || 'Apply vendor security bulletin updates.'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 4: Strategic Recommendations */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-400 print:text-slate-900 flex items-center gap-2">
            <span>4.0 Strategic Defensive Recommendations</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 print:bg-slate-50 print:border-slate-200 space-y-1.5">
              <div className="font-bold text-white print:text-black flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 print:text-black" />
                <span>1. Patch Known Exploits</span>
              </div>
              <p className="text-slate-400 print:text-slate-700 leading-relaxed text-[11px]">
                Immediately identify and patch all network edge assets exposing vulnerabilities listed in Section 3. Prioritize CISA KEV over raw CVSS score.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 print:bg-slate-50 print:border-slate-200 space-y-1.5">
              <div className="font-bold text-white print:text-black flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-cyan-400 print:text-black" />
                <span>2. Hardened Access & MFA</span>
              </div>
              <p className="text-slate-400 print:text-slate-700 leading-relaxed text-[11px]">
                Mandate phishing-resistant FIDO2 MFA across all VPN, SSO, and privileged administrative consoles. Review session lifetimes and token anomalies.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 print:bg-slate-50 print:border-slate-200 space-y-1.5">
              <div className="font-bold text-white print:text-black flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 print:text-black" />
                <span>3. Immutable Backups</span>
              </div>
              <p className="text-slate-400 print:text-slate-700 leading-relaxed text-[11px]">
                Verify air-gapped, immutable backup integrity to defend against extortion syndicates. Conduct tabletop exercises for rapid data restoration.
              </p>
            </div>
          </div>
        </div>

        {/* Academic / Audit Stamp Footer */}
        <div className="pt-6 border-t border-slate-800 print:border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-400 print:text-slate-600 font-mono">
          <div>Zayed University · Security and Networks Specialization</div>
          <div>Synthesized autonomously by Antigravity Pipeline Engine</div>
        </div>
      </div>
    </div>
  );
};
