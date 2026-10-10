import {
  Layers,
  Cpu,
  Calculator,
  Scale,
  GraduationCap
} from 'lucide-react';
import { DEFAULT_SCORING_WEIGHTS } from '../config/scoring-weights';

export const Methodology: React.FC = () => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Title */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono mb-1">
          <GraduationCap className="w-4 h-4" />
          <span>Zayed University · Security and Networks Specialization</span>
        </div>
        <h2 className="text-2xl font-black text-white tracking-tight">
          Platform Architecture & Threat Intelligence Methodology
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Technical design specification, algorithmic deduplication, transparent scoring models, and attribution integrity standards.
        </p>
      </div>

      {/* Section 1: Ingestion Pipeline Topology */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-6 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
          <Cpu className="w-4 h-4" />
          <span>1. Ingestion Pipeline & Zero-Proxy Architecture</span>
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed font-sans">
          Unlike legacy web dashboards that rely on public third-party proxies (e.g. <code>corsproxy.io</code>), this platform runs an automated, isolated server-side ingestion pipeline executed in GitHub Actions. Feeds are polled every two hours, normalized into canonical Zod schemas, enriched, deduplicated into event clusters, and emitted as static JSON snapshots stored on GitHub Pages.
        </p>

        <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono space-y-2 text-slate-300">
          <div className="text-cyan-400 font-bold">/// Pipeline Processing Sequence:</div>
          <div>1. Concurrent Feed Fetch with exponential backoff and 10s per-feed timeout.</div>
          <div>2. XML/RSS/JSON Parsing & Input Sanitization (HTML stripped, script tags removed).</div>
          <div>3. Explainable Rule Classification (Ransomware, Zero-Day, Supply Chain, APT, DDoS, etc.).</div>
          <div>4. Noise Filtering: Automatically suppresses webinars, podcasts, hiring, and generic market opinions.</div>
          <div>5. Entity Extraction: CVE IDs, critical sectors, financial loss quotes, and gazetteer-backed locations.</div>
          <div>6. Event Clustering: Token Jaccard similarity and CVE matching across a 7-day rolling window.</div>
          <div>7. Priority Score Engine: Computes a multi-factor 0-100 score with mathematical factor breakdown.</div>
          <div>8. Zod Schema Gate: Validates all generated datasets before snapshot deployment.</div>
        </div>
      </div>

      {/* Section 2: Deduplication and Clustering Algorithm */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-6 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
          <Layers className="w-4 h-4" />
          <span>2. Multi-Source Event Clustering Algorithm</span>
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed font-sans">
          When a high-impact cybersecurity incident occurs, multiple news and intelligence outlets report on it simultaneously. To prevent duplicate inflation in SOC metrics, the clustering engine groups related stories into a single <code>EventCluster</code>:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
            <strong className="text-white block font-semibold">Rule A: Exact CVE Overlap</strong>
            <p className="text-slate-400 leading-relaxed">
              If two reports cite the identical CVE identifier within a 7-day rolling window, they are merged into the same cluster.
            </p>
          </div>
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
            <strong className="text-white block font-semibold">Rule B: Target Organization Match</strong>
            <p className="text-slate-400 leading-relaxed">
              If reports name the same normalized victim entity within 7 days, they are grouped under the primary incident.
            </p>
          </div>
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
            <strong className="text-white block font-semibold">Rule C: Token Jaccard &gt; 0.55</strong>
            <p className="text-slate-400 leading-relaxed">
              For general breach reports without CVEs, token Jaccard similarity of non-stop-words exceeding 0.55 triggers correlation.
            </p>
          </div>
        </div>
      </div>

      {/* Section 3: Priority Scoring Mathematical Model */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-6 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
          <Calculator className="w-4 h-4" />
          <span>3. Transparent Priority Score Formula</span>
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed font-sans">
          The Priority Score is a transparent 0–100 calculated index designed to guide analyst triaging. It is clearly labeled as a calculated dashboard score, distinct from official NIST CVSS ratings.
        </p>

        <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono space-y-2">
          <div className="text-amber-400 font-bold">Score = Min(100, BasePoints - RecencyDecay)</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-slate-300">
            <div>• CISA KEV Listed: +{DEFAULT_SCORING_WEIGHTS.cisaKev} pts</div>
            <div>• Ransomware Campaign Use: +{DEFAULT_SCORING_WEIGHTS.knownRansomware} pts</div>
            <div>• FIRST EPSS Probability: up to +{DEFAULT_SCORING_WEIGHTS.epssFactor} pts</div>
            <div>• CVSS Base Severity: up to +{DEFAULT_SCORING_WEIGHTS.cvssFactor} pts</div>
            <div>• Evidence Level (Confirmed): +{DEFAULT_SCORING_WEIGHTS.evidenceTier} pts</div>
            <div>• Corroboration (&gt;1 source): up to +{DEFAULT_SCORING_WEIGHTS.corroboration} pts</div>
          </div>
        </div>
      </div>

      {/* Section 4: Attribution Integrity & Evidence Levels */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-6 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2">
          <Scale className="w-4 h-4" />
          <span>4. Threat Actor Attribution Standards</span>
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed font-sans">
          In professional threat intelligence, mentioning a threat actor's name in an article is NOT evidence of attribution. The dashboard enforces four strict confidence tiers:
        </p>

        <div className="space-y-2.5 text-xs">
          <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/30 flex items-start gap-3">
            <span className="font-bold text-emerald-400 shrink-0 font-mono">CONFIRMED:</span>
            <span className="text-slate-300">
              Formally attributed in an official government CERT advisory (CISA, NCSC, ANSSI) or direct statement from the affected organization.
            </span>
          </div>
          <div className="p-3 rounded-lg bg-blue-950/20 border border-blue-900/30 flex items-start gap-3">
            <span className="font-bold text-blue-400 shrink-0 font-mono">VENDOR-ASSESSED:</span>
            <span className="text-slate-300">
              Attributed by a named cybersecurity research team (e.g. Mandiant, CrowdStrike, SentinelOne) with cited technical evidence.
            </span>
          </div>
          <div className="p-3 rounded-lg bg-purple-950/20 border border-purple-900/30 flex items-start gap-3">
            <span className="font-bold text-purple-400 shrink-0 font-mono">CLAIMED:</span>
            <span className="text-slate-300">
              Self-claimed by an extortion threat group on a dark-web leak site (e.g. Ransomware.live). Unverified until confirmed by defenders.
            </span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-3">
            <span className="font-bold text-slate-400 shrink-0 font-mono">KEYWORD MENTION:</span>
            <span className="text-slate-300">
              Moniker appears as historical or educational background in news copy. <strong>NEVER attributed to the incident.</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Section 5: Academic Context & Limitations */}
      <div className="rounded-xl bg-slate-950 border border-slate-800 p-6 space-y-3 text-xs text-slate-400 leading-relaxed">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white">
          5. Dataset Limitations & Academic Notice
        </h3>
        <p>
          This dashboard monitors incidents reported by its connected public intelligence feeds. It does not possess omniscient visibility into all global cyber operations. Coverage exhibits reporting bias towards English-language technology publications, publicly disclosed enterprise incidents, and Western government advisories.
        </p>
        <p>
          Prepared for academic review at <strong>Zayed University</strong>, College of Technological Innovation, <strong>Security and Networks</strong> course.
        </p>
      </div>
    </div>
  );
};
