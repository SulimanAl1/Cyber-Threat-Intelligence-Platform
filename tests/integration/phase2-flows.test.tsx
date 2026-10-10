import { describe, it, expect, beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { HashRouter as Router } from 'react-router-dom';
import { DataProvider } from '../../src/context/DataContext';
import { GlobalThreatMap } from '../../src/pages/GlobalThreatMap';
import { Analytics } from '../../src/pages/Analytics';
import { ThreatActors } from '../../src/pages/ThreatActors';
import { BriefingCenter } from '../../src/pages/BriefingCenter';

const mockIncidents = [
  {
    id: 'inc-p2-1',
    title: 'Extortion Attack on Global Logistics in Germany',
    summary: 'Ransomware deployment disrupting supply chain freight systems across Hamburg.',
    contentSnippet: 'Ransomware deployment disrupting supply chain freight systems across Hamburg.',
    date: '2026-10-08',
    url: 'https://example.com/logistics',
    sourceId: 'bleepingcomputer',
    sourceName: 'BleepingComputer',
    dataStatus: 'Reported',
    evidenceLevel: 'Reported',
    clusterId: 'cluster-p2-1',
    category: 'Ransomware',
    whyCategory: { rule: 'Ransomware Rule', matchedKeywords: ['ransomware'] },
    targetOrg: 'Global Logistics AG',
    sector: 'Transportation',
    victimLocation: {
      country: 'Germany',
      countryCode: 'DE',
      latitude: 51.1657,
      longitude: 10.4515,
      evidenceText: 'Matched pattern "Germany" in source text'
    },
    cves: ['CVE-2024-3400'],
    actors: [{ name: 'LockBit', attributionLevel: 'Keyword-mention' }],
    indicators: [],
    priorityScore: 92,
    priorityFactors: {
      cisaKevPoints: 25,
      ransomwarePoints: 20,
      epssPoints: 15,
      cvssPoints: 20,
      evidencePoints: 4,
      corroborationPoints: 8,
      recencyDecay: 0,
      baseSum: 92,
      finalScore: 92,
      summary: 'High priority multi-factor incident'
    },
    fetchedAt: '2026-10-08T12:00:00Z'
  },
  {
    id: 'inc-p2-2',
    title: 'Deadlock Claims Extortion on Beta Corp in France',
    summary: 'Attacker leak-site extortion listing demanding payment.',
    contentSnippet: 'Attacker leak-site extortion listing demanding payment.',
    date: '2026-10-09',
    url: 'https://ransomware.live/beta',
    sourceId: 'ransomware-live',
    sourceName: 'Ransomware.live Extortion Leak-Site Tracking',
    dataStatus: 'Claimed',
    evidenceLevel: 'Claimed',
    clusterId: 'cluster-p2-2',
    category: 'Ransomware',
    whyCategory: { rule: 'Extortion Claim', matchedKeywords: ['extortion'] },
    targetOrg: 'Beta Corp',
    sector: 'Manufacturing',
    victimLocation: {
      country: 'France',
      countryCode: 'FR',
      latitude: 46.2276,
      longitude: 2.2137,
      evidenceText: 'Matched pattern "France" in victim metadata'
    },
    cves: [],
    actors: [{ name: 'Deadlock', attributionLevel: 'Claimed', evidenceSnippet: 'Extortion claim' }],
    indicators: [],
    priorityScore: 65,
    priorityFactors: {
      cisaKevPoints: 0,
      ransomwarePoints: 20,
      epssPoints: 0,
      cvssPoints: 0,
      evidencePoints: 1,
      corroborationPoints: 0,
      recencyDecay: 0,
      baseSum: 21,
      finalScore: 65,
      summary: 'Attacker extortion claim'
    },
    fetchedAt: '2026-10-09T08:00:00Z'
  }
];

const mockActors = [
  {
    id: 'actor-lockbit',
    name: 'LockBit',
    aliases: ['LockBit 3.0', 'LockBit Black'],
    description: 'Ransomware-as-a-service operation observed targeting multiple critical infrastructure sectors.',
    mitreId: 'G0112',
    mitreUrl: 'https://attack.mitre.org/groups/G0112',
    techniques: [],
    software: [],
    targetSectors: ['Transportation', 'Healthcare', 'Government'],
    targetCountries: ['Global', 'Germany', 'United States'],
    linkedIncidentIds: ['inc-p2-1']
  },
  {
    id: 'actor-volt-typhoon',
    name: 'Volt Typhoon',
    aliases: ['BRONZE SILHOUETTE', 'Vanguard Panda'],
    description: 'State-sponsored threat actor focused on cyber espionage and living-off-the-land techniques.',
    mitreId: 'G1017',
    mitreUrl: 'https://attack.mitre.org/groups/G1017',
    techniques: [],
    software: [],
    targetSectors: ['Critical Infrastructure', 'Telecommunications'],
    targetCountries: ['United States'],
    linkedIncidentIds: []
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
    epssScore: 0.94,
    references: [],
    lastModified: '2026-10-09'
  }
];

const mockStatuses = [
  {
    id: 'bleepingcomputer',
    name: 'BleepingComputer',
    url: 'https://example.com/feed',
    trustTier: 2,
    status: 'healthy',
    lastSuccess: '2026-10-10T10:00:00Z',
    lastAttempt: '2026-10-10T10:00:00Z',
    latencyMs: 120,
    itemCount: 2,
    consecutiveFailures: 0,
    license: 'Public Editorial RSS',
    uptime7DaysPercent: 100
  }
];

const mockGeoData = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'DEU',
      properties: { name: 'Germany' },
      geometry: { type: 'Polygon', coordinates: [[[10, 50], [11, 50], [11, 51], [10, 50]]] }
    },
    {
      type: 'Feature',
      id: 'FRA',
      properties: { name: 'France' },
      geometry: { type: 'Polygon', coordinates: [[[2, 46], [3, 46], [3, 47], [2, 46]]] }
    }
  ]
};

describe('Phase 2 Intelligence Views Integration Tests', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      let data: any = [];
      if (url.includes('incidents.json')) data = mockIncidents;
      else if (url.includes('actors.json')) data = mockActors;
      else if (url.includes('vulnerabilities.json')) data = mockVulns;
      else if (url.includes('source-status.json')) data = mockStatuses;
      else if (url.includes('clusters.json')) data = [];
      else if (url.includes('indicators.json')) data = [];
      else if (url.includes('meta.json')) data = { incidentCount: 2, actorCount: 2 };
      else if (url.includes('world-110m.json')) data = mockGeoData;

      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(data)
      });
    }));
  });

  it('renders Analytics view with time filters, volume histogram, and bias disclosure', async () => {
    render(
      <DataProvider>
        <Router>
          <Analytics />
        </Router>
      </DataProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Threat Analytics & Trends/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Total Incidents Sampled/i)).toBeInTheDocument();
    expect(screen.getByText(/Incident Volume Timeline/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Threat Vector Distribution/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Impacted Industry Sectors/i)).toBeInTheDocument();
    expect(screen.getByText(/Data Limitations & Bias/i)).toBeInTheDocument();

    // Verify time range buttons
    const past7d = screen.getByText(/Past 7d/i);
    expect(past7d).toBeInTheDocument();
    fireEvent.click(past7d);
  });

  it('renders Threat Actors view, filters groups, and opens profile modal with attribution level', async () => {
    render(
      <DataProvider>
        <Router>
          <ThreatActors />
        </Router>
      </DataProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Threat Actors & ATT&CK Groups/i)).toBeInTheDocument();
    });

    expect(screen.getAllByText(/LockBit/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Volt Typhoon/i)).toBeInTheDocument();
    expect(screen.getByText(/MITRE G0112/i)).toBeInTheDocument();

    // Filter by search
    const searchInput = screen.getByPlaceholderText(/Search by actor name/i);
    fireEvent.change(searchInput, { target: { value: 'Typhoon' } });

    expect(screen.getByText(/Volt Typhoon/i)).toBeInTheDocument();
    expect(screen.queryByText(/LockBit 3.0/i)).not.toBeInTheDocument();

    // Reset search and click Profile
    fireEvent.change(searchInput, { target: { value: '' } });
    const profileBtns = screen.getAllByRole('button', { name: /Profile/i });
    fireEvent.click(profileBtns[0]);

    // Profile modal should display details and attribution safeguard
    await waitFor(() => {
      expect(screen.getByText(/Threat Group Profile/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Close/i)).toBeInTheDocument();
  });

  it('renders Briefing Center, switches TLP marking, and formats executive summary', async () => {
    render(
      <DataProvider>
        <Router>
          <BriefingCenter />
        </Router>
      </DataProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Intelligence Briefing Center/i)).toBeInTheDocument();
    });

    // Default TLP is TLP:CLEAR
    expect(screen.getAllByText(/TLP:CLEAR/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Recipients may share this briefing with the public without restriction/i)).toBeInTheDocument();

    // Switch to TLP:AMBER
    const amberBtn = screen.getByRole('button', { name: 'TLP:AMBER' });
    fireEvent.click(amberBtn);

    expect(screen.getByText(/Recipients may only share with members of their own organization on need-to-know/i)).toBeInTheDocument();

    // Verify executive sections
    expect(screen.getByText(/1.0 Executive Summary/i)).toBeInTheDocument();
    expect(screen.getByText(/2.0 Key Threat Incidents/i)).toBeInTheDocument();
    expect(screen.getByText(/3.0 Active Exploitation Watchlist/i)).toBeInTheDocument();
    expect(screen.getByText(/4.0 Strategic Defensive Recommendations/i)).toBeInTheDocument();
  });

  it('renders Global Threat Map and toggles to accessible country incident table', async () => {
    render(
      <DataProvider>
        <Router>
          <GlobalThreatMap />
        </Router>
      </DataProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Global Threat & Victim Map/i)).toBeInTheDocument();
    });

    // Verify Attribution Safeguard Notice
    expect(screen.getByText(/Strict Attribution Protocol/i)).toBeInTheDocument();

    // Toggle to accessible table view
    const tableToggle = screen.getByRole('button', { name: /Country Table/i });
    fireEvent.click(tableToggle);

    await waitFor(() => {
      expect(screen.getByText(/Country-Level Incident Distribution \(Accessible Table\)/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Germany/i)).toBeInTheDocument();
    expect(screen.getByText(/France/i)).toBeInTheDocument();
  });
});
