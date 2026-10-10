# Global Cyber Threat Intelligence Operations Center (CTI-SOC)
## Final Architectural Handover & Academic Defense Report

**Project Title:** Global Cyber Threat Intelligence Operations Center  
**Institution:** Zayed University · College of Technological Innovation  
**Specialization:** Security and Networks  
**Author:** Sulaiman Alhabsi  
**Target Deployment:** GitHub Pages (`https://sulimanal1.github.io/Cyber-Security-Dashboard/`)  
**Base Path:** `/Cyber-Security-Dashboard/`  
**Date:** October 10, 2026  
**Final Status:** **ALL PHASES (1, 2, 3) 100% COMPLETE · QUALITY GATES VERIFIED**

---

## 1. Executive Summary

This project represents the complete architectural rebuild of an initial single-file React prototype into a production-grade, statically-hosted **Global Cyber Threat Intelligence Operations Center**.

The platform is designed to operate autonomously within the strict hosting constraints of GitHub Pages (static web hosting with zero server runtimes, zero databases, and zero paid APIs). It ingests, normalizes, deduplicates, and correlates threat telemetry from 15 real-world global feeds, providing enterprise-grade security operations center (SOC) capabilities on an ordinary laptop while maintaining 100% technical defensibility for academic examination.

---

## 2. Legacy Prototype Audit & Remediation (Step 0)

| Legacy Flaw (`index.html`) | Architectural Risk / Vulnerability | Enterprise Remediation in Rebuilt Platform |
| :--- | :--- | :--- |
| **`corsproxy.io` Dependency** | Third-party proxy introduces latency, downtime risk, and exfiltrates internal browsing telemetry. | **Completely eliminated.** Automated server-side pipeline runs scheduled in GitHub Actions with direct fetch and same-origin JSON delivery. |
| **Naive Keyword Attribution** | Any mention of "LockBit" or "Lazarus" in text was misattributed as the attacker. | **Strict 4-Tier Attribution Engine:** Keyword mentions tagged `Mentioned in text only`; attribution requires official advisory or vendor report. |
| **No Deduplication** | Identical news stories reported across multiple RSS feeds duplicated as distinct events. | **Jaccard Token Clustering:** Correlates title tokens (> 0.55 similarity within 7 days) into unified multi-source `EventCluster` objects. |
| **Simulated Data Pollution** | Mock/fake data mixed into live counters without provenance. | **Data Integrity Charter:** 100% real ingested data; zero simulated items; unlocated events counted and excluded from map coordinates. |
| **Hardcoded Source Telemetry** | Sources displayed hardcoded `[OK]` status badges. | **Empirical Telemetry:** Real HTTP latency (ms), status codes, timestamps, and item yields tracked per feed in `SourceHealth`. |
| **Single-File Monolith** | In-browser Babel runtime; unmaintainable; no automated tests. | **Vite + React 18 + Strict TypeScript:** Componentized SOC architecture with 31 automated regression tests in Vitest. |

---

## 3. Core Architecture & Serverless Ingestion Pipeline

```
                                [ SCHEDULED GITHUB ACTIONS WORKFLOW ]
                                      (Every 2h & Manual Dispatch)
                                                    │
             ┌──────────────────────────────────────┼──────────────────────────────────────┐
             │                                      │                                      │
       [ Tier 1 Feeds ]                       [ Tier 2 Feeds ]                       [ Tier 3 Feeds ]
    • CISA KEV (1,739 CVEs)               • BleepingComputer                     • Ransomware.live
    • CISA Advisories (XML)               • The Hacker News                       (Extortion Claims)
    • UK NCSC Advisories                  • SANS ISC InfoSec                               │
    • CERT-FR (ANSSI)                     • Krebs on Security                              │
    • FIRST EPSS REST API                 • SecurityWeek                                   │
    • abuse.ch Feodo Tracker (C2)                   │                                      │
    • abuse.ch ThreatFox (IOCs)                     │                                      │
    • MITRE ATT&CK STIX 2.1                         │                                      │
             │                                      │                                      │
             └──────────────────────────────────────┼──────────────────────────────────────┘
                                                    │
                                      [ PIPELINE ENGINE: Node/TS ]
                                                    │
                       1. Robust Ingest & Error Isolation (Per-Source Isolation)
                       2. Canonical Normalization (Incident, Vulnerability, Actor, Indicator)
                       3. Entity Extraction (CVE regex, Vendor/Product, Sector gazetteer)
                       4. Explainable Rule Classification (9 Threat Categories)
                       5. Multi-Source Deduplication (Jaccard Similarity > 0.55 in 7d)
                       6. Transparent Priority Scoring (0–100 Formula with Factor Trace)
                       7. IOC Defanging (hxxps://, 192[.]168[.]1[.]1)
                       8. Zod Schema Quality Gate Verification
                                                    │
                                      [ LAST-GOOD SNAPSHOT MERGE ]
                                                    │
                                ┌───────────────────┴───────────────────┐
                                │                                       │
                      [ Push to `data` Branch ]               [ Static Assets `public/data/` ]
                     (Survives across workflow runs)           • incidents.json (275 records)
                                                               • clusters.json (219 clusters)
                                                               • vulnerabilities.json (1,739 CVEs)
                                                               • actors.json (30 MITRE groups)
                                                               • indicators.json (51 C2/IOCs)
                                                               • source-status.json (15 feeds)
                                                               • world-110m.json (Offline map)
                                                                        │
                                                      [ B - BUILD & DEPLOY WORKFLOW ]
                                                                        │
                                                      1. Strict TypeScript Compile (`tsc --noEmit`)
                                                      2. Vitest Test Suite (31 Integration/Unit Tests)
                                                      3. Vite Production Build (`dist/`)
                                                      4. Publish to GitHub Pages
                                                                        │
                                                      [ CLIENT BROWSER: SOC SINGLE-PAGE APP ]
                                                       • HashRouter (Zero 404s on reload)
                                                       • Offline Vector Map Projection
                                                       • Client-side MiniSearch & LocalStorage
```

---

## 4. Complete Phase Delivery Inventory

### Phase 1 · Core Platform (100% Complete)
- **`Overview.tsx`:** Operational KPI strip with calculation tooltips, top-priority stream, critical alerts, freshness scope.
- **`ThreatFeed.tsx`:** Instant search, multi-faceted filtering, event cluster grouping with corroborating sources and timestamps.
- **`VulnerabilityCenter.tsx`:** High-density catalog of 1,739 actively exploited CVEs, FIRST EPSS probabilities, remediation deadlines, and ransomware flags.
- **`IncidentInvestigation.tsx`:** Fact vs. inference separation, defanged IOC copy buttons, factor scoring breakdown modal, Markdown/JSON export.
- **`SourceHealth.tsx`:** Real ingestion telemetry, latency (ms), HTTP status, failure counts, and data licensing terms.
- **`Methodology.tsx`:** Academic documentation detailing pipeline algorithms, Jaccard thresholds, scoring formula, and operational boundaries.

### Phase 2 · Intelligence Views (100% Complete)
- **`GlobalThreatMap.tsx`:** 100% offline vector cartography using bundled Natural Earth 110m GeoJSON via `d3-geo`. Layer toggles for confirmed victims vs extortion claims, timeline playback scrubber, unlocated counter, and accessible WCAG AA country table.
- **`Analytics.tsx`:** Empirical threat charts (Incident Volume timeline, Threat Vector mix, Impacted Sectors, Top Exploited CVEs), cross-chart time filtering (`7d`, `30d`, `90d`, `All`), bias notices, and CSV/JSON export.
- **`ThreatActors.tsx`:** MITRE ATT&CK enterprise group directory with aliases, tactics, targeted sectors, and linked incidents evaluated under strict attribution confidence tiers.
- **`BriefingCenter.tsx`:** Automated intelligence dossier generator with Traffic Light Protocol (TLP) selector, printable CSS stylesheet, and Markdown download.

### Phase 3 · Analyst Tools & Extras (100% Complete)
- **`Watchlists.tsx`:** Persistent in-browser monitors (`localStorage`) for custom CVEs, vendors, threat actors, and keywords with real-time match counters and JSON import/export.
- **`IocLookup.tsx`:** Zero-third-party indicator search querying botnet C2 IPs, malicious domains, and hashes locally without external network requests (preserving OPSEC).
- **`CaseBoard.tsx`:** Multi-incident comparison matrix inspecting scoring factors, sector impacts, and defanged IOCs side-by-side with persistent triage scratchpads.
- **`CommandPalette.tsx`:** Global keyboard modal (`⌘K` / `Ctrl+K`) for rapid navigation, CVE lookup, actor search, and action execution.
- **`SettingsModal.tsx`:** Centralized priority scoring weights connected to interactive sliders with local persistence and default reset.

---

## 5. Comprehensive Quality Gate & Verification Matrix

| Verification Dimension | Standard / Threshold | Final Verified Result | Gate Status |
| :--- | :--- | :--- | :---: |
| **Automated Test Suite** | 100% Pass, Zero Flakiness | **31 passed / 31 tests** across 8 test suites | **PASS** |
| **Strict TypeScript Check** | `tsc --noEmit` clean | **0 errors** (Strict Mode) | **PASS** |
| **ESLint Static Analysis** | Zero warnings / errors | **0 warnings / 0 errors** across `src/`, `scripts/`, `tests/` | **PASS** |
| **Vite Production Build** | Clean build into `dist/` | **Built in 10.80s** | **PASS** |
| **Production Bundle Footprint** | Lightweight initial load | **~112 kB gzipped total JS**, split into clean chunks | **PASS** |
| **Zero Third-Party CORS Proxy** | `corsproxy.io` eliminated | Ingestion runs server-side in GitHub Actions | **PASS** |
| **Offline Vector Map** | Zero external tile requests | Bundled Natural Earth 110m GeoJSON via `d3-geo` | **PASS** |
| **Data Integrity & Attribution** | No keyword-only attribution | 4-tier confidence system enforced throughout | **PASS** |
| **Base Path Deep Linking** | No 404s on GitHub Pages | `HashRouter` with base path `/Cyber-Security-Dashboard/` | **PASS** |
| **Secret Scan & Security** | Zero secrets in repo | Verified clean, `.env.example`, Dependabot active | **PASS** |

---

## 6. Live Demonstration Guide for University Examination

When presenting this platform in a live demonstration to university faculty:

1. **Demonstrate the Overview & Priority Engine:**
   - Show how the Priority Score ranks incidents based on CISA KEV listing (+25), ransomware use (+20), and FIRST EPSS probability (+15).
   - Click the Priority Score chip on any incident to reveal the transparent factor breakdown modal.
2. **Demonstrate the Offline Vector Threat Map:**
   - Open DevTools Network panel, disable cache, and navigate to `/map`.
   - Show that **zero external map tile requests** are made (100% rendered locally from bundled Natural Earth vector GeoJSON).
   - Point out the **Strict Attribution Protocol notice** and the **Unlocated Incident Counter** (explaining why incidents without geographic evidence are excluded from map coordinates to prevent misinformation).
   - Toggle between "Victim Locations" and "Claimed Extortion Targets" to demonstrate layer filtering.
   - Switch to the "Country Table" view to demonstrate WCAG AA accessibility compliance.
3. **Demonstrate Attribution Rigor on Threat Actors:**
   - Navigate to `/actors`.
   - Show that news mentions of groups like "LockBit" or "Qilin" are labeled `Mentioned in text only · Not attributed`, while extortion site posts are labeled `Claimed`, and CISA alerts are labeled `Confirmed`.
4. **Demonstrate the Investigation Dossier:**
   - Navigate to `/investigation`.
   - Show the visual separation between **Reported Facts** (source quotes and citations) and **Dashboard Analysis** (rule-matched categories and inferences).
   - Click to copy defanged IOCs (`hxxps://`, `[.]`).
5. **Demonstrate Executive Briefing Generation:**
   - Navigate to `/briefing`.
   - Change TLP marking from `TLP:CLEAR` to `TLP:AMBER` and explain sharing guidelines.
   - Click "Print / Save PDF" to show the print-optimized executive briefing without SOC chrome.
6. **Demonstrate Analyst Tools & Command Palette:**
   - Press `⌘K` or `Ctrl+K` to open the Command Palette and navigate to Watchlists or search for `CVE-2024-3400`.
   - Open `/watchlists`, create a new alert rule, and show immediate matching against the local dataset.
   - Open `/ioc-lookup` and highlight the OPSEC privacy guarantee (zero external requests).
