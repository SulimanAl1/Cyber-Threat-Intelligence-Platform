import { describe, it, expect } from 'vitest';
import { evaluateAttribution } from '../../src/pipeline/attribution';

describe('Evidence-Based Attribution Engine', () => {
  it('must NEVER attribute a threat actor from keyword-only mention', () => {
    // In this news report, LockBit is only mentioned as background context, not the perpetrator
    const result = evaluateAttribution({
      title: 'Global organizations patch systems following LockBit disruption',
      summary: 'Authorities noted that while LockBit was targeted last year, unpatched software remains dangerous.',
      sourceType: 'news_rss',
      sourceTrustTier: 2
    });

    expect(result.actors.length).toBe(1);
    expect(result.actors[0].name).toBe('LockBit');
    // Critical requirement: MUST BE Keyword-mention, NEVER Confirmed or Attributed!
    expect(result.actors[0].attributionLevel).toBe('Keyword-mention');
    expect(result.overallEvidenceLevel).toBe('Reported');
  });

  it('correctly labels official CERT or CISA alerts as Confirmed attribution', () => {
    const result = evaluateAttribution({
      title: 'CISA Advisory: Cyber activity conducted by APT29 targeting cloud services',
      summary: 'Technical analysis attributed to APT29 / Midnight Blizzard with indicators of compromise.',
      sourceType: 'cisa_advisories',
      sourceTrustTier: 1
    });

    expect(result.actors.length).toBe(1);
    expect(result.actors[0].name).toBe('APT29');
    expect(result.actors[0].attributionLevel).toBe('Confirmed');
    expect(result.overallEvidenceLevel).toBe('Confirmed');
    expect(result.suggestedDataStatus).toBe('Confirmed');
  });

  it('correctly labels named security vendor reports as Vendor-assessed', () => {
    const result = evaluateAttribution({
      title: 'Mandiant researchers attribute new campaign to Lazarus Group',
      summary: 'According to Mandiant threat intelligence report, the activity aligns with North Korean state actors.',
      sourceType: 'news_rss',
      sourceTrustTier: 2
    });

    expect(result.actors.length).toBe(1);
    expect(result.actors[0].name).toBe('Lazarus Group');
    expect(result.actors[0].attributionLevel).toBe('Vendor-assessed');
    expect(result.overallEvidenceLevel).toBe('Vendor-assessed');
  });

  it('labels ransomware leak site extortion claims strictly as Claimed', () => {
    const result = evaluateAttribution({
      title: 'Extortion posting on dark web leak portal',
      summary: 'LockBit 3.0 claims data exfiltration from healthcare provider.',
      sourceType: 'ransomware_live',
      sourceTrustTier: 3
    });

    expect(result.actors.length).toBe(1);
    expect(result.actors[0].attributionLevel).toBe('Claimed');
    expect(result.overallEvidenceLevel).toBe('Claimed');
    expect(result.suggestedDataStatus).toBe('Claimed');
  });
});
