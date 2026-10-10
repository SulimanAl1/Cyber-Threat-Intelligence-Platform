/**
 * Defang indicators of compromise (IOCs) so they cannot be clicked or accidentally resolved.
 */
export function defangUrl(url: string): string {
  if (!url) return '';
  return url
    .replace(/^https?:\/\//i, (match) => match.toLowerCase().startsWith('https') ? 'hxxps://' : 'hxxp://')
    .replace(/\./g, '[.]');
}

export function defangIp(ip: string): string {
  if (!ip) return '';
  return ip.replace(/\./g, '[.]');
}

export function defangDomain(domain: string): string {
  if (!domain) return '';
  return domain.replace(/\./g, '[.]');
}

export function refang(defanged: string): string {
  if (!defanged) return '';
  return defanged
    .replace(/^hxxps:\/\//i, 'https://')
    .replace(/^hxxp:\/\//i, 'http://')
    .replace(/\[\.\]/g, '.');
}

export function defangIndicator(value: string, type: 'ip' | 'domain' | 'url' | 'hash' | 'cve'): string {
  switch (type) {
    case 'ip':
      return defangIp(value);
    case 'domain':
      return defangDomain(value);
    case 'url':
      return defangUrl(value);
    default:
      return value;
  }
}
