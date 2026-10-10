import { describe, it, expect } from 'vitest';
import { extractVictimCountry } from '../../src/pipeline/gazetteer';
import { stripHtml, isValidHttpUrl, sanitizeUrl } from '../../src/pipeline/sanitizer';

describe('Gazetteer & Location Extraction', () => {
  it('extracts victim country with evidence text snippet', () => {
    const loc = extractVictimCountry('Ransomware attack causes outages across hospitals in London, United Kingdom.');
    expect(loc).toBeDefined();
    expect(loc?.country).toBe('United Kingdom');
    expect(loc?.countryCode).toBe('GB');
    expect(loc?.evidenceText).toContain('United Kingdom');
  });

  it('returns undefined if text has no verified geographic location (no guessing!)', () => {
    const loc = extractVictimCountry('Zero-day vulnerability discovered in Apache Web Server.');
    expect(loc).toBeUndefined();
  });
});

describe('Sanitizer & URL Validation', () => {
  it('strips HTML tags and removes script tags completely', () => {
    const dirty = '<p>Security breach detected. <script>alert("xss")</script> Details follow.</p>';
    expect(stripHtml(dirty)).toBe('Security breach detected. Details follow.');
  });

  it('validates HTTP and HTTPS URLs and rejects javascript: schemes', () => {
    expect(isValidHttpUrl('https://cisa.gov/advisories')).toBe(true);
    expect(isValidHttpUrl('http://insecure.site.com')).toBe(true);
    expect(isValidHttpUrl('javascript:alert(1)')).toBe(false);
    expect(sanitizeUrl('javascript:alert(1)')).toBe('#');
  });
});
