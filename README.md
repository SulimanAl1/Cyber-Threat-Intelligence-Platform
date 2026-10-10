# 🛡️ Global Cyber Threat Intelligence Operations Center (CTI-SOC)

[![Static Quality Gate](https://img.shields.io/badge/Quality%20Gate-100%25%20Passing-emerald?style=flat-square&logo=githubactions)](https://github.com/SulimanAl1/Cyber-Threat-Intelligence-Platform/actions)
[![Test Suite](https://img.shields.io/badge/Vitest-31%2F31%20Passing-cyan?style=flat-square&logo=vitest)](tests/)
[![Architecture](https://img.shields.io/badge/Architecture-Static%20Ingestion%20Pipeline-blue?style=flat-square)](#-architecture--data-pipeline)
[![Hosting](https://img.shields.io/badge/Hosting-GitHub%20Pages%20Static-purple?style=flat-square&logo=githubpages)](https://sulimanal1.github.io/Cyber-Threat-Intelligence-Platform/)
[![Author](https://img.shields.io/badge/Author-Sulaiman%20Alhabsi-amber?style=flat-square)](#-author--methodology)

An enterprise-grade, serverless Global Cyber Threat Intelligence Platform built for automated ingestion, multi-source event clustering, transparent priority scoring, offline vector cartography, and rigorous MITRE ATT&CK attribution.

**Live Platform:** [https://sulimanal1.github.io/Cyber-Threat-Intelligence-Platform/](https://sulimanal1.github.io/Cyber-Threat-Intelligence-Platform/)  
**Base Path:** `/Cyber-Threat-Intelligence-Platform/`  
**Author:** Sulaiman Alhabsi

---

## 🏛️ Architectural Highlights & Key Differentiators

Unlike naive prototypes that rely on insecure public CORS proxies (`corsproxy.io`), unvalidated feed parsing, and keyword-based misattribution, this platform enforces strict enterprise and academic integrity standards:

1. **Zero Public CORS Proxies:** Eliminates all third-party proxy dependencies. All feed fetching, XML parsing, entity extraction, and deduplication run server-side in automated GitHub Actions workflows.
2. **Scheduled Dual GitHub Actions Topology:**
   - **`A - Ingestion Data Refresh Pipeline` (`.github/workflows/data-refresh.yml`):** Runs every 2 hours (and via dispatch), fetches 15 live feeds, validates schemas against Zod, and pushes updated static snapshots to a dedicated `data` branch with last-good fallback.
   - **`B - Build and Deploy to GitHub Pages` (`.github/workflows/build-deploy.yml`):** Runs on code pushes and successful data refreshes, executing full unit/flow test suites, strict TypeScript checks, and deploying static bundles to GitHub Pages.
3. **100% Offline Vector Cartography:** Bundles Natural Earth 110m vector GeoJSON (`public/data/world-110m.json`) rendered via `d3-geo` projection. Zero tile requests, zero external map API keys, 100% offline-ready.
4. **Data Integrity Charter & 4-Tier Attribution:**
   - **Confirmed:** Official government CERT advisory (CISA, CERT-FR, UK NCSC) or official statement by the affected organization.
   - **Vendor-assessed:** Named cybersecurity vendor research report.
   - **Claimed:** Attacker extortion leak-site claim (e.g., Ransomware.live listings).
   - **Keyword-mention:** Entity named in text without attribution evidence; displayed strictly as *"Mentioned in text only"*, NEVER as verified attribution.
5. **Transparent 0–100 Priority Scoring:** Mathematical formulation with dynamic factor chips detailing CISA KEV listing (+25), confirmed ransomware (+20), FIRST EPSS probability (up to +15), CVSS severity (up to +20), multi-source corroboration (+4 per source), and recency decay.

---

## 🧭 Platform Capabilities & Modules

### Phase 1 · Core Operations Center
- **Overview Dashboard:** Live KPI metrics (30-day incidents, active multi-source clusters, KEV additions, ransomware claims, feed uptime), chronological sparkline trends, and prioritized incident streams.
- **Threat Feed & Event Clusters:** Fuzzy search, multi-faceted filtering (Severity, Category, Feed, Evidence Tier), and multi-source event clusters revealing corroborating reports and timestamps.
- **Vulnerability Center:** High-density catalog of 1,739 CISA KEV entries, FIRST EPSS probabilities, remediation deadlines, overdue flags, and ransomware utilization indicators.
- **Incident Investigation Dossier:** Deep-dive view cleanly separating verified source citations from dashboard inferences; one-click defanged IOC copying; explainable scoring factor modal; Markdown and JSON export.
- **Source Health & Telemetry:** Ingestion status monitor tracking HTTP latency (ms), success rates, item yields, failure counts, and data licensing terms.
- **Methodology & Documentation:** Comprehensive academic defense outlining pipeline topology, Jaccard clustering, scoring weights, and operational scope boundaries.

### Phase 2 · Intelligence Views
- **Global Threat & Victim Map:** Offline vector cartography plotting verified victim organizations and claimed extortion targets. Includes timeline playback scrubber, cluster markers, and an accessible WCAG AA country incident table.
  > *Integrity Notice:* Map pins display victim locations only. Attacker geographic origin is never inferred or plotted.
- **Threat Analytics & Trends:** Interactive charts detailing incident volume velocity, threat vector distributions, impacted industry sectors, and active CVE exploitation rates with multi-window time filtering (`7d`, `30d`, `90d`, `All Time`) and CSV/JSON export.
- **Threat Actors & ATT&CK Directory:** MITRE ATT&CK enterprise group directory (LockBit, Volt Typhoon, Salt Typhoon, APT29, Lazarus Group, Cl0p, Akira, etc.) with verified aliases, targeted sectors, ATT&CK techniques, and linked incidents backed by attribution confidence tiers.
- **Intelligence Briefing Center:** Automated executive briefing generator with Traffic Light Protocol (TLP:CLEAR, GREEN, AMBER, RED) selector, print-ready CSS stylesheet, and Markdown download.

### Phase 3 · Analyst Tools
- **Watchlists & Alert Rules:** Persistent in-browser monitors (`localStorage`) for custom CVEs, vendors, threat actors, and keywords. Real-time match counters, alert feeds, and JSON rule import/export.
- **Local IOC & Hash Lookup:** Zero-third-party indicator search querying botnet C2 IPs, malicious domains, and hashes locally without external network requests (preserving OPSEC).
- **Incident Case Board & Comparison:** Multi-incident comparison matrix inspecting scoring factors, sector impacts, and defanged IOCs side-by-side with persistent triage scratchpads.
- **Global Command Palette (`⌘K` / `Ctrl+K`):** Instant keyboard palette allowing analysts to navigate routes, search CVEs, jump to actors, and launch actions anywhere on the platform.
- **Algorithm Weight Settings:** Live sliders for custom scoring weights with local persistence and one-click default resets.

---

## 📊 Ingested Intelligence Feeds

| Source Name | Ingestion Type | Format | Trust Tier | Primary Data Role |
| :--- | :--- | :---: | :---: | :--- |
| **CISA KEV** | Scheduled Pipeline | JSON | Tier 1 (Confirmed) | Known exploited vulnerabilities & ransomware flags |
| **CISA Advisories** | Scheduled Pipeline | RSS 2.0 | Tier 1 (Confirmed) | Official US federal cybersecurity bulletins |
| **UK NCSC** | Scheduled Pipeline | RSS 2.0 | Tier 1 (Confirmed) | UK government security alerts & reports |
| **CERT-FR (ANSSI)** | Scheduled Pipeline | RSS 2.0 | Tier 1 (Confirmed) | EU / French national CERT advisories |
| **FIRST EPSS** | REST Enrichment | JSON | Tier 1 (Probability) | 30-day algorithmic exploitation probability |
| **NVD CVE API 2.0** | Targeted Enrichment | JSON | Tier 1 (Confirmed) | CVSS v3.1 base scores, metrics & references |
| **abuse.ch Feodo Tracker**| Scheduled Pipeline | JSON | Tier 1 (IOC Feed) | Active botnet Command & Control (C2) IP blocklists |
| **abuse.ch ThreatFox** | Scheduled Pipeline | JSON | Tier 1 (IOC Feed) | Recent multi-type indicator of compromise feed |
| **MITRE ATT&CK** | Scheduled Pipeline | STIX 2.1 | Tier 1 (Reference) | Enterprise threat groups, techniques & aliases |
| **Ransomware.live** | Scheduled Pipeline | JSON | Tier 3 (Claimed) | Attacker extortion leak-site tracking |
| **BleepingComputer** | Scheduled Pipeline | RSS 2.0 | Tier 2 (Reported) | Commercial threat intelligence & breach news |
| **The Hacker News** | Scheduled Pipeline | RSS 2.0 | Tier 2 (Reported) | Cybersecurity news & vulnerability analysis |
| **SANS ISC InfoSec** | Scheduled Pipeline | RSS 2.0 | Tier 2 (Reported) | Threat analysis diaries & honeypot telemetry |
| **Krebs on Security** | Scheduled Pipeline | RSS 2.0 | Tier 2 (Reported) | Investigative breach reporting & cybercrime tracking |
| **SecurityWeek** | Scheduled Pipeline | RSS 2.0 | Tier 2 (Reported) | Enterprise security bulletins & vulnerability disclosures |

---

## 🛠️ Tech Stack & Engineering Standards

- **Runtime & Build:** React 18, TypeScript (Strict Mode), Vite 6, Tailwind CSS v4.
- **Routing:** React Router 7 (`HashRouter` prevents 404s on GitHub Pages refresh with base path `/Cyber-Threat-Intelligence-Platform/`).
- **Validation & Schemas:** Zod 3.24 runtime validation across all pipeline and snapshot payloads.
- **Vector Projection:** `d3-geo` (WGS84 Natural Earth projection).
- **Icons & UI:** Lucide React, color-blind safe severity tokens, SOC dark mode (`#070b14`).
- **Testing:** Vitest 5 + Testing Library (`@testing-library/react`, `@testing-library/jest-dom`).
- **Security:** Strict Content Security Policy (`CSP`), defanged indicators (`hxxps://`, `[.]`), zero credentials, Dependabot enabled.

---

## 🚀 Local Development & Execution

```bash
# 1. Clone the repository
git clone https://github.com/SulimanAl1/Cyber-Threat-Intelligence-Platform.git
cd Cyber-Threat-Intelligence-Platform

# 2. Install dependencies
npm install

# 3. Run development server
npm run dev
# Open http://localhost:5173/Cyber-Threat-Intelligence-Platform/

# 4. Execute test suite (31 unit & flow integration tests)
npm test

# 5. Execute strict type check & linter
npm run type-check
npm run lint

# 6. Execute local threat data pipeline (offline or live)
npm run pipeline
npm run pipeline:validate

# 7. Production build & local preview
npm run build
npm run preview
# Preview runs at http://localhost:4173/Cyber-Threat-Intelligence-Platform/
```

---

## 👤 Author & Engineering Methodology

Developed and engineered by **Sulaiman Alhabsi**. Built with strict operational integrity and transparency:
- **Explainability:** All classifications, scores, and attributions expose their exact decision rules and citations.
- **Integrity:** Zero simulated, fake, or synthetic records in production feeds. Unknown locations remain strictly unpinned on maps.
- **Reproducibility:** 100% of pipeline stages are automated pure functions with automated regression tests.

---

## 📜 License
Licensed under the [MIT License](LICENSE.txt). Intelligence feeds and STIX datasets remain the intellectual property of their respective publishers (CISA, MITRE, abuse.ch, FIRST, Ransomware.live, and news outlets).
