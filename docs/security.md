# Security Posture & Threat Model

**Author:** Cybersecurity Architecture Team  
**Review Standard:** SOC Security Architecture & Safe Development Lifecycle (SDL)

---

## 1. Threat Model & Countermeasures

| Threat Vector | Severity | Attack Mechanism | Implemented Countermeasure |
| :--- | :---: | :--- | :--- |
| **Untrusted Feed Injection (XSS)** | High | Malicious RSS feeds inject `<script>` tags, HTML attributes, or `javascript:` links into article titles or descriptions. | Strict sanitization: HTML tags stripped server-side, URLs validated against `http://` / `https://` allowlist, no `dangerouslySetInnerHTML`, links render with `rel="noopener noreferrer"`. |
| **Indicator Weaponization (Clickjacking / Drive-by)** | Medium | Malicious URLs or malware domains in reports clicked accidentally by SOC analysts. | Automated IOC defanging: all URLs converted to `hxxp(s)://`, domains converted to `domain[.]com`, IPs converted to `192[.]168[.]1[.]1`. Interactive copy button copies safe text. |
| **Data Poisoning & Tampering** | High | Tampered RSS or proxy MITM injecting fake critical alerts or false breach claims. | Removal of all public CORS proxies; ingestion restricted to GitHub Actions runner; strict Zod schema validation; data-status labels (`Claimed` for unverified extortion posts; `Confirmed` only for official advisories). |
| **Stale Data Outages** | Medium | Feed network failure causes dashboard to display empty charts or drop critical intelligence. | Last-good persistence in dedicated `data` branch; per-source failure isolation; automatic fallback with "Stale Data" visual indicators. |
| **Credential / Secret Leakage** | Critical | API keys or private tokens accidentally committed to repository. | Zero secrets required for operation; `.env.example` provided; `.gitignore` configured; automated secret scanning before release. |
| **Supply Chain Compromise** | High | Vulnerable or poisoned third-party npm packages. | Version pinning in `package.json`, locked `package-lock.json`, Dependabot configuration enabled, and regular `npm audit` execution. |

---

## 2. Content Security Policy (CSP)

The application embeds a strict Content-Security-Policy via HTML meta tag:

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data:;
  font-src 'self';
  connect-src 'self' https://api.first.org https://services.nvd.nist.gov;
  object-src 'none';
  base-uri 'self';
  form-action 'none';
">
```

- **`script-src 'self'`**: Disallows unsafe-inline and eval in production scripts.
- **`connect-src 'self'`**: Only allows same-origin requests (for static JSON snapshots) and optional direct requests to public FIRST/NVD APIs if user triggers a live refresh.
- **`object-src 'none'`**: Disables Flash, Java applets, and legacy plugin vectors.

---

## 3. GitHub Actions Least-Privilege Permissions

The CI/CD deployment workflow explicitly sets least-privilege permissions:

```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```

The data ingestion workflow uses:

```yaml
permissions:
  contents: write # Restricted to committing snapshot JSON to the dedicated data branch
```
