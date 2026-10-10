export interface RegisteredSource {
  id: string;
  name: string;
  type: 'cisa_kev' | 'cisa_advisories' | 'cert_rss' | 'news_rss' | 'ransomware_live' | 'abuse_ch_ioc' | 'mitre_attack' | 'nvd_api' | 'epss_api';
  format: 'json' | 'rss' | 'stix';
  url: string;
  trustTier: 1 | 2 | 3;
  refreshIntervalHours: number;
  enabled: boolean;
  requiresKey: boolean;
  keyEnvVar?: string;
  licenseNote: string;
  termsUrl: string;
}

export const SOURCE_REGISTRY: RegisteredSource[] = [
  {
    id: 'cisa-kev',
    name: 'CISA Known Exploited Vulnerabilities (KEV)',
    type: 'cisa_kev',
    format: 'json',
    url: 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json',
    trustTier: 1,
    refreshIntervalHours: 2,
    enabled: true,
    requiresKey: false,
    licenseNote: 'U.S. Government Public Domain / CISA Policy',
    termsUrl: 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog'
  },
  {
    id: 'cisa-advisories',
    name: 'CISA Cybersecurity Advisories & Alerts',
    type: 'cisa_advisories',
    format: 'rss',
    url: 'https://www.cisa.gov/cybersecurity-advisories/all.xml',
    trustTier: 1,
    refreshIntervalHours: 2,
    enabled: true,
    requiresKey: false,
    licenseNote: 'U.S. Government Public Domain',
    termsUrl: 'https://www.cisa.gov/cybersecurity-advisories'
  },
  {
    id: 'ncsc-uk',
    name: 'UK National Cyber Security Centre (NCSC)',
    type: 'cert_rss',
    format: 'rss',
    url: 'https://www.ncsc.gov.uk/api/1/services/v1/report-rss-feed.xml',
    trustTier: 1,
    refreshIntervalHours: 2,
    enabled: true,
    requiresKey: false,
    licenseNote: 'Open Government Licence v3.0 (Crown Copyright)',
    termsUrl: 'https://www.ncsc.gov.uk/'
  },
  {
    id: 'cert-fr',
    name: 'CERT-FR (ANSSI Government Alerts)',
    type: 'cert_rss',
    format: 'rss',
    url: 'https://www.cert.ssi.gouv.fr/feed/',
    trustTier: 1,
    refreshIntervalHours: 2,
    enabled: true,
    requiresKey: false,
    licenseNote: 'French Public Sector Information / ANSSI',
    termsUrl: 'https://www.cert.ssi.gouv.fr/'
  },
  {
    id: 'sans-isc',
    name: 'SANS Internet Storm Center (ISC)',
    type: 'news_rss',
    format: 'rss',
    url: 'https://isc.sans.edu/rssfeed.xml',
    trustTier: 2,
    refreshIntervalHours: 2,
    enabled: true,
    requiresKey: false,
    licenseNote: 'Free Public RSS Feed / SANS Institute',
    termsUrl: 'https://isc.sans.edu/'
  },
  {
    id: 'bleepingcomputer',
    name: 'BleepingComputer Security News',
    type: 'news_rss',
    format: 'rss',
    url: 'https://www.bleepingcomputer.com/feed/',
    trustTier: 2,
    refreshIntervalHours: 2,
    enabled: true,
    requiresKey: false,
    licenseNote: 'Public RSS / Editorial News Attribution',
    termsUrl: 'https://www.bleepingcomputer.com/'
  },
  {
    id: 'thehackernews',
    name: 'The Hacker News',
    type: 'news_rss',
    format: 'rss',
    url: 'https://feeds.feedburner.com/TheHackersNews',
    trustTier: 2,
    refreshIntervalHours: 2,
    enabled: true,
    requiresKey: false,
    licenseNote: 'Public RSS / Editorial News Attribution',
    termsUrl: 'https://thehackernews.com/'
  },
  {
    id: 'krebsonsecurity',
    name: 'Krebs on Security',
    type: 'news_rss',
    format: 'rss',
    url: 'https://krebsonsecurity.com/feed/',
    trustTier: 2,
    refreshIntervalHours: 2,
    enabled: true,
    requiresKey: false,
    licenseNote: 'Public RSS / Brian Krebs',
    termsUrl: 'https://krebsonsecurity.com/'
  },
  {
    id: 'securityweek',
    name: 'SecurityWeek',
    type: 'news_rss',
    format: 'rss',
    url: 'https://www.securityweek.com/feed/',
    trustTier: 2,
    refreshIntervalHours: 2,
    enabled: true,
    requiresKey: false,
    licenseNote: 'Public RSS / Wired Business Media',
    termsUrl: 'https://www.securityweek.com/'
  },
  {
    id: 'ransomware-live',
    name: 'Ransomware.live Extortion Leak-Site Tracking',
    type: 'ransomware_live',
    format: 'json',
    url: 'https://data.ransomware.live/posts.json',
    trustTier: 3,
    refreshIntervalHours: 2,
    enabled: true,
    requiresKey: false,
    licenseNote: 'CC BY-SA 4.0 / Open Ransomware Research Project',
    termsUrl: 'https://www.ransomware.live/'
  },
  {
    id: 'feodo-tracker',
    name: 'abuse.ch Feodo Tracker C2 Blocklist',
    type: 'abuse_ch_ioc',
    format: 'json',
    url: 'https://feodotracker.abuse.ch/downloads/ipblocklist_recommended.json',
    trustTier: 1,
    refreshIntervalHours: 2,
    enabled: true,
    requiresKey: false,
    licenseNote: 'CC0 1.0 Universal (Public Domain) / abuse.ch',
    termsUrl: 'https://feodotracker.abuse.ch/'
  },
  {
    id: 'threatfox',
    name: 'abuse.ch ThreatFox IOC Feed',
    type: 'abuse_ch_ioc',
    format: 'json',
    url: 'https://threatfox.abuse.ch/export/json/recent/',
    trustTier: 1,
    refreshIntervalHours: 2,
    enabled: true,
    requiresKey: false,
    licenseNote: 'CC0 1.0 Universal (Public Domain) / abuse.ch',
    termsUrl: 'https://threatfox.abuse.ch/'
  },
  {
    id: 'mitre-attack',
    name: 'MITRE ATT&CK Enterprise STIX 2.1',
    type: 'mitre_attack',
    format: 'stix',
    url: 'https://raw.githubusercontent.com/mitre-attack/attack-stix-data/master/enterprise-attack/enterprise-attack.json',
    trustTier: 1,
    refreshIntervalHours: 24,
    enabled: true,
    requiresKey: false,
    licenseNote: 'MITRE ATT&CK Terms of Use (Permitted Open Access)',
    termsUrl: 'https://attack.mitre.org/resources/terms-of-use/'
  },
  {
    id: 'first-epss',
    name: 'FIRST Exploit Prediction Scoring System (EPSS)',
    type: 'epss_api',
    format: 'json',
    url: 'https://api.first.org/data/v1/epss',
    trustTier: 1,
    refreshIntervalHours: 24,
    enabled: true,
    requiresKey: false,
    licenseNote: 'FIRST.Org Special Interest Group Terms',
    termsUrl: 'https://www.first.org/epss/'
  },
  {
    id: 'nvd-cve',
    name: 'NVD CVE API 2.0 (Targeted Enrichment)',
    type: 'nvd_api',
    format: 'json',
    url: 'https://services.nvd.nist.gov/rest/json/cves/2.0',
    trustTier: 1,
    refreshIntervalHours: 24,
    enabled: true,
    requiresKey: false,
    keyEnvVar: 'NVD_API_KEY',
    licenseNote: 'U.S. National Institute of Standards and Technology (NIST)',
    termsUrl: 'https://nvd.nist.gov/'
  }
];
