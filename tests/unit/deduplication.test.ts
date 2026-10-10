import { describe, it, expect } from 'vitest';
import { shouldCluster, clusterIncidents, tokenize, jaccardSimilarity } from '../../src/pipeline/deduplication';
import { Incident } from '../../src/types/schemas';

const mockBaseIncident: Incident = {
  id: 'inc-1',
  title: 'Palo Alto Networks patches PAN-OS zero-day vulnerability',
  summary: 'Exploitation of CVE-2024-3400 detected in the wild.',
  date: '2026-10-08',
  url: 'https://example.com/1',
  sourceId: 'src-bleeping',
  sourceName: 'BleepingComputer',
  dataStatus: 'Reported',
  evidenceLevel: 'Reported',
  category: 'Exploited Vulnerability',
  whyCategory: { rule: 'Test Rule', matchedKeywords: ['zero-day'] },
  cves: ['CVE-2024-3400'],
  actors: [],
  indicators: [],
  priorityScore: 85,
  priorityFactors: {
    cisaKevPoints: 25,
    ransomwarePoints: 0,
    epssPoints: 15,
    cvssPoints: 20,
    evidencePoints: 4,
    corroborationPoints: 0,
    recencyDecay: 0,
    baseSum: 64,
    finalScore: 85,
    summary: 'Test breakdown'
  },
  fetchedAt: '2026-10-08T10:00:00Z'
};

describe('Deduplication & Event Clustering Engine', () => {
  it('computes correct Jaccard similarity between token sets', () => {
    const setA = tokenize('Hospital network encrypted in major ransomware attack');
    const setB = tokenize('Healthcare hospital systems encrypted by ransomware');
    const sim = jaccardSimilarity(setA, setB);
    expect(sim).toBeGreaterThan(0.4);
  });

  it('clusters duplicate reports with matching CVE within 7-day window (True Merge)', () => {
    const incA = { ...mockBaseIncident };
    const incB = {
      ...mockBaseIncident,
      id: 'inc-2',
      sourceId: 'src-thn',
      sourceName: 'The Hacker News',
      title: 'Critical PAN-OS Flaw Under Active Attack',
      date: '2026-10-09'
    };

    expect(shouldCluster(incA, incB)).toBe(true);
  });

  it('rejects clustering when time window exceeds 7 days even with matching CVE (False Merge Prevention)', () => {
    const incA = { ...mockBaseIncident, date: '2026-09-01' };
    const incB = { ...mockBaseIncident, id: 'inc-2', date: '2026-10-09' };

    // More than 7 days apart (38 days)
    expect(shouldCluster(incA, incB)).toBe(false);
  });

  it('rejects clustering when articles describe completely distinct events with low token similarity (False Merge Prevention)', () => {
    const incA: Incident = {
      ...mockBaseIncident,
      title: 'Sony Group investigates ransomware extortion claims',
      cves: []
    };
    const incB: Incident = {
      ...mockBaseIncident,
      id: 'inc-2',
      title: 'DDoS attack strikes European airport systems',
      cves: []
    };

    expect(shouldCluster(incA, incB)).toBe(false);
  });

  it('clusters multi-source incidents into unified EventCluster with supporting reports', () => {
    const incA = { ...mockBaseIncident, id: 'inc-a', sourceName: 'BleepingComputer' };
    const incB = { ...mockBaseIncident, id: 'inc-b', sourceName: 'The Hacker News', date: '2026-10-09' };
    const incC = { ...mockBaseIncident, id: 'inc-c', sourceName: 'SANS ISC', date: '2026-10-08' };

    const { clusters, clusteredIncidents } = clusterIncidents([incA, incB, incC]);

    expect(clusters.length).toBe(1);
    expect(clusters[0].sourceCount).toBe(3);
    expect(clusters[0].supportingReports.length).toBe(2);
    expect(clusteredIncidents.every((i) => i.clusterId === clusters[0].id)).toBe(true);
  });
});
