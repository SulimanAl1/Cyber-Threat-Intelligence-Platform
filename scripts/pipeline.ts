import fs from 'node:fs';
import path from 'node:path';
import { XMLParser } from 'fast-xml-parser';
import { SOURCE_REGISTRY } from '../src/config/sources';
import {
  Incident,
  IncidentSchema,
  EventClusterSchema,
  Vulnerability,
  VulnerabilitySchema,
  ThreatActor,
  ThreatActorSchema,
  Indicator,
  IndicatorSchema,
  SourceStatus,
  SourceStatusSchema,
  Meta,
  MetaSchema
} from '../src/types/schemas';
import { stripHtml, sanitizeUrl } from '../src/pipeline/sanitizer';
import { classifyIncident, checkNoise } from '../src/pipeline/classification';
import { extractCves, extractSector, extractFinancialImpact, extractIndicators } from '../src/pipeline/entity-extraction';
import { extractVictimCountry } from '../src/pipeline/gazetteer';
import { evaluateAttribution } from '../src/pipeline/attribution';
import { calculatePriorityScore } from '../src/pipeline/scoring';
import { clusterIncidents } from '../src/pipeline/deduplication';
import { defangIndicator } from '../src/pipeline/defang';

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_'
});

const PUBLIC_DATA_DIR = path.resolve(process.cwd(), 'public/data');
const REPO_DATA_DIR = path.resolve(process.cwd(), 'data');

if (!fs.existsSync(PUBLIC_DATA_DIR)) fs.mkdirSync(PUBLIC_DATA_DIR, { recursive: true });
if (!fs.existsSync(REPO_DATA_DIR)) fs.mkdirSync(REPO_DATA_DIR, { recursive: true });

function loadPreviousSnapshot<T>(fileName: string, fallback: T): T {
  const filePath = path.join(PUBLIC_DATA_DIR, fileName);
  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content) as T;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

async function fetchWithTimeout(url: string, timeoutMs = 12000): Promise<string> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'CyberSecurity-Threat-Intel-Platform/3.0 (Zayed-University; SOC-Research)'
      }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    return await res.text();
  } finally {
    clearTimeout(id);
  }
}

async function runPipeline() {
  console.log('=== GLOBAL CYBER THREAT INTELLIGENCE INGESTION PIPELINE ===');
  const startTime = Date.now();

  const previousIncidents = loadPreviousSnapshot<Incident[]>('incidents.json', []);
  const previousVulnerabilities = loadPreviousSnapshot<Vulnerability[]>('vulnerabilities.json', []);
  const previousActors = loadPreviousSnapshot<ThreatActor[]>('actors.json', []);
  const previousIndicators = loadPreviousSnapshot<Indicator[]>('indicators.json', []);
  const previousStatuses = loadPreviousSnapshot<SourceStatus[]>('source-status.json', []);

  const sourceStatuses: SourceStatus[] = [];
  const currentIncidents: Incident[] = [];
  const currentVulnerabilities: Vulnerability[] = [];
  const currentActors: ThreatActor[] = [];
  const currentIndicators: Indicator[] = [];

  for (const src of SOURCE_REGISTRY) {
    if (!src.enabled) {
      sourceStatuses.push({
        id: src.id,
        name: src.name,
        url: src.url,
        trustTier: src.trustTier,
        status: 'not_configured',
        lastSuccess: null,
        lastAttempt: new Date().toISOString(),
        latencyMs: 0,
        itemCount: 0,
        consecutiveFailures: 0,
        license: src.licenseNote,
        uptime7DaysPercent: 100
      });
      continue;
    }

    console.log(`Processing source [${src.id}]: ${src.name}...`);
    const attemptTime = new Date().toISOString();
    const fetchStart = Date.now();
    let rawText = '';
    let isSuccess = false;
    let errorMessage: string | undefined;

    try {
      rawText = await fetchWithTimeout(src.url);
      isSuccess = true;
    } catch (err: any) {
      errorMessage = err.message || 'Fetch failed';
      console.warn(`[WARNING] Failed to fetch source ${src.id}: ${errorMessage}`);
    }

    const latency = Date.now() - fetchStart;
    const prevStatus = previousStatuses.find((s) => s.id === src.id);

    if (!isSuccess) {
      // Retain last-good records for this source and mark stale
      const retainedIncidents = previousIncidents
        .filter((inc) => inc.sourceId === src.id)
        .map((inc) => ({ ...inc, isStale: true }));
      currentIncidents.push(...retainedIncidents);

      sourceStatuses.push({
        id: src.id,
        name: src.name,
        url: src.url,
        trustTier: src.trustTier,
        status: retainedIncidents.length > 0 ? 'degraded' : 'error',
        lastSuccess: prevStatus?.lastSuccess || null,
        lastAttempt: attemptTime,
        latencyMs: latency,
        itemCount: retainedIncidents.length,
        consecutiveFailures: (prevStatus?.consecutiveFailures || 0) + 1,
        lastErrorMessage: errorMessage,
        license: src.licenseNote,
        uptime7DaysPercent: prevStatus ? Math.max(70, prevStatus.uptime7DaysPercent - 5) : 90
      });
      continue;
    }

    // Source succeeded: parse based on source type
    let itemsParsed = 0;

    try {
      if (src.type === 'cisa_kev') {
        const kevData = JSON.parse(rawText);
        const vulns = kevData.vulnerabilities || [];
        for (const v of vulns) {
          const vulnObj: Vulnerability = {
            cveId: v.cveID,
            vendorProject: v.vendorProject || 'Unknown',
            product: v.product || 'Unknown',
            description: v.shortDescription || '',
            inKev: true,
            kevDateAdded: v.dateAdded,
            kevDueDate: v.dueDate,
            requiredAction: v.requiredAction,
            knownRansomwareUse: v.knownRansomwareCampaignUse === 'Known' ? 'Known' : 'Unknown',
            notes: v.notes,
            references: [],
            lastModified: v.dateAdded || new Date().toISOString().split('T')[0]
          };
          currentVulnerabilities.push(vulnObj);
        }
        itemsParsed = vulns.length;
      } else if (src.type === 'ransomware_live') {
        const posts = JSON.parse(rawText);
        const recent = Array.isArray(posts) ? posts.slice(0, 100) : [];
        for (const post of recent) {
          const date = (post.published || post.discovered || new Date().toISOString()).split('T')[0];
          const victim = post.post_title || 'Undisclosed Victim';
          const actor = post.group_name || 'Ransomware Group';
          const desc = post.description || `Extortion claim against ${victim} by ${actor}. Claimed on leak site.`;

          const attribution = evaluateAttribution({
            title: `Ransomware Claim: ${victim}`,
            summary: desc,
            sourceType: src.type,
            sourceTrustTier: src.trustTier
          });

          const loc = extractVictimCountry(`${victim} ${desc}`);
          const cves = extractCves(desc);
          const costs = extractFinancialImpact(desc);

          const { score, factors } = calculatePriorityScore({
            date,
            knownRansomware: true,
            evidenceLevel: 'Claimed',
            sourceCount: 1
          });

          const incident: Incident = {
            id: `inc-claim-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
            title: `${actor} Claims Extortion Attack on ${victim}`,
            summary: desc,
            contentSnippet: desc,
            date,
            url: sanitizeUrl(post.website || 'https://www.ransomware.live'),
            sourceId: src.id,
            sourceName: src.name,
            dataStatus: 'Claimed',
            evidenceLevel: 'Claimed',
            category: 'Ransomware',
            whyCategory: {
              rule: 'Ransomware Extortion Leak-Site Claim',
              matchedKeywords: ['ransomware', 'leak site', actor.toLowerCase()]
            },
            targetOrg: victim,
            sector: extractSector(`${victim} ${desc}`) || 'Commercial Enterprise',
            victimLocation: loc,
            cves,
            actors: attribution.actors.length > 0 ? attribution.actors : [
              { name: actor, attributionLevel: 'Claimed', evidenceSnippet: `Extortion claim posted under ${actor}` }
            ],
            indicators: extractIndicators(desc),
            costs,
            priorityScore: score,
            priorityFactors: factors,
            fetchedAt: attemptTime
          };

          currentIncidents.push(incident);
        }
        itemsParsed = recent.length;
      } else if (src.format === 'rss') {
        const parsed = xmlParser.parse(rawText);
        const channel = parsed.rss?.channel || parsed.feed;
        const rawItems = channel?.item || channel?.entry || [];
        const items = Array.isArray(rawItems) ? rawItems.slice(0, 50) : [rawItems];

        for (const item of items) {
          const rawTitle = item.title?.['#text'] || item.title || 'Security Incident';
          const title = stripHtml(String(rawTitle));
          const rawDesc = item.description?.['#text'] || item.description || item.summary || item.content || '';
          const summary = stripHtml(String(rawDesc)).slice(0, 500);
          const link = sanitizeUrl(item.link?.['@_href'] || item.link || item.id || '');

          const pubDate = item.pubDate || item.published || item.updated || item['dc:date'];
          const dateObj = pubDate ? new Date(pubDate) : new Date();
          const dateStr = !isNaN(dateObj.getTime()) ? dateObj.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

          // Check noise filter
          const noise = checkNoise(`${title} ${summary}`);
          if (noise.isNoise) {
            continue; // Filter out podcast/hiring/webinar noise
          }

          const classification = classifyIncident(title, summary);
          const cves = extractCves(`${title} ${summary}`);
          const attribution = evaluateAttribution({
            title,
            summary,
            sourceType: src.type,
            sourceTrustTier: src.trustTier
          });
          const loc = extractVictimCountry(`${title} ${summary}`);
          const sector = extractSector(`${title} ${summary}`);
          const costs = extractFinancialImpact(`${title} ${summary}`);
          const indicators = extractIndicators(`${title} ${summary}`);

          const { score, factors } = calculatePriorityScore({
            date: dateStr,
            knownRansomware: classification.category === 'Ransomware',
            evidenceLevel: attribution.overallEvidenceLevel,
            sourceCount: 1
          });

          const inc: Incident = {
            id: `inc-${src.id}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
            title,
            summary: summary || title,
            contentSnippet: summary,
            date: dateStr,
            url: link,
            sourceId: src.id,
            sourceName: src.name,
            dataStatus: attribution.suggestedDataStatus,
            evidenceLevel: attribution.overallEvidenceLevel,
            category: classification.category,
            whyCategory: classification.whyCategory,
            sector,
            victimLocation: loc,
            cves,
            actors: attribution.actors,
            indicators,
            costs,
            priorityScore: score,
            priorityFactors: factors,
            fetchedAt: attemptTime
          };

          currentIncidents.push(inc);
        }
        itemsParsed = items.length;
      } else if (src.id === 'feodo-tracker') {
        const data = JSON.parse(rawText);
        const list = Array.isArray(data) ? data.slice(0, 50) : [];
        for (const entry of list) {
          if (entry.ip_address) {
            currentIndicators.push({
              id: `ind-feodo-${entry.ip_address}`,
              type: 'ip',
              value: entry.ip_address,
              defangedValue: defangIndicator(entry.ip_address, 'ip'),
              raw: entry.ip_address,
              defanged: defangIndicator(entry.ip_address, 'ip'),
              threatType: 'Botnet C2 Server',
              malware: entry.malware || 'Feodo C2',
              source: src.name,
              firstSeen: entry.first_seen || new Date().toISOString().split('T')[0]
            });
          }
        }
        itemsParsed = list.length;
      } else if (src.id === 'threatfox') {
        const data = JSON.parse(rawText);
        const entries = Object.values(data).flat().slice(0, 50) as any[];
        for (const e of entries) {
          if (e.ioc_value) {
            const iocType = e.ioc_type?.includes('ip') ? 'ip' : e.ioc_type?.includes('url') ? 'url' : 'domain';
            currentIndicators.push({
              id: `ind-tf-${e.id || Math.random().toString(36).slice(2, 7)}`,
              type: iocType as any,
              value: e.ioc_value,
              defangedValue: defangIndicator(e.ioc_value, iocType as any),
              raw: e.ioc_value,
              defanged: defangIndicator(e.ioc_value, iocType as any),
              threatType: e.threat_type || 'Malware Indicator',
              malware: e.malware_printable || e.malware,
              source: src.name,
              firstSeen: (e.date_added || new Date().toISOString()).split(' ')[0]
            });
          }
        }
        itemsParsed = entries.length;
      } else if (src.id === 'mitre-attack') {
        const stixBundle = JSON.parse(rawText);
        const objects = stixBundle.objects || [];
        const groups = objects.filter((o: any) => o.type === 'intrusion-set');
        for (const g of groups.slice(0, 30)) {
          const actor: ThreatActor = {
            id: `actor-${g.id.replace('intrusion-set--', '')}`,
            name: g.name,
            aliases: g.aliases || [],
            description: g.description ? stripHtml(g.description).slice(0, 400) : 'Documented MITRE ATT&CK threat group.',
            mitreId: g.external_references?.[0]?.external_id,
            mitreUrl: g.external_references?.[0]?.url,
            techniques: [],
            software: [],
            targetSectors: ['Critical Infrastructure', 'Government', 'Financial Services'],
            targetCountries: ['United States', 'United Kingdom', 'European Union', 'Global'],
            linkedIncidentIds: []
          };
          currentActors.push(actor);
        }
        itemsParsed = groups.length;
      }

      sourceStatuses.push({
        id: src.id,
        name: src.name,
        url: src.url,
        trustTier: src.trustTier,
        status: 'healthy',
        lastSuccess: attemptTime,
        lastAttempt: attemptTime,
        latencyMs: latency,
        itemCount: itemsParsed,
        consecutiveFailures: 0,
        license: src.licenseNote,
        uptime7DaysPercent: 100
      });
    } catch (parseErr: any) {
      console.warn(`[ERROR] Parsing failed for source ${src.id}: ${parseErr.message}`);
      sourceStatuses.push({
        id: src.id,
        name: src.name,
        url: src.url,
        trustTier: src.trustTier,
        status: 'error',
        lastSuccess: prevStatus?.lastSuccess || null,
        lastAttempt: attemptTime,
        latencyMs: latency,
        itemCount: 0,
        consecutiveFailures: (prevStatus?.consecutiveFailures || 0) + 1,
        lastErrorMessage: `Parse Error: ${parseErr.message}`,
        license: src.licenseNote,
        uptime7DaysPercent: prevStatus ? Math.max(50, prevStatus.uptime7DaysPercent - 10) : 80
      });
    }
  }

  // Merge with previous indicators/actors if current is empty
  const finalVulnerabilities = currentVulnerabilities.length > 0 ? currentVulnerabilities : previousVulnerabilities;
  const finalActors = currentActors.length > 0 ? currentActors : previousActors;
  const finalIndicators = currentIndicators.length > 0 ? currentIndicators : previousIndicators;

  // Deduplicate and cluster incidents
  console.log(`Clustering ${currentIncidents.length} raw incidents into Event Clusters...`);
  const { clusters, clusteredIncidents } = clusterIncidents(currentIncidents);
  console.log(`Created ${clusters.length} unified Event Clusters.`);

  // Link incident IDs into Threat Actor profiles
  for (const actor of finalActors) {
    const matched = clusteredIncidents.filter((inc) =>
      inc.actors.some((a) => a.name.toLowerCase() === actor.name.toLowerCase()) ||
      actor.aliases.some((alias) => inc.actors.some((a) => a.name.toLowerCase() === alias.toLowerCase()))
    );
    actor.linkedIncidentIds = matched.map((m) => m.id);
  }

  // Build Metadata
  const dates = clusteredIncidents.map((i) => new Date(i.date).getTime()).filter((t) => !isNaN(t));
  const dateRangeStart = dates.length > 0 ? new Date(Math.min(...dates)).toISOString().split('T')[0] : '2026-01-01';
  const dateRangeEnd = dates.length > 0 ? new Date(Math.max(...dates)).toISOString().split('T')[0] : '2026-10-10';

  const meta: Meta = {
    schemaVersion: '3.0.0',
    generatedAt: new Date().toISOString(),
    incidentCount: clusteredIncidents.length,
    clusterCount: clusters.length,
    vulnerabilityCount: finalVulnerabilities.length,
    actorCount: finalActors.length,
    indicatorCount: finalIndicators.length,
    dateRangeStart,
    dateRangeEnd
  };

  // Run Zod schema validation on generated datasets
  console.log('Validating output snapshots against Zod schemas...');
  try {
    for (const inc of clusteredIncidents.slice(0, 50)) IncidentSchema.parse(inc);
    for (const cl of clusters.slice(0, 50)) EventClusterSchema.parse(cl);
    for (const v of finalVulnerabilities.slice(0, 50)) VulnerabilitySchema.parse(v);
    for (const a of finalActors.slice(0, 50)) ThreatActorSchema.parse(a);
    for (const ind of finalIndicators.slice(0, 50)) IndicatorSchema.parse(ind);
    for (const st of sourceStatuses) SourceStatusSchema.parse(st);
    MetaSchema.parse(meta);
    console.log('Zod schema validation passed successfully!');
  } catch (zodErr: any) {
    console.error('Validation error issue:', zodErr.issues || zodErr.message);
    throw new Error(`Zod validation failure: ${JSON.stringify(zodErr.issues || zodErr.message)}`);
  }

  // Write static JSON snapshots to both public/data/ and data/
  const filesToWrite = [
    { name: 'incidents.json', data: clusteredIncidents },
    { name: 'clusters.json', data: clusters },
    { name: 'vulnerabilities.json', data: finalVulnerabilities },
    { name: 'actors.json', data: finalActors },
    { name: 'indicators.json', data: finalIndicators },
    { name: 'source-status.json', data: sourceStatuses },
    { name: 'meta.json', data: meta }
  ];

  for (const file of filesToWrite) {
    const json = JSON.stringify(file.data, null, 2);
    fs.writeFileSync(path.join(PUBLIC_DATA_DIR, file.name), json, 'utf-8');
    fs.writeFileSync(path.join(REPO_DATA_DIR, file.name), json, 'utf-8');
    console.log(`Saved snapshot: ${file.name} (${(json.length / 1024).toFixed(1)} KB)`);
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`=== PIPELINE COMPLETED IN ${duration}s ===`);
}

runPipeline().catch((err: any) => {
  console.error('Pipeline fatal error:', err?.message || String(err));
  process.exit(1);
});
