import { LocationEntity } from '../types/schemas';

interface CountryEntry {
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
  patterns: RegExp[];
}

const GAZETTEER: CountryEntry[] = [
  {
    country: 'United States',
    countryCode: 'US',
    lat: 37.0902,
    lng: -95.7129,
    patterns: [/\b(United States|USA|U\.S\.|American|Washington D\.C\.|California|Texas|Florida|New York)\b/i]
  },
  {
    country: 'United Kingdom',
    countryCode: 'GB',
    lat: 55.3781,
    lng: -3.4360,
    patterns: [/\b(United Kingdom|UK|U\.K\.|Britain|British|England|Scotland|London|NCSC)\b/i]
  },
  {
    country: 'United Arab Emirates',
    countryCode: 'AE',
    lat: 23.4241,
    lng: 53.8478,
    patterns: [/\b(United Arab Emirates|UAE|U\.A\.E\.|Abu Dhabi|Dubai|Sharjah|Emirati)\b/i]
  },
  {
    country: 'France',
    countryCode: 'FR',
    lat: 46.2276,
    lng: 2.2137,
    patterns: [/\b(France|French|Paris|ANSSI|CERT-FR)\b/i]
  },
  {
    country: 'Germany',
    countryCode: 'DE',
    lat: 51.1657,
    lng: 10.4515,
    patterns: [/\b(Germany|German|Berlin|BSI|Munich|Frankfurt)\b/i]
  },
  {
    country: 'Japan',
    countryCode: 'JP',
    lat: 36.2048,
    lng: 138.2529,
    patterns: [/\b(Japan|Japanese|Tokyo|Osaka|JPCERT)\b/i]
  },
  {
    country: 'Australia',
    countryCode: 'AU',
    lat: -25.2744,
    lng: 133.7751,
    patterns: [/\b(Australia|Australian|Canberra|Sydney|Melbourne|ASSC)\b/i]
  },
  {
    country: 'Canada',
    countryCode: 'CA',
    lat: 56.1304,
    lng: -106.3468,
    patterns: [/\b(Canada|Canadian|Ottawa|Toronto|Ontario|CCCS)\b/i]
  },
  {
    country: 'Saudi Arabia',
    countryCode: 'SA',
    lat: 23.8859,
    lng: 45.0792,
    patterns: [/\b(Saudi Arabia|KSA|Riyadh|Jeddah|Aramco)\b/i]
  },
  {
    country: 'Singapore',
    countryCode: 'SG',
    lat: 1.3521,
    lng: 103.8198,
    patterns: [/\b(Singapore|Singaporean|CSA Singapore)\b/i]
  },
  {
    country: 'Ukraine',
    countryCode: 'UA',
    lat: 48.3794,
    lng: 31.1656,
    patterns: [/\b(Ukraine|Ukrainian|Kyiv|CERT-UA)\b/i]
  },
  {
    country: 'India',
    countryCode: 'IN',
    lat: 20.5937,
    lng: 78.9629,
    patterns: [/\b(India|Indian|New Delhi|CERT-In|Mumbai|Bangalore)\b/i]
  },
  {
    country: 'South Korea',
    countryCode: 'KR',
    lat: 35.9078,
    lng: 127.7669,
    patterns: [/\b(South Korea|Korean|Seoul|KISA)\b/i]
  },
  {
    country: 'Netherlands',
    countryCode: 'NL',
    lat: 52.1326,
    lng: 5.2913,
    patterns: [/\b(Netherlands|Dutch|Amsterdam|The Hague|NCSC-NL)\b/i]
  },
  {
    country: 'Brazil',
    countryCode: 'BR',
    lat: -14.2350,
    lng: -51.9253,
    patterns: [/\b(Brazil|Brazilian|Brasilia|Sao Paulo)\b/i]
  }
];

export function extractVictimCountry(text: string): LocationEntity | undefined {
  if (!text) return undefined;

  for (const entry of GAZETTEER) {
    for (const pat of entry.patterns) {
      const match = text.match(pat);
      if (match) {
        // Extract a 60-character sentence context snippet for evidence transparency
        const idx = match.index || 0;
        const start = Math.max(0, idx - 20);
        const end = Math.min(text.length, idx + match[0].length + 40);
        const snippet = text.slice(start, end).replace(/\s+/g, ' ').trim();

        return {
          country: entry.country,
          countryCode: entry.countryCode,
          latitude: entry.lat,
          longitude: entry.lng,
          evidenceText: `Matched pattern "${match[0]}" in context: "...${snippet}..."`
        };
      }
    }
  }

  return undefined;
}
