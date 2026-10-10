import { Incident, EventCluster, SupportingReport } from '../types/schemas';

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
  'with', 'by', 'from', 'up', 'about', 'into', 'over', 'after', 'is', 'are',
  'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
  'did', 'will', 'would', 'shall', 'should', 'can', 'could', 'may', 'might',
  'this', 'that', 'these', 'those', 'new', 'security', 'cyber', 'attack',
  'vulnerability', 'flaw', 'alert'
]);

export function tokenize(text: string): Set<string> {
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
  return new Set(tokens);
}

export function jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export function getDaysDifference(dateAStr: string, dateBStr: string): number {
  const dateA = new Date(dateAStr).getTime();
  const dateB = new Date(dateBStr).getTime();
  if (isNaN(dateA) || isNaN(dateB)) return 999;
  return Math.abs(dateA - dateB) / (1000 * 60 * 60 * 24);
}

export function shouldCluster(incA: Incident, incB: Incident): boolean {
  const dayDiff = getDaysDifference(incA.date, incB.date);
  if (dayDiff > 7) return false; // Window limit: 7 days

  // 1. Shared CVE overlap (exact match)
  if (incA.cves.length > 0 && incB.cves.length > 0) {
    const sharedCves = incA.cves.filter((c) => incB.cves.includes(c));
    if (sharedCves.length > 0) return true;
  }

  // 2. Shared Victim Organization match (if stated and meaningful)
  if (incA.targetOrg && incB.targetOrg && incA.targetOrg.length > 3) {
    if (incA.targetOrg.toLowerCase() === incB.targetOrg.toLowerCase()) return true;
  }

  // 3. High Title Token Jaccard Similarity (> 0.55)
  const tokensA = tokenize(incA.title);
  const tokensB = tokenize(incB.title);
  const similarity = jaccardSimilarity(tokensA, tokensB);

  return similarity >= 0.55;
}

export function clusterIncidents(incidents: Incident[]): {
  clusters: EventCluster[];
  clusteredIncidents: Incident[];
} {
  // Sort incidents by date descending, then priority score descending
  const sorted = [...incidents].sort((a, b) => {
    const timeDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (timeDiff !== 0) return timeDiff;
    return b.priorityScore - a.priorityScore;
  });

  const clusterMap: Map<string, Incident[]> = new Map();
  const assignedClusterId = new Map<string, string>();

  let nextClusterIndex = 1;

  for (let i = 0; i < sorted.length; i++) {
    const inc = sorted[i];
    if (assignedClusterId.has(inc.id)) continue;

    const clusterId = `cluster-${inc.date.replace(/-/g, '')}-${String(nextClusterIndex++).padStart(3, '0')}`;
    const members: Incident[] = [inc];
    assignedClusterId.set(inc.id, clusterId);

    // Look for matching subsequent incidents
    for (let j = i + 1; j < sorted.length; j++) {
      const candidate = sorted[j];
      if (assignedClusterId.has(candidate.id)) continue;

      if (shouldCluster(inc, candidate)) {
        members.push(candidate);
        assignedClusterId.set(candidate.id, clusterId);
      }
    }

    clusterMap.set(clusterId, members);
  }

  const clusters: EventCluster[] = [];
  const updatedIncidents = sorted.map((inc) => ({
    ...inc,
    clusterId: assignedClusterId.get(inc.id)
  }));

  for (const [clusterId, members] of clusterMap.entries()) {
    // Primary report is the one with highest priority score or earliest official source
    const primary = [...members].sort((a, b) => b.priorityScore - a.priorityScore)[0];
    const uniqueSources = Array.from(new Set(members.map((m) => m.sourceName)));
    const allCves = Array.from(new Set(members.flatMap((m) => m.cves)));
    const allActors = members.flatMap((m) => m.actors);

    const supportingReports: SupportingReport[] = members
      .filter((m) => m.id !== primary.id)
      .map((m) => ({
        id: m.id,
        sourceId: m.sourceId,
        sourceName: m.sourceName,
        title: m.title,
        url: m.url,
        date: m.date
      }));

    const dates = members.map((m) => new Date(m.date).getTime()).filter((t) => !isNaN(t));
    const firstSeen = dates.length > 0 ? new Date(Math.min(...dates)).toISOString().split('T')[0] : primary.date;
    const lastSeen = dates.length > 0 ? new Date(Math.max(...dates)).toISOString().split('T')[0] : primary.date;

    clusters.push({
      id: clusterId,
      title: primary.title,
      summary: primary.summary,
      category: primary.category,
      primaryIncidentId: primary.id,
      incidentIds: members.map((m) => m.id),
      supportingReports,
      sourceCount: uniqueSources.length,
      sources: uniqueSources,
      firstSeen,
      lastSeen,
      cves: allCves,
      actors: allActors,
      targetOrg: primary.targetOrg,
      sector: primary.sector,
      victimCountry: primary.victimLocation?.country,
      maxPriorityScore: Math.max(...members.map((m) => m.priorityScore))
    });
  }

  return {
    clusters,
    clusteredIncidents: updatedIncidents
  };
}
