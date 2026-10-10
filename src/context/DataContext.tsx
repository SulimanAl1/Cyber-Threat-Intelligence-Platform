import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  Incident,
  EventCluster,
  Vulnerability,
  ThreatActor,
  Indicator,
  SourceStatus,
  Meta
} from '../types/schemas';
import {
  ScoringWeights,
  getActiveScoringWeights,
  saveActiveScoringWeights,
  resetScoringWeightsToDefault
} from '../config/scoring-weights';

interface DataContextType {
  incidents: Incident[];
  clusters: EventCluster[];
  vulnerabilities: Vulnerability[];
  actors: ThreatActor[];
  indicators: Indicator[];
  sourceStatuses: SourceStatus[];
  meta: Meta | null;
  isLoading: boolean;
  error: string | null;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  scoringWeights: ScoringWeights;
  updateScoringWeights: (weights: ScoringWeights) => void;
  resetScoringWeights: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isStale: boolean;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [clusters, setClusters] = useState<EventCluster[]>([]);
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [actors, setActors] = useState<ThreatActor[]>([]);
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [sourceStatuses, setSourceStatuses] = useState<SourceStatus[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('cs_theme') as 'dark' | 'light') || 'dark';
    }
    return 'dark';
  });

  const [scoringWeights, setScoringWeights] = useState<ScoringWeights>(getActiveScoringWeights());

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('cs_theme', next);
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const updateScoringWeights = (newWeights: ScoringWeights) => {
    setScoringWeights(newWeights);
    saveActiveScoringWeights(newWeights);
  };

  const resetScoringWeights = () => {
    const defaults = resetScoringWeightsToDefault();
    setScoringWeights(defaults);
  };

  const loadSnapshots = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
      const fetchJson = async <T,>(filename: string): Promise<T> => {
        const res = await fetch(`${base}/data/${filename}`);
        if (!res.ok) throw new Error(`Failed to load ${filename}: HTTP ${res.status}`);
        return res.json();
      };

      const [incRes, clRes, vulnRes, actRes, indRes, statRes, metaRes] = await Promise.all([
        fetchJson<Incident[]>('incidents.json'),
        fetchJson<EventCluster[]>('clusters.json'),
        fetchJson<Vulnerability[]>('vulnerabilities.json'),
        fetchJson<ThreatActor[]>('actors.json'),
        fetchJson<Indicator[]>('indicators.json'),
        fetchJson<SourceStatus[]>('source-status.json'),
        fetchJson<Meta>('meta.json')
      ]);

      setIncidents(incRes);
      setClusters(clRes);
      setVulnerabilities(vulnRes);
      setActors(actRes);
      setIndicators(indRes);
      setSourceStatuses(statRes);
      setMeta(metaRes);
    } catch (err: any) {
      console.error('Failed to load threat intel snapshots:', err);
      setError(err.message || 'Error loading data snapshots');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSnapshots();
  }, []);

  const isStale = useMemo(() => {
    if (!meta) return false;
    const genTime = new Date(meta.generatedAt).getTime();
    const now = Date.now();
    // Stale if snapshot is over 6 hours old
    return (now - genTime) > (6 * 60 * 60 * 1000);
  }, [meta]);

  return (
    <DataContext.Provider
      value={{
        incidents,
        clusters,
        vulnerabilities,
        actors,
        indicators,
        sourceStatuses,
        meta,
        isLoading,
        error,
        theme,
        toggleTheme,
        scoringWeights,
        updateScoringWeights,
        resetScoringWeights,
        searchQuery,
        setSearchQuery,
        isStale,
        refreshData: loadSnapshots
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
};
