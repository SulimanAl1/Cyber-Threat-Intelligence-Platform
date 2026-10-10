import { describe, it, expect, beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { App } from '../../src/App';

// Mock data fixtures for snapshot fetch calls
const mockIncidents = [
  {
    id: 'inc-test-1',
    title: 'Critical Ransomware Outage at Alpha Hospital',
    summary: 'Healthcare IT network encrypted by LockBit 3.0 ransomware.',
    contentSnippet: 'Healthcare IT network encrypted by LockBit 3.0 ransomware.',
    date: '2026-10-09',
    url: 'https://example.com/alpha',
    sourceId: 'bleepingcomputer',
    sourceName: 'BleepingComputer',
    dataStatus: 'Reported',
    evidenceLevel: 'Reported',
    clusterId: 'cluster-test-1',
    category: 'Ransomware',
    whyCategory: { rule: 'Ransomware Rule', matchedKeywords: ['ransomware'] },
    targetOrg: 'Alpha Hospital',
    sector: 'Healthcare',
    cves: ['CVE-2024-3400'],
    actors: [{ name: 'LockBit', attributionLevel: 'Keyword-mention' }],
    indicators: [{ id: 'ind-1', type: 'ip', raw: '1.2.3.4', defanged: '1[.]2[.]3[.]4' }],
    priorityScore: 88,
    priorityFactors: {
      cisaKevPoints: 25,
      ransomwarePoints: 20,
      epssPoints: 15,
      cvssPoints: 20,
      evidencePoints: 4,
      corroborationPoints: 4,
      recencyDecay: 0,
      baseSum: 88,
      finalScore: 88,
      summary: 'Test factor breakdown summary'
    },
    fetchedAt: '2026-10-09T10:00:00Z'
  }
];

const mockClusters = [
  {
    id: 'cluster-test-1',
    title: 'Critical Ransomware Outage at Alpha Hospital',
    summary: 'Healthcare IT network encrypted by LockBit 3.0 ransomware.',
    category: 'Ransomware',
    primaryIncidentId: 'inc-test-1',
    incidentIds: ['inc-test-1'],
    supportingReports: [],
    sourceCount: 1,
    sources: ['BleepingComputer'],
    firstSeen: '2026-10-09',
    lastSeen: '2026-10-09',
    cves: ['CVE-2024-3400'],
    actors: [],
    targetOrg: 'Alpha Hospital',
    sector: 'Healthcare',
    victimCountry: 'United States',
    maxPriorityScore: 88
  }
];

const mockVulns = [
  {
    cveId: 'CVE-2024-3400',
    vendorProject: 'Palo Alto Networks',
    product: 'PAN-OS',
    description: 'Command injection flaw in GlobalProtect gateway.',
    inKev: true,
    kevDateAdded: '2024-04-12',
    kevDueDate: '2026-10-15',
    requiredAction: 'Apply vendor hotfixes immediately.',
    knownRansomwareUse: 'Known',
    references: [],
    lastModified: '2026-10-09'
  }
];

const mockSourceStatuses = [
  {
    id: 'bleepingcomputer',
    name: 'BleepingComputer Security News',
    url: 'https://www.bleepingcomputer.com/feed/',
    trustTier: 2,
    status: 'healthy',
    lastSuccess: '2026-10-09T10:00:00Z',
    lastAttempt: '2026-10-09T10:00:00Z',
    latencyMs: 95,
    itemCount: 1,
    consecutiveFailures: 0,
    license: 'Public Editorial RSS',
    uptime7DaysPercent: 100
  }
];

const mockMeta = {
  schemaVersion: '3.0.0',
  generatedAt: new Date().toISOString(),
  incidentCount: 1,
  clusterCount: 1,
  vulnerabilityCount: 1,
  actorCount: 0,
  indicatorCount: 1,
  dateRangeStart: '2026-10-01',
  dateRangeEnd: '2026-10-09'
};

describe('Frontend Flow Integration Tests (Testing Library)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      let data: any = [];
      if (url.includes('incidents.json')) data = mockIncidents;
      else if (url.includes('clusters.json')) data = mockClusters;
      else if (url.includes('vulnerabilities.json')) data = mockVulns;
      else if (url.includes('source-status.json')) data = mockSourceStatuses;
      else if (url.includes('meta.json')) data = mockMeta;
      else if (url.includes('actors.json')) data = [];
      else if (url.includes('indicators.json')) data = [];

      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(data)
      });
    }));
  });

  it('renders Overview page with real KPIs and priority stream', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Threat Intelligence Overview/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Logged Reports/i)).toBeInTheDocument();
    expect(screen.getByText(/Event Clusters/i)).toBeInTheDocument();
    expect(screen.getByText(/CISA KEV Catalog/i)).toBeInTheDocument();
    expect(screen.getByText(/Prioritized Incident Stream/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Critical Ransomware Outage at Alpha Hospital/i).length).toBeGreaterThanOrEqual(1);
  });

  it('opens and closes score weight settings modal', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Weights/i)).toBeInTheDocument();
    });

    const weightsBtn = screen.getByText(/Weights/i);
    fireEvent.click(weightsBtn);

    expect(screen.getByText(/Priority Score Algorithm Settings/i)).toBeInTheDocument();
    expect(screen.getByText(/CISA KEV Catalog Weight/i)).toBeInTheDocument();

    const applyBtn = screen.getByText(/Apply Weights/i);
    fireEvent.click(applyBtn);

    await waitFor(() => {
      expect(screen.queryByText(/Priority Score Algorithm Settings/i)).not.toBeInTheDocument();
    });
  });
});
