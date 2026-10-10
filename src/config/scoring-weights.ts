export interface ScoringWeights {
  cisaKev: number;       // Points added if vulnerability is listed in CISA KEV (default: 25)
  knownRansomware: number; // Points added if known ransomware exploitation confirmed (default: 20)
  epssFactor: number;    // Points scaled by FIRST EPSS probability score (default: 15)
  cvssFactor: number;    // Points scaled by CVSS base score (default: 20)
  evidenceTier: number;  // Multiplier for evidence strength: Confirmed > Vendor-assessed > Reported > Claimed (default: 10)
  corroboration: number; // Points per independent corroborating source, max 10 (default: 10)
  recencyDecayDays: number; // Decay penalty for older items (default: 5)
}

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  cisaKev: 25,
  knownRansomware: 20,
  epssFactor: 15,
  cvssFactor: 20,
  evidenceTier: 10,
  corroboration: 10,
  recencyDecayDays: 5
};

export const STORAGE_KEY_SCORING_WEIGHTS = 'cs_dashboard_scoring_weights';

export function getActiveScoringWeights(): ScoringWeights {
  if (typeof window === 'undefined') return DEFAULT_SCORING_WEIGHTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SCORING_WEIGHTS);
    if (!raw) return DEFAULT_SCORING_WEIGHTS;
    return { ...DEFAULT_SCORING_WEIGHTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SCORING_WEIGHTS;
  }
}

export function saveActiveScoringWeights(weights: ScoringWeights): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_SCORING_WEIGHTS, JSON.stringify(weights));
}

export function resetScoringWeightsToDefault(): ScoringWeights {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY_SCORING_WEIGHTS);
  }
  return DEFAULT_SCORING_WEIGHTS;
}
