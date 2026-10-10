# Data Model and Schemas Specification

**Version:** 3.0.0  
**Specification Type:** Zod Schemas & TypeScript Types  
**Target Location:** `src/types/schemas.ts`

---

## 1. Incident Schema (`Incident`)

Represents an individual reported or confirmed security event.

```typescript
export interface Incident {
  id: string; // Unique deterministic hash or prefix (e.g., 'inc-cisa-2026-001')
  title: string;
  summary: string;
  contentSnippet?: string;
  date: string; // ISO 8601 (YYYY-MM-DD or full timestamp)
  url: string; // Verified HTTP/HTTPS original link
  sourceId: string; // References SourceRegistry.id
  sourceName: string;
  dataStatus: 'Confirmed' | 'Reported' | 'Claimed' | 'Inferred' | 'Simulated';
  evidenceLevel: 'Confirmed' | 'Vendor-assessed' | 'Reported' | 'Claimed' | 'Keyword-mention';
  clusterId?: string; // Linked EventCluster identifier
  category: IncidentCategory;
  whyCategory: { rule: string; matchedKeywords: string[] };
  targetOrg?: string; // Target or victim organization name if stated
  sector?: string; // Critical infrastructure or industry sector
  victimLocation?: LocationEntity; // Verified victim geographical location
  affectedOrganizationLocation?: LocationEntity;
  reportedActivityLocation?: LocationEntity;
  suspectedOrigin?: LocationEntity; // Only if an authoritative source explicitly cited it
  cves: string[]; // Associated CVE IDs (e.g. ['CVE-2024-3400'])
  actors: ActorMention[]; // Mentioned or attributed threat actors
  indicators: ExtractedIndicator[]; // Defanged indicators of compromise
  costs?: StatedFinancialImpact;
  priorityScore: number; // 0 - 100
  priorityFactors: PriorityFactorBreakdown;
  fetchedAt: string; // ISO 8601 timestamp
  isStale?: boolean;
}
```

---

## 2. Event Cluster Schema (`EventCluster`)

Represents a deduplicated, multi-source correlated security incident.

```typescript
export interface EventCluster {
  id: string; // 'cluster-YYYYMMDD-hash'
  title: string; // Canonical title derived from primary report
  summary: string;
  category: IncidentCategory;
  primaryIncidentId: string;
  incidentIds: string[]; // All member incidents
  sourceCount: number; // Count of unique corroborating sources
  sources: string[]; // Names of all reporting feeds
  firstSeen: string; // Timestamp of earliest report
  lastSeen: string; // Timestamp of most recent report
  cves: string[];
  targetOrg?: string;
  sector?: string;
  victimCountry?: string;
  maxPriorityScore: number;
}
```

---

## 3. Vulnerability Schema (`Vulnerability`)

Represents an actively tracked Common Vulnerabilities and Exposures (CVE) entry.

```typescript
export interface Vulnerability {
  cveId: string; // Format: CVE-YYYY-NNNN+
  vendorProject: string;
  product: string;
  description: string;
  cvssScore?: number; // Base score (0.0 - 10.0)
  cvssVersion?: string; // '3.1' | '4.0'
  cvssVector?: string;
  epssScore?: number; // 0.0 - 1.0 (Exploitation probability)
  epssPercentile?: number; // 0.0 - 1.0
  inKev: boolean; // Present in CISA Known Exploited Vulnerabilities catalog
  kevDateAdded?: string;
  kevDueDate?: string;
  requiredAction?: string;
  knownRansomwareUse: 'Known' | 'Unknown';
  notes?: string;
  references: string[];
  lastModified: string;
}
```

---

## 4. Threat Actor Schema (`ThreatActor`)

Represents a threat group modeled from MITRE ATT&CK enterprise data and linked live incidents.

```typescript
export interface ThreatActor {
  id: string; // e.g. 'actor-G0007' or 'actor-lockbit'
  name: string; // Primary moniker (e.g. 'APT29')
  aliases: string[]; // ['Midnight Blizzard', 'Cozy Bear', 'NOBELIUM']
  description: string;
  mitreId?: string; // 'G0007'
  mitreUrl?: string;
  country?: string; // Suspected state sponsor if cited by MITRE
  techniques: { id: string; name: string }[]; // MITRE ATT&CK techniques
  software: string[]; // Associated malware / tools
  targetSectors: string[];
  targetCountries: string[];
  linkedIncidentIds: string[];
}
```

---

## 5. Source Status Schema (`SourceStatus`)

Monitors operational telemetry for each ingested feed.

```typescript
export interface SourceStatus {
  id: string;
  name: string;
  url: string;
  trustTier: 1 | 2 | 3; // Tier 1: Authoritative/Official, Tier 2: Established News, Tier 3: Unverified/Attacker claims
  status: 'healthy' | 'degraded' | 'error' | 'not_configured';
  lastSuccess: string | null;
  lastAttempt: string | null;
  latencyMs: number;
  itemCount: number;
  consecutiveFailures: number;
  lastErrorMessage?: string;
  license: string;
  uptime7DaysPercent: number;
}
```
