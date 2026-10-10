import { ExtractedIndicator, StatedFinancialImpact } from '../types/schemas';
import { defangIndicator } from './defang';

const CVE_REGEX = /\bCVE-\d{4}-\d{4,7}\b/gi;
const IP_REGEX = /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g;
const HASH_SHA256_REGEX = /\b[a-f0-9]{64}\b/gi;
const HASH_MD5_REGEX = /\b[a-f0-9]{32}\b/gi;
const FINANCIAL_REGEX = /(?:\$|€|£|USD|EUR)\s?(\d+(?:\.\d+)?)\s*(million|billion|m|b|k)?|\b(\d+(?:\.\d+)?)\s*(?:million|billion)\s*(?:dollars|euros|pounds)\b/gi;

const SECTOR_PATTERNS: Array<{ sector: string; keywords: string[] }> = [
  { sector: 'Healthcare', keywords: ['hospital', 'clinic', 'healthcare', 'health system', 'medical center', 'patient records', 'pharmaceutical', 'biotech'] },
  { sector: 'Financial Services', keywords: ['bank', 'financial', 'fintech', 'credit union', 'hedge fund', 'clearinghouse', 'payment processor', 'crypto exchange'] },
  { sector: 'Government & Public Sector', keywords: ['government', 'ministry', 'municipality', 'city of', 'county', 'state department', 'federal agency', 'parliament'] },
  { sector: 'Energy & Utilities', keywords: ['power grid', 'utility', 'energy', 'electric', 'oil & gas', 'refinery', 'substation', 'nuclear', 'pipeline'] },
  { sector: 'Defense & Aerospace', keywords: ['defense contractor', 'aerospace', 'military', 'armed forces', 'pentagon', 'lockheed', 'boeing', 'weapon systems'] },
  { sector: 'Telecommunications', keywords: ['telecom', 'telecommunications', 'mobile network', 'isp', 'cellular', 'verizon', 'at&t', 'vodafone'] },
  { sector: 'Critical Manufacturing', keywords: ['manufacturing', 'semiconductor', 'automotive', 'industrial plant', 'assembly line', 'supply plant'] },
  { sector: 'Education & Research', keywords: ['university', 'college', 'school district', 'research institute', 'higher education', 'campus'] },
  { sector: 'Technology & Cloud', keywords: ['cloud provider', 'saas', 'software vendor', 'data center', 'api gateway', 'tech giant', 'hosting'] },
  { sector: 'Logistics & Transportation', keywords: ['logistics', 'shipping', 'cargo', 'airline', 'airport', 'railway', 'maritime', 'port authority'] }
];

export function extractCves(text: string): string[] {
  if (!text) return [];
  const matches = text.match(CVE_REGEX);
  if (!matches) return [];
  return Array.from(new Set(matches.map((c) => c.toUpperCase())));
}

export function extractFinancialImpact(text: string): StatedFinancialImpact | undefined {
  if (!text) return undefined;
  FINANCIAL_REGEX.lastIndex = 0;
  const match = FINANCIAL_REGEX.exec(text);
  if (!match) return undefined;

  const idx = match.index;
  const start = Math.max(0, idx - 40);
  const end = Math.min(text.length, idx + match[0].length + 50);
  const statedContext = text.slice(start, end).replace(/\s+/g, ' ').trim();

  return {
    amountText: match[0].trim(),
    detectedCurrency: match[0].includes('$') ? 'USD' : match[0].includes('€') ? 'EUR' : 'GBP',
    statedContext: `"...${statedContext}..."`
  };
}

export function extractSector(text: string): string | undefined {
  if (!text) return undefined;
  const lower = text.toLowerCase();

  for (const item of SECTOR_PATTERNS) {
    for (const kw of item.keywords) {
      if (lower.includes(kw)) {
        return item.sector;
      }
    }
  }

  return undefined;
}

export function extractIndicators(text: string): ExtractedIndicator[] {
  if (!text) return [];
  const results: ExtractedIndicator[] = [];

  // Extract IPs (filter out 127.0.0.1 and 0.0.0.0)
  const ips = text.match(IP_REGEX) || [];
  for (const ip of Array.from(new Set(ips))) {
    if (ip !== '127.0.0.1' && ip !== '0.0.0.0' && !ip.startsWith('255.')) {
      results.push({
        id: `ind-ip-${ip}`,
        type: 'ip',
        raw: ip,
        defanged: defangIndicator(ip, 'ip'),
        context: 'Extracted IPv4 address from threat narrative'
      });
    }
  }

  // Extract SHA256 hashes
  const sha256 = text.match(HASH_SHA256_REGEX) || [];
  for (const hash of Array.from(new Set(sha256))) {
    results.push({
      id: `ind-hash-${hash.slice(0, 10)}`,
      type: 'hash',
      raw: hash,
      defanged: hash,
      context: 'Extracted SHA-256 payload artifact'
    });
  }

  // Extract MD5 hashes (only if not already part of sha256)
  const md5 = text.match(HASH_MD5_REGEX) || [];
  for (const hash of Array.from(new Set(md5))) {
    if (!sha256.some((s) => s.includes(hash))) {
      results.push({
        id: `ind-hash-${hash.slice(0, 10)}`,
        type: 'hash',
        raw: hash,
        defanged: hash,
        context: 'Extracted MD5 artifact'
      });
    }
  }

  return results;
}
