import { IncidentCategory } from '../types/schemas';

export interface ClassificationResult {
  category: IncidentCategory;
  whyCategory: {
    rule: string;
    matchedKeywords: string[];
  };
}

export interface NoiseCheckResult {
  isNoise: boolean;
  reason?: string;
  matchedNoiseTerms: string[];
}

const CATEGORY_RULES: Array<{
  category: IncidentCategory;
  name: string;
  keywords: string[];
}> = [
  {
    category: 'Ransomware',
    name: 'Ransomware & Extortion Indicator Rule',
    keywords: ['ransomware', 'ransom', 'extortion', 'double extortion', 'lockbit', 'blackcat', 'alphv', 'qilin', 'clop', 'cl0p', 'play ransomware', 'rhysida', 'encryptor', 'leak site']
  },
  {
    category: 'Exploited Vulnerability',
    name: 'Vulnerability & Exploit Activity Rule',
    keywords: ['zero-day', '0-day', 'actively exploited', 'cve-', 'cisa kev', 'remote code execution', 'rce', 'privilege escalation', 'proof-of-concept', 'flaw exploited', 'vulnerability patched']
  },
  {
    category: 'Supply Chain',
    name: 'Supply Chain Compromise Rule',
    keywords: ['supply chain', 'npm package', 'pypi', 'solarwinds', 'moveit', 'dependency confusion', 'third-party compromise', 'vendor compromise', 'backdoored library']
  },
  {
    category: 'Critical Infrastructure',
    name: 'Critical Infrastructure & ICS/SCADA Rule',
    keywords: ['critical infrastructure', 'ics', 'scada', 'operational technology', 'substation', 'power grid', 'water facility', 'pipeline', 'plc', 'modbus', 'siemens', 'schneider electric']
  },
  {
    category: 'APT / Espionage',
    name: 'Nation-State & Advanced Persistent Threat Rule',
    keywords: ['apt', 'cyber espionage', 'nation-state', 'state-sponsored', 'lazarus', 'sandworm', 'midnight blizzard', 'apt28', 'apt29', 'volt typhoon', 'salt typhoon', 'fancy bear', 'cozy bear', 'charmin kitten']
  },
  {
    category: 'DDoS',
    name: 'Distributed Denial of Service Rule',
    keywords: ['ddos', 'denial of service', 'syn flood', 'amplification attack', 'http flood', 'volumetric attack', 'botnet ddos', 'killnet', 'anonymous sudan']
  },
  {
    category: 'Phishing / Credential Theft',
    name: 'Phishing & Credential Compromise Rule',
    keywords: ['phishing', 'spear phishing', 'credential harvesting', 'bec', 'business email compromise', 'sim swap', 'credential stuffing', 'mfa fatigue', 'session hijacking']
  },
  {
    category: 'Malware / Botnet',
    name: 'Malware & Botnet C2 Rule',
    keywords: ['malware', 'botnet', 'infostealer', 'trojan', 'backdoor', 'c2', 'command and control', 'loader', 'redline', 'lumma', 'asyncrat', 'cobalt strike', 'agent tesla']
  },
  {
    category: 'Data Breach',
    name: 'Unauthorized Access & Exfiltration Rule',
    keywords: ['data breach', 'exfiltration', 'stolen records', 'database leaked', 'exposed database', 'unauthorized access', 'pii leak', 'customer records', 'dumped online']
  }
];

const NOISE_TERMS = [
  'webinar', 'podcast', 'episode', 'hiring', 'job opening', 'salary report',
  'sponsored post', 'promoted:', 'market forecast', 'stock price', 'quarterly earnings',
  'product launch', 'press release', 'awards ceremony', 'partnership announcement',
  'book review', 'opinion:', 'how to choose a firewall'
];

export function checkNoise(text: string): NoiseCheckResult {
  const lower = text.toLowerCase();
  const matched: string[] = [];

  for (const term of NOISE_TERMS) {
    if (lower.includes(term)) {
      matched.push(term);
    }
  }

  if (matched.length > 0) {
    return {
      isNoise: true,
      reason: `Matched noise filter terms: ${matched.join(', ')}`,
      matchedNoiseTerms: matched
    };
  }

  return {
    isNoise: false,
    matchedNoiseTerms: []
  };
}

export function classifyIncident(title: string, summary: string): ClassificationResult {
  const combined = `${title} ${summary}`.toLowerCase();

  for (const rule of CATEGORY_RULES) {
    const matched = rule.keywords.filter((kw) => combined.includes(kw));
    if (matched.length > 0) {
      return {
        category: rule.category,
        whyCategory: {
          rule: rule.name,
          matchedKeywords: matched
        }
      };
    }
  }

  return {
    category: 'General Cyber Incident',
    whyCategory: {
      rule: 'Default Generic Heuristic',
      matchedKeywords: ['cyber security context']
    }
  };
}
