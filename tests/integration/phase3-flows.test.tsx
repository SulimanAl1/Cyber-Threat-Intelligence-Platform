import { describe, it, expect, beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { HashRouter as Router } from 'react-router-dom';
import { DataProvider } from '../../src/context/DataContext';
import { Watchlists } from '../../src/pages/Watchlists';
import { IocLookup } from '../../src/pages/IocLookup';
import { CaseBoard } from '../../src/pages/CaseBoard';
import { CommandPalette } from '../../src/components/extras/CommandPalette';

const mockIncidents = [
  {
    id: 'inc-p3-1',
    title: 'Zero-Day Vulnerability in Edge Appliance',
    summary: 'Critical vulnerability CVE-2024-3400 exploited in the wild.',
    contentSnippet: 'Critical vulnerability CVE-2024-3400 exploited in the wild.',
    date: '2026-10-08',
    url: 'https://example.com/edge',
    sourceId: 'cisa-advisories',
    sourceName: 'CISA Cybersecurity Advisories',
    dataStatus: 'Confirmed',
    evidenceLevel: 'Confirmed',
    clusterId: 'cluster-p3-1',
    category: 'Exploited Vulnerability / Zero-Day',
    whyCategory: { rule: 'Zero-Day Rule', matchedKeywords: ['zero-day'] },
    targetOrg: 'Palo Alto Networks',
    sector: 'Technology',
    victimLocation: { country: 'United States', countryCode: 'US' },
    cves: ['CVE-2024-3400'],
    actors: [{ name: 'Volt Typhoon', attributionLevel: 'Confirmed' }],
    indicators: [
      { id: 'ind-p3-1', type: 'ip', raw: '198.51.100.1', defanged: '198[.]51[.]100[.]1' }
    ],
    priorityScore: 95,
    priorityFactors: {
      cisaKevPoints: 25,
      ransomwarePoints: 0,
      epssPoints: 15,
      cvssPoints: 20,
      evidencePoints: 10,
      corroborationPoints: 10,
      recencyDecay: 0,
      baseSum: 80,
      finalScore: 95,
      summary: 'Confirmed zero-day exploitation'
    },
    fetchedAt: '2026-10-08T12:00:00Z'
  }
];

const mockIndicators = [
  {
    id: 'ind-feodo-1',
    type: 'ip',
    value: '203.0.113.15',
    defangedValue: '203[.]0[.]113[.]15',
    raw: '203.0.113.15',
    defanged: '203[.]0[.]113[.]15',
    threatType: 'Botnet C2 Server',
    malware: 'QakBot',
    source: 'abuse.ch Feodo Tracker',
    firstSeen: '2026-10-09'
  }
];

describe('Phase 3 Analyst Tools Integration Tests', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      let data: any = [];
      if (url.includes('incidents.json')) data = mockIncidents;
      else if (url.includes('indicators.json')) data = mockIndicators;
      else if (url.includes('vulnerabilities.json')) data = [];
      else if (url.includes('actors.json')) data = [];
      else if (url.includes('source-status.json')) data = [];
      else if (url.includes('clusters.json')) data = [];
      else if (url.includes('meta.json')) data = { incidentCount: 1, indicatorCount: 1 };

      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(data)
      });
    }));
  });

  it('renders Watchlists view, evaluates rules, and creates a new alert rule', async () => {
    render(
      <DataProvider>
        <Router>
          <Watchlists />
        </Router>
      </DataProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Watchlists & Threat Alerts/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Active Watch Rules/i)).toBeInTheDocument();
    expect(screen.getByText(/Palo Alto Edge Devices/i)).toBeInTheDocument();

    // Open new rule modal
    const newRuleBtn = screen.getByRole('button', { name: /New Alert Rule/i });
    fireEvent.click(newRuleBtn);

    expect(screen.getByText(/Create Threat Watch Rule/i)).toBeInTheDocument();

    // Fill rule form
    const nameInput = screen.getByPlaceholderText(/e.g. Critical Fortinet Vulnerabilities/i);
    const valueInput = screen.getByPlaceholderText(/e.g. CVE-2024-3400/i);

    fireEvent.change(nameInput, { target: { value: 'Zero-Day Edge Rule' } });
    fireEvent.change(valueInput, { target: { value: 'CVE-2024-3400' } });

    const submitBtn = screen.getByRole('button', { name: /Save Rule/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getAllByText(/Zero-Day Edge Rule/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders Local IOC Lookup view with OPSEC guarantee and defanged indicators', async () => {
    render(
      <DataProvider>
        <Router>
          <IocLookup />
        </Router>
      </DataProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Local IOC & Hash Intelligence Lookup/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/OPSEC Privacy Guarantee/i)).toBeInTheDocument();
    expect(screen.getByText(/203\[\.\]0\[\.\]113\[\.\]15/i)).toBeInTheDocument();
    expect(screen.getByText(/QakBot/i)).toBeInTheDocument();
    expect(screen.getByText(/Botnet C2 Server/i)).toBeInTheDocument();
  });

  it('renders Case Board with comparison matrix and notes editor', async () => {
    render(
      <DataProvider>
        <Router>
          <CaseBoard />
        </Router>
      </DataProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Incident Case Board & Comparison/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Analyst Triage Notes/i)).toBeInTheDocument();
    expect(screen.getByText(/Side-by-Side Comparison Matrix/i)).toBeInTheDocument();

    // Edit notes
    const textarea = screen.getByPlaceholderText(/Document technical hypothesis/i);
    fireEvent.change(textarea, { target: { value: 'Hypothesis: Active exploitation campaign confirmed.' } });
    expect(textarea).toHaveValue('Hypothesis: Active exploitation campaign confirmed.');
  });

  it('renders Command Palette, executes search, and navigates', async () => {
    const handleClose = vi.fn();
    const handleSettings = vi.fn();

    render(
      <DataProvider>
        <Router>
          <CommandPalette isOpen={true} onClose={handleClose} onOpenSettings={handleSettings} />
        </Router>
      </DataProvider>
    );

    expect(screen.getByPlaceholderText(/Type a command/i)).toBeInTheDocument();
    expect(screen.getByText(/Platform Command Center/i)).toBeInTheDocument();

    // Filter commands
    const searchInput = screen.getByPlaceholderText(/Type a command/i);
    fireEvent.change(searchInput, { target: { value: 'Briefing' } });

    expect(screen.getByText(/Go to Intelligence Briefing Center/i)).toBeInTheDocument();

    // Press Escape to close
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalled();
  });
});
