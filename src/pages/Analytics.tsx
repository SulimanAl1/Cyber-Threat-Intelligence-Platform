import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import {
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  Download,
  Building2,
  Bug,
  CheckCircle2
} from 'lucide-react';

type TimeRange = '7d' | '30d' | '90d' | 'all';

export const Analytics: React.FC = () => {
  const { incidents, vulnerabilities } = useData();
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  // Filter incidents based on time range
  const filteredIncidents = useMemo(() => {
    if (timeRange === 'all') return incidents;
    const now = new Date().getTime();
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const cutoff = now - days * 24 * 60 * 60 * 1000;

    return incidents.filter((i) => {
      const d = new Date(i.date).getTime();
      return !isNaN(d) && d >= cutoff;
    });
  }, [incidents, timeRange]);

  // 1. Incidents Timeline (Daily / Weekly histogram)
  const timelineData = useMemo(() => {
    const buckets: Record<string, { date: string; total: number; confirmed: number; claims: number }> = {};

    for (const inc of filteredIncidents) {
      const day = inc.date.split('T')[0];
      if (!buckets[day]) {
        buckets[day] = { date: day, total: 0, confirmed: 0, claims: 0 };
      }
      buckets[day].total += 1;
      if (inc.dataStatus === 'Claimed' || inc.sourceId === 'ransomware-live') {
        buckets[day].claims += 1;
      } else {
        buckets[day].confirmed += 1;
      }
    }

    return Object.values(buckets).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredIncidents]);

  // 2. Threat Vector / Category Breakdown
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const inc of filteredIncidents) {
      const cat = inc.category || 'Other / General';
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percent: Math.round((count / (filteredIncidents.length || 1)) * 100)
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredIncidents]);

  // 3. Affected Sectors Distribution
  const sectorData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const inc of filteredIncidents) {
      const s = inc.sector || 'Unknown';
      counts[s] = (counts[s] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percent: Math.round((count / (filteredIncidents.length || 1)) * 100)
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredIncidents]);

  // 4. Verified Victim Countries Distribution
  const countryData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const inc of filteredIncidents) {
      if (inc.victimLocation && inc.victimLocation.countryCode !== 'UNKNOWN') {
        const c = inc.victimLocation.country;
        counts[c] = (counts[c] || 0) + 1;
      }
    }
    const locatedTotal = Object.values(counts).reduce((a, b) => a + b, 0);
    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percent: Math.round((count / (locatedTotal || 1)) * 100)
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredIncidents]);

  // 5. Top Exploited CVEs
  const topCves = useMemo(() => {
    const cveMap: Record<string, { cveId: string; count: number; inKev: boolean; epss: number; title: string }> = {};

    for (const inc of filteredIncidents) {
      for (const cve of inc.cves) {
        if (!cveMap[cve]) {
          const kevMatch = vulnerabilities.find((v) => v.cveId === cve);
          cveMap[cve] = {
            cveId: cve,
            count: 0,
            inKev: !!kevMatch?.inKev,
            epss: kevMatch?.epssScore || 0,
            title: kevMatch ? `${kevMatch.vendorProject} ${kevMatch.product}` : 'Exploited Vulnerability'
          };
        }
        cveMap[cve].count += 1;
      }
    }

    return Object.values(cveMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [filteredIncidents, vulnerabilities]);

  // Export CSV
  const handleExportCsv = () => {
    const rows = [
      ['Date', 'Total Incidents', 'Confirmed / Reported', 'Extortion Claims'].join(','),
      ...timelineData.map((d) => [d.date, d.total, d.confirmed, d.claims].join(','))
    ];

    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `threat-analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    setDownloadSuccess('Exported CSV dataset successfully');
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  // Export JSON
  const handleExportJson = () => {
    const exportPayload = {
      generatedAt: new Date().toISOString(),
      timeRange,
      totalIncidentsSampled: filteredIncidents.length,
      timeline: timelineData,
      threatCategories: categoryData,
      sectors: sectorData,
      countries: countryData,
      topExploitedCves: topCves
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `threat-analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);

    setDownloadSuccess('Exported JSON analytics successfully');
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  const maxTimelineTotal = Math.max(...timelineData.map((d) => d.total), 1);

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-cyan-400" />
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
              Threat Analytics & Trends
            </h1>
          </div>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Empirical telemetry on incident volumes, threat vector distributions, and exploitation rates.
          </p>
        </div>

        {/* Global Controls Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Time Filter */}
          <div className="flex p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-medium">
            {(['7d', '30d', '90d', 'all'] as TimeRange[]).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  timeRange === r
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {r === 'all' ? 'All Time' : `Past ${r}`}
              </button>
            ))}
          </div>

          {/* Export Dropdown / Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleExportCsv}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
            <button
              onClick={handleExportJson}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>JSON</span>
            </button>
          </div>
        </div>
      </div>

      {downloadSuccess && (
        <div className="p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{downloadSuccess}</span>
        </div>
      )}

      {/* KPI Overview Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
            Total Incidents Sampled
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            {filteredIncidents.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Within selected {timeRange} window</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
            Peak Daily Activity
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">
            {maxTimelineTotal}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Incidents in 24 hours</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
            Leading Vector
          </div>
          <div className="text-lg font-bold text-amber-400 mt-1 truncate">
            {categoryData[0]?.name || 'N/A'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {categoryData[0]?.percent || 0}% of total volume
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
            Active CVEs Tracked
          </div>
          <div className="text-2xl font-bold font-mono text-rose-400 mt-1">
            {topCves.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Correlated with active exploits
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Incident Volume Timeline */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Incident Volume Timeline
              </h2>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-cyan-400"></span>
                <span>Confirmed/Reported</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-amber-400"></span>
                <span>Extortion Claims</span>
              </div>
            </div>
          </div>

          {/* Timeline SVG Chart */}
          <div className="h-56 flex items-end gap-1.5 pt-4 pb-2 border-b border-slate-800">
            {timelineData.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
                No incident records within this period
              </div>
            ) : (
              timelineData.slice(-24).map((d) => {
                const totalH = (d.total / maxTimelineTotal) * 100;
                const claimH = (d.claims / maxTimelineTotal) * 100;
                const confH = totalH - claimH;

                return (
                  <div
                    key={d.date}
                    className="flex-1 flex flex-col justify-end items-center h-full group relative cursor-pointer"
                  >
                    {/* Tooltip */}
                    <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950 border border-slate-700 text-white text-[10px] p-1.5 rounded shadow-xl whitespace-nowrap z-20 pointer-events-none">
                      <div className="font-bold">{d.date}</div>
                      <div>Total: {d.total} (Confirmed: {d.confirmed}, Claims: {d.claims})</div>
                    </div>

                    {/* Stacked bar */}
                    <div className="w-full rounded-t overflow-hidden flex flex-col-reverse justify-start">
                      <div
                        style={{ height: `${Math.max(confH * 1.8, 2)}px` }}
                        className="w-full bg-cyan-500/80 group-hover:bg-cyan-400 transition-colors"
                      />
                      {d.claims > 0 && (
                        <div
                          style={{ height: `${claimH * 1.8}px` }}
                          className="w-full bg-amber-500/80 group-hover:bg-amber-400 transition-colors"
                        />
                      )}
                    </div>

                    <span className="text-[8px] text-slate-400 font-mono mt-1 rotate-45 origin-left truncate w-6">
                      {d.date.slice(5)}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Bias / Limit disclosure */}
          <p className="text-[11px] text-slate-400 leading-relaxed">
            <strong className="text-slate-300">Data Limitations & Bias:</strong> Incident volume is
            skewed by public disclosure cycles, victim reporting delays (often 30–90 days post-breach),
            and ransomware extortion auction deadlines.
          </p>
        </div>

        {/* Chart 2: Threat Vector & Category Breakdown */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Threat Vector Distribution
              </h2>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              {categoryData.length} Categories
            </span>
          </div>

          {/* Category Bar Breakdown */}
          <div className="space-y-3 pt-2">
            {categoryData.slice(0, 6).map((cat) => (
              <div key={cat.name} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium truncate max-w-[240px]">
                    {cat.name}
                  </span>
                  <span className="font-mono text-slate-400">
                    <strong className="text-white">{cat.count}</strong> ({cat.percent}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                  <div
                    style={{ width: `${cat.percent}%` }}
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed pt-2 border-t border-slate-800">
            <strong className="text-slate-300">Classification Integrity:</strong> Categories are
            derived from deterministic keyword and rule matches. Incidents are classified based on
            explicit evidence in the source text.
          </p>
        </div>

        {/* Chart 3: Affected Sectors Breakdown */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Impacted Industry Sectors
              </h2>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              {sectorData.length} Sectors
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {sectorData.slice(0, 6).map((sec) => (
              <div key={sec.name} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium truncate max-w-[240px]">
                    {sec.name}
                  </span>
                  <span className="font-mono text-slate-400">
                    <strong className="text-white">{sec.count}</strong> ({sec.percent}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                  <div
                    style={{ width: `${sec.percent}%` }}
                    className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed pt-2 border-t border-slate-800">
            <strong className="text-slate-300">Sector Bias:</strong> Critical Infrastructure and
            Healthcare appear more frequently due to statutory mandatory reporting laws in the US and
            EU. Private sector incidents are underreported.
          </p>
        </div>

        {/* Chart 4: Top Exploited CVEs */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bug className="w-4 h-4 text-rose-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Actively Exploited CVEs
              </h2>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">Ranked by Ingestion Mentions</span>
          </div>

          <div className="space-y-2 pt-2">
            {topCves.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                No active CVE correlations detected in the selected time range.
              </div>
            ) : (
              topCves.map((c) => (
                <div
                  key={c.cveId}
                  className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white">{c.cveId}</span>
                      {c.inKev && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-rose-500/15 text-rose-400 border border-rose-500/30">
                          CISA KEV
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate max-w-[260px]">
                      {c.title}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono font-bold text-cyan-400">{c.count} Incidents</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      EPSS: {(c.epss * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed pt-2 border-t border-slate-800">
            <strong className="text-slate-300">EPSS Probability:</strong> FIRST EPSS predicts the
            probability of exploitation in the next 30 days. It is an algorithmic probability, not a
            confirmed exploitation status.
          </p>
        </div>
      </div>
    </div>
  );
};
