# Data Source Evaluation and Verification Matrix

**Evaluation Date:** October 10, 2026  
**Auditor:** Threat Intelligence Engineering Team  
**Evaluation Standard:** Live network verification against production endpoints. No assumed uptime.

---

## 1. Summary of Evaluated Candidate Sources

| Source Name | Type / Format | Status | Latency | CORS Header | Trust Tier | Adopted / Dropped |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **CISA KEV** | JSON | **HTTP 200** | 533ms | `none` | Tier 1 (Confirmed) | **Adopted** (Ingest via GitHub Actions) |
| **NVD CVE API 2.0** | REST JSON | **HTTP 200** | 1664ms | `*` | Tier 1 (Confirmed) | **Adopted** (Targeted CVE enrichment) |
| **FIRST EPSS API** | REST JSON | **HTTP 200** | 513ms | `*` | Tier 1 (Probability) | **Adopted** (Targeted CVE enrichment) |
| **CISA Advisories (All)** | RSS 2.0 (XML) | **HTTP 200** | 354ms | `none` | Tier 1 (Confirmed) | **Adopted** (Replaces legacy NCAS URL) |
| **UK NCSC Advisories** | RSS 2.0 (XML) | **HTTP 200** | 438ms | `none` | Tier 1 (Confirmed) | **Adopted** |
| **CERT-FR (ANSSI)** | RSS 2.0 (XML) | **HTTP 200** | 390ms | `none` | Tier 1 (Confirmed) | **Adopted** (Active EU National CERT) |
| **SANS ISC Stories** | RSS 2.0 (XML) | **HTTP 200** | 1081ms | `none` | Tier 2 (Reported) | **Adopted** |
| **BleepingComputer** | RSS 2.0 (XML) | **HTTP 200** | 83ms | `none` | Tier 2 (Reported) | **Adopted** |
| **The Hacker News** | RSS 2.0 (XML) | **HTTP 200** | 821ms | `none` | Tier 2 (Reported) | **Adopted** |
| **Krebs on Security** | RSS 2.0 (XML) | **HTTP 200** | 701ms | `none` | Tier 2 (Reported) | **Adopted** |
| **SecurityWeek** | RSS 2.0 (XML) | **HTTP 200** | 788ms | `none` | Tier 2 (Reported) | **Adopted** |
| **Ransomware.live** | REST JSON | **HTTP 200** | 420ms | `none` | Tier 3 (Claimed) | **Adopted** (`data.ransomware.live/posts.json`) |
| **abuse.ch Feodo Tracker** | JSON | **HTTP 200** | 605ms | `none` | Tier 1 (IOC Feed) | **Adopted** (Botnet C2 IPs) |
| **abuse.ch ThreatFox** | JSON | **HTTP 200** | 189ms | `none` | Tier 1 (IOC Feed) | **Adopted** (Recent IOCs) |
| **MITRE ATT&CK STIX 2.1** | STIX JSON | **HTTP 200** | 64ms | `*` | Tier 1 (Reference) | **Adopted** (Official GitHub raw mirror) |
| **CERT-EU Legacy RSS** | RSS | **HTTP 404** | 630ms | `none` | N/A | **Dropped** (Replaced by CERT-FR & UK NCSC) |
| **UAE TDRA / aeCERT** | Web Portal | **HTTP 302/404** | 500ms | `none` | N/A | **Dropped** (No public unauthenticated RSS) |
| **ThreatPost Legacy** | RSS | **Archive** | 718ms | `*` | N/A | **Dropped** (Ceased operations in 2022) |
| **MalwareBazaar Recent**| JSON | **HTTP 404** | 310ms | `none` | N/A | **Dropped** (Legacy export endpoint retired) |

---

## 2. In-Depth Re-Check Findings

### 2.1. CERT-EU and EU Alternatives
- Checked: `https://cert.europa.eu/static/RSS/all.xml` (HTTP 404), `https://cert.europa.eu/feed` (HTTP 404), `https://cert.europa.eu/publications/security-advisories` (HTTP 404).
- Analysis: CERT-EU updated its website architecture; public RSS feeds have been deprecated in favor of authenticated portals.
- European Alternative Selected: **CERT-FR (ANSSI)** (`https://www.cert.ssi.gouv.fr/feed/`), which is HTTP 200, highly active (updated October 9, 2026), and provides verified, high-quality government security alerts.

### 2.2. UAE National CERT (aeCERT / TDRA)
- Checked: `https://tdra.gov.ae/en/services/cyber-security-advisories.xml`, `https://tdra.gov.ae/rss`, and `https://www.aecert.ae/rss.xml`.
- Result: Returns HTTP 302/404 redirects to bot verification challenges and session cookie barriers (`cow-prod-www-v3.azurewebsites.net`).
- Decision: Per architectural integrity rules (*"Never assume a source works. Drop or replace any source that fails. Never invent a source or endpoint"*), UAE CERT is noted in documentation as lacking a public unauthenticated feed and excluded from automated ingestion.

### 2.3. Ransomware.live Endpoint Discovery
- Initial candidate `https://api.ransomware.live/recentvictims` returned HTTP 404.
- Live probe discovered the official public feed endpoint: `https://data.ransomware.live/posts.json`.
- Live payload confirmed: contains real-time leak site entries (victim name, threat actor group, date published, website) with active October 2026 posts.
- Labeling rule: Labeled strictly as **`Claimed`** (attacker extortion claims, not verified breaches).

---

## 3. Raw Endpoint Verification Output

Below is the verbatim raw test output captured from the automated test probe executed on October 10, 2026:

```json
[
  {
    "id": "cisa-kev",
    "name": "CISA Known Exploited Vulnerabilities",
    "url": "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json",
    "status": 200,
    "latencyMs": 533,
    "contentType": "application/json",
    "cors": "none",
    "sizeBytes": 1777558,
    "snippet": "{ \"title\": \"CISA Catalog of Known Exploited Vulnerabilities\", \"catalogVersion\": \"2026.10.08\", \"dateReleased\": \"2026-10-08T20:09:18.9833Z\", \"count\": 1739, \"vulnerabilities\": [ { \"cveID\": \"CVE-2015-5477\", \"vendorProject\": \"ISC\", \"product\""
  },
  {
    "id": "nvd-cve",
    "name": "NVD CVE API 2.0 (Sample CVE)",
    "url": "https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=CVE-2024-3400",
    "status": 200,
    "latencyMs": 1664,
    "contentType": "application/json",
    "cors": "*",
    "sizeBytes": 14097,
    "snippet": "{\"resultsPerPage\":1,\"startIndex\":0,\"totalResults\":1,\"format\":\"NVD_CVE\",\"version\":\"2.0\",\"timestamp\":\"2026-10-10T09:17:40.796\",\"vulnerabilities\":[{\"cve\":{\"id\":\"CVE-2024-3400\",\"sourceIdentifier\":\"psirt@paloaltonetworks.com\",\"published\":\"2024-04-12T08:15:06.230\",\"lastModified\":\"2026-06-17T07:44:11.533\","
  },
  {
    "id": "first-epss",
    "name": "FIRST EPSS API",
    "url": "https://api.first.org/data/v1/epss?cve=CVE-2024-3400",
    "status": 200,
    "latencyMs": 513,
    "contentType": "application/json; charset=utf-8",
    "cors": "*",
    "sizeBytes": 202,
    "snippet": "{\"status\":\"OK\",\"status-code\":200,\"version\":\"1.0\",\"access\":\"public\",\"total\":1,\"offset\":0,\"limit\":100,\"data\":[{\"cve\":\"CVE-2024-3400\",\"epss\":\"0.999990000\",\"percentile\":\"1.000000000\",\"date\":\"2026-10-09\"}]} "
  },
  {
    "id": "cisa-advisories-new",
    "name": "CISA All Advisories RSS",
    "url": "https://www.cisa.gov/cybersecurity-advisories/all.xml",
    "status": 200,
    "latencyMs": 354,
    "contentType": "application/rss+xml; charset=utf-8",
    "cors": "none",
    "sizeBytes": 1242299,
    "snippet": "<?xml version=\"1.0\" encoding=\"utf-8\"?> <rss version=\"2.0\" xml:base=\"https://www.cisa.gov/\" xmlns:dc=\"http://purl.org/dc/elements/1.1/\"> <channel> <title>All CISA Advisories</title> <link>https://www.cisa.gov/</link> <description></description> <language>en</language> <item"
  },
  {
    "id": "ncsc-uk",
    "name": "UK NCSC RSS Feed",
    "url": "https://www.ncsc.gov.uk/api/1/services/v1/report-rss-feed.xml",
    "status": 200,
    "latencyMs": 438,
    "contentType": "application/rss+xml; charset=utf-8",
    "cors": "none",
    "sizeBytes": 10064,
    "snippet": "<?xml version=\"1.0\" encoding=\"utf-8\"?> <rss xmlns:dc=\"http://purl.org/dc/elements/1.1/\" version=\"2.0\" xml:base=\"https://www.ncsc.gov.uk/\"> <channel> <title>Report Feed</title> <link>https://www.ncsc.gov.uk/</link> <description>This includes feeds from report</description> <language"
  },
  {
    "id": "cert-fr",
    "name": "CERT-FR (ANSSI) Advisories Feed",
    "url": "https://www.cert.ssi.gouv.fr/feed/",
    "status": 200,
    "latencyMs": 390,
    "contentType": "application/xml",
    "cors": "none",
    "sizeBytes": 23141,
    "snippet": "<?xml version=\"1.0\" encoding=\"UTF-8\"?><rss version=\"2.0\" xmlns:atom=\"http://www.w3.org/2005/Atom\"><channel><title>CERT-FR</title><link>https://www.cert.ssi.gouv.fr/</link><description>Centre gouvernemental de veille, d'alerte et de réponse aux attaques informatiques</description>"
  },
  {
    "id": "sans-isc",
    "name": "SANS ISC Podcast/Stories RSS",
    "url": "https://isc.sans.edu/rssfeed.xml",
    "status": 200,
    "latencyMs": 1081,
    "contentType": "text/xml; charset=utf-8",
    "cors": "none",
    "sizeBytes": 8462,
    "snippet": "<?xml version=\"1.0\" encoding=\"UTF-8\"?> <?xml-stylesheet href=\"/css/rss.css\" type=\"text/css\"?> <rss version=\"2.0\" xmlns:content=\"http://purl.org/rss/1.0/modules/content/\" xmlns:wfw=\"http://wellformedweb.org/CommentAPI/\" xmlns:dc=\"http://purl.org/dc/elements/1.1/\" xmlns:atom=\"http://www.w3.org"
  },
  {
    "id": "bleepingcomputer",
    "name": "BleepingComputer RSS",
    "url": "https://www.bleepingcomputer.com/feed/",
    "status": 200,
    "latencyMs": 83,
    "contentType": "text/xml; charset=utf-8",
    "cors": "none",
    "sizeBytes": 13043,
    "snippet": "<?xml version=\"1.0\" encoding=\"utf-8\"?> <rss version=\"2.0\" xmlns:content=\"http://purl.org/rss/1.0/modules/content/\" xmlns:wfw=\"http://wellformedweb.org/CommentAPI/\" xmlns:dc=\"http://purl.org/dc/elements/1.1/\" xmlns:atom=\"http://www.w3.org/2005/Atom\" > "
  },
  {
    "id": "thehackernews",
    "name": "The Hacker News RSS",
    "url": "https://feeds.feedburner.com/TheHackersNews",
    "status": 200,
    "latencyMs": 821,
    "contentType": "text/xml; charset=utf-8",
    "cors": "none",
    "sizeBytes": 59396,
    "snippet": "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?><rss xmlns:atom=\"http://www.w3.org/2005/Atom\" xmlns:content=\"http://purl.org/rss/1.0/modules/content/\" xmlns:dc=\"http://purl.org/dc/elements/1.1/\" xmlns:itunes=\"http://www.itunes.com/dtds/podcast-1.0.dtd\" xmlns:media=\"http://search.yahoo.com/mrss"
  },
  {
    "id": "krebsonsecurity",
    "name": "Krebs on Security RSS",
    "url": "https://krebsonsecurity.com/feed/",
    "status": 200,
    "latencyMs": 701,
    "contentType": "application/rss+xml; charset=UTF-8",
    "cors": "none",
    "sizeBytes": 187934,
    "snippet": "<?xml version=\"1.0\" encoding=\"UTF-8\"?><rss version=\"2.0\" xmlns:content=\"http://purl.org/rss/1.0/modules/content/\" xmlns:wfw=\"http://wellformedweb.org/CommentAPI/\" xmlns:dc=\"http://purl.org/dc/elements/1.1/\" xmlns:atom=\"http://www.w3.org/2005/Atom\" xmlns:sy=\"http://purl.org/rss/1.0/modules/syndi"
  },
  {
    "id": "securityweek",
    "name": "SecurityWeek RSS",
    "url": "https://www.securityweek.com/feed/",
    "status": 200,
    "latencyMs": 788,
    "contentType": "application/rss+xml; charset=UTF-8",
    "cors": "none",
    "sizeBytes": 12346,
    "snippet": "<?xml version=\"1.0\" encoding=\"UTF-8\"?><rss version=\"2.0\" xmlns:content=\"http://purl.org/rss/1.0/modules/content/\" xmlns:wfw=\"http://wellformedweb.org/CommentAPI/\" xmlns:dc=\"http://purl.org/dc/elements/1.1/\" xmlns:atom=\"http://www.w3.org/2005/Atom\" xmlns:sy=\"http://purl.org/rss/1.0/modules/syndi"
  },
  {
    "id": "feodo-tracker",
    "name": "abuse.ch Feodo Tracker IP Blocklist JSON",
    "url": "https://feodotracker.abuse.ch/downloads/ipblocklist_recommended.json",
    "status": 200,
    "latencyMs": 605,
    "contentType": "application/json",
    "cors": "none",
    "sizeBytes": 362,
    "snippet": "[ { \"ip_address\": \"50.16.16.211\", \"port\": 443, \"status\": \"online\", \"hostname\": \"ec2-50-16-16-211.compute-1.amazonaws.com\", \"as_number\": 14618, \"as_name\": \"AMAZON-AES\", \"country\": \"US\", \"first_seen\": \"2025-12-30 13:56:31\", \"l"
  },
  {
    "id": "threatfox-recent",
    "name": "abuse.ch ThreatFox Recent JSON",
    "url": "https://threatfox.abuse.ch/export/json/recent/",
    "status": 200,
    "latencyMs": 189,
    "contentType": "application/json",
    "cors": "none",
    "sizeBytes": 4532052,
    "snippet": "{ \"1959887\": [ { \"ioc_value\": \"49.235.158.141:60000\", \"ioc_type\": \"ip:port\", \"threat_type\": \"botnet_cc\", \"malware\": \"win.cobalt_strike\", \"malware_alias\": \"Agentemis,BEACON,CobaltStrike,cobeacon\", \"malware_printable\":"
  },
  {
    "id": "mitre-attack-enterprise",
    "name": "MITRE ATT&CK STIX 2.1 (raw git)",
    "url": "https://raw.githubusercontent.com/mitre-attack/attack-stix-data/master/enterprise-attack/enterprise-attack.json",
    "status": 200,
    "latencyMs": 64,
    "contentType": "text/plain; charset=utf-8",
    "cors": "*",
    "sizeBytes": 53820541,
    "snippet": "{ \"type\": \"bundle\", \"id\": \"bundle--6198013c-6f02-42a4-9713-38ea1301a1aa\", \"objects\": [ { \"type\": \"x-mitre-collection\", \"id\": \"x-mitre-collection--1f5f1533-f617-4ca8-9ab4-6a02367fa019\", \"x_mitre_attack_spec_version\": \"3.3.0\", \"name\":"
  },
  {
    "id": "ransomware-live-data",
    "name": "Ransomware.live Data JSON",
    "url": "https://data.ransomware.live/posts.json",
    "status": 200,
    "latencyMs": 420,
    "contentType": "application/json",
    "cors": "none",
    "sizeBytes": 4821040,
    "snippet": "[ { \"post_title\": \"Saber1\", \"group_name\": \"Deadlock\", \"discovered\": \"2026-10-09T22:51:48.912828+00:00\", \"published\": \"2026-10-09T22:51:47.778927+00:00\", \"website\": \"...\" } ]"
  }
]
```
