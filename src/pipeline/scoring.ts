import { EvidenceLevel, PriorityFactorBreakdown } from '../types/schemas';
import { ScoringWeights, DEFAULT_SCORING_WEIGHTS } from '../config/scoring-weights';

export interface ScoreCalculationInput {
  date: string;
  inKev?: boolean;
  knownRansomware?: boolean;
  epssScore?: number;
  cvssScore?: number;
  evidenceLevel: EvidenceLevel;
  sourceCount?: number;
}

export function calculatePriorityScore(
  input: ScoreCalculationInput,
  weights: ScoringWeights = DEFAULT_SCORING_WEIGHTS
): { score: number; factors: PriorityFactorBreakdown } {
  // 1. CISA KEV Points
  const cisaKevPoints = input.inKev ? weights.cisaKev : 0;

  // 2. Ransomware Exploitation Points
  const ransomwarePoints = input.knownRansomware ? weights.knownRansomware : 0;

  // 3. EPSS Probability Points
  const epssPoints = input.epssScore !== undefined
    ? Math.round(input.epssScore * weights.epssFactor)
    : 0;

  // 4. CVSS Severity Points (Normalized 0.0 - 10.0 to weights.cvssFactor)
  const cvssPoints = input.cvssScore !== undefined
    ? Math.round((Math.min(10, Math.max(0, input.cvssScore)) / 10) * weights.cvssFactor)
    : 0;

  // 5. Evidence Strength Points
  let evidenceMultiplier = 0.4;
  if (input.evidenceLevel === 'Confirmed') evidenceMultiplier = 1.0;
  else if (input.evidenceLevel === 'Vendor-assessed') evidenceMultiplier = 0.7;
  else if (input.evidenceLevel === 'Reported') evidenceMultiplier = 0.4;
  else if (input.evidenceLevel === 'Claimed') evidenceMultiplier = 0.2;
  else if (input.evidenceLevel === 'Keyword-mention') evidenceMultiplier = 0.1;

  const evidencePoints = Math.round(weights.evidenceTier * evidenceMultiplier);

  // 6. Source Corroboration Points
  const sources = Math.max(1, input.sourceCount || 1);
  const corroborationPoints = sources > 1
    ? Math.min(weights.corroboration, (sources - 1) * 3)
    : 0;

  // 7. Recency Decay (Penalty for older incidents)
  const today = new Date().getTime();
  const incDate = new Date(input.date).getTime();
  let recencyDecay = 0;
  if (!isNaN(incDate)) {
    const ageDays = Math.max(0, (today - incDate) / (1000 * 60 * 60 * 24));
    if (ageDays > 30) {
      recencyDecay = Math.min(20, Math.round((ageDays - 30) / 10) * weights.recencyDecayDays);
    } else if (ageDays > 14) {
      recencyDecay = Math.round(weights.recencyDecayDays / 2);
    }
  }

  const baseSum = cisaKevPoints + ransomwarePoints + epssPoints + cvssPoints + evidencePoints + corroborationPoints;
  const finalScore = Math.min(100, Math.max(5, baseSum - recencyDecay));

  const summary = `KEV: +${cisaKevPoints} | Ransomware: +${ransomwarePoints} | EPSS: +${epssPoints} | CVSS: +${cvssPoints} | Evidence (${input.evidenceLevel}): +${evidencePoints} | Corroboration (${sources} srcs): +${corroborationPoints} | Age Decay: -${recencyDecay} => Score ${finalScore}`;

  return {
    score: finalScore,
    factors: {
      cisaKevPoints,
      ransomwarePoints,
      epssPoints,
      cvssPoints,
      evidencePoints,
      corroborationPoints,
      recencyDecay,
      baseSum,
      finalScore,
      summary
    }
  };
}
