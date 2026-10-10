import { describe, it, expect } from 'vitest';
import { calculatePriorityScore } from '../../src/pipeline/scoring';
import { DEFAULT_SCORING_WEIGHTS } from '../../src/config/scoring-weights';

describe('Priority Score Engine', () => {
  it('calculates higher score for CISA KEV + Ransomware + high CVSS', () => {
    const result = calculatePriorityScore({
      date: new Date().toISOString().split('T')[0],
      inKev: true,
      knownRansomware: true,
      cvssScore: 9.8,
      epssScore: 0.95,
      evidenceLevel: 'Confirmed',
      sourceCount: 3
    });

    expect(result.factors.cisaKevPoints).toBe(DEFAULT_SCORING_WEIGHTS.cisaKev); // 25
    expect(result.factors.ransomwarePoints).toBe(DEFAULT_SCORING_WEIGHTS.knownRansomware); // 20
    expect(result.factors.cvssPoints).toBe(20);
    expect(result.factors.evidencePoints).toBe(DEFAULT_SCORING_WEIGHTS.evidenceTier); // 10
    expect(result.score).toBeGreaterThanOrEqual(85);
    expect(result.factors.summary).toContain('KEV: +25');
  });

  it('calculates lower score for unverified claimed incident without KEV or CVSS', () => {
    const result = calculatePriorityScore({
      date: new Date().toISOString().split('T')[0],
      inKev: false,
      knownRansomware: false,
      evidenceLevel: 'Claimed',
      sourceCount: 1
    });

    expect(result.factors.cisaKevPoints).toBe(0);
    expect(result.factors.ransomwarePoints).toBe(0);
    expect(result.factors.corroborationPoints).toBe(0);
    expect(result.score).toBeLessThan(30);
  });

  it('applies recency decay penalty for old incidents', () => {
    const fresh = calculatePriorityScore({
      date: new Date().toISOString().split('T')[0],
      inKev: true,
      evidenceLevel: 'Confirmed'
    });

    const old = calculatePriorityScore({
      date: '2026-08-01', // ~70 days ago
      inKev: true,
      evidenceLevel: 'Confirmed'
    });

    expect(old.factors.recencyDecay).toBeGreaterThan(0);
    expect(old.score).toBeLessThan(fresh.score);
  });
});
