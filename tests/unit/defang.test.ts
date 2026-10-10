import { describe, it, expect } from 'vitest';
import { defangUrl, defangIp, defangDomain, refang, defangIndicator } from '../../src/pipeline/defang';

describe('Indicator Defanging Engine', () => {
  it('should defang HTTP and HTTPS URLs', () => {
    expect(defangUrl('http://malicious-c2.com/payload.exe')).toBe('hxxp://malicious-c2[.]com/payload[.]exe');
    expect(defangUrl('https://evil-site.org/login')).toBe('hxxps://evil-site[.]org/login');
  });

  it('should defang IPv4 addresses', () => {
    expect(defangIp('192.168.1.100')).toBe('192[.]168[.]1[.]100');
    expect(defangIp('10.0.0.1')).toBe('10[.]0[.]0[.]1');
  });

  it('should defang domain names', () => {
    expect(defangDomain('c2.adversary.ru')).toBe('c2[.]adversary[.]ru');
    expect(defangDomain('malware-domain.com')).toBe('malware-domain[.]com');
  });

  it('should refang defanged indicators', () => {
    expect(refang('hxxps://evil[.]com')).toBe('https://evil.com');
    expect(refang('192[.]168[.]1[.]1')).toBe('192.168.1.1');
  });

  it('should handle general indicator defanging by type', () => {
    expect(defangIndicator('1.2.3.4', 'ip')).toBe('1[.]2[.]3[.]4');
    expect(defangIndicator('test.org', 'domain')).toBe('test[.]org');
    expect(defangIndicator('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'hash'))
      .toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });
});
