import { promises as dns } from 'dns';
import { createPublicKey } from 'crypto';

export type DNSCheckResult = {
  status: 'success' | 'error' | 'not-configured' | 'advisory';
  value: string;
  details?: string;
};

const DNS_TIMEOUT = 5000; // 5 seconds timeout
const SPF_LOOKUP_LIMIT = 10;
const SPF_LOOKUP_WARN_THRESHOLD = 9;
const SPF_RECURSION_DEPTH = 10;

async function resolveTxtWithTimeout(hostname: string): Promise<string[][]> {
  let timeoutHandle: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => reject(new Error('DNS lookup timeout')), DNS_TIMEOUT);
  });

  try {
    const result = await Promise.race([
      dns.resolveTxt(hostname),
      timeoutPromise
    ]);
    return result;
  } catch (error) {
    if ((error as Error).message === 'DNS lookup timeout') {
      throw new Error('DNS lookup timed out after 5 seconds');
    }
    throw error;
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle);
  }
}

async function checkDKIM(domain: string, selector: string): Promise<DNSCheckResult> {
  try {
    const records = await resolveTxtWithTimeout(`${selector}._domainkey.${domain}`);
    const dkimRecord = records.flat().join(' ');

    if (!dkimRecord.includes('v=DKIM1')) {
      return {
        status: 'advisory',
        value: dkimRecord,
        details: 'Record found but missing v=DKIM1 tag'
      };
    }

    // Check for required DKIM tags
    const requiredTags = ['k=', 'p='];
    const missingTags = requiredTags.filter(tag => !dkimRecord.includes(tag));

    if (missingTags.length > 0) {
      return {
        status: 'advisory',
        value: dkimRecord,
        details: `Missing required tags: ${missingTags.join(', ')}`
      };
    }
const advisories: string[] = [];
    const summary: string[] = [];

    const keyInfo = parseDkimKey(dkimRecord);
    if (keyInfo.revoked) {
      advisories.push('Revoked key (p= is empty)');
    } else if (keyInfo.bits) {
      summary.push(`${keyInfo.bits}-bit ${keyInfo.algorithm ?? 'key'}`);
      if (keyInfo.bits < 1024) {
        advisories.push(`Key is only ${keyInfo.bits} bits (insecure, <1024)`);
      } else if (keyInfo.bits < 2048) {
        advisories.push(`Key is ${keyInfo.bits} bits (2048-bit recommended)`);
      }
    } else if (keyInfo.parseError) {
      advisories.push('Could not parse public key');
    }

    if (advisories.length > 0) {
      return {
        status: 'advisory',
        value: dkimRecord,
        details: [...summary, ...advisories].join('; '),
      };
    }

    return {
      status: 'success',
      value: dkimRecord,
      details: summary.join(', ') || undefined,
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOTFOUND' || (error as NodeJS.ErrnoException).code === 'ENODATA') {
      return {
        status: 'not-configured',
        value: '',
        details: 'No DKIM record found'
      };
    }
    if ((error as NodeJS.ErrnoException).code === 'ETIMEOUT') {
      return {
        status: 'error',
        value: '',
        details: 'DNS lookup timed out'
      };
    }
    return {
      status: 'error',
      value: '',
      details: (error as Error).message
    };
  }
}

type DkimKeyInfo = {
  bits: number | null;
  algorithm: string | null;
  revoked: boolean;
  parseError: boolean;
};

function parseDkimKey(record: string): DkimKeyInfo {
  const tags: Record<string, string> = {};
  for (const segment of record.split(';')) {
    const eq = segment.indexOf('=');
    if (eq === -1) continue;
    const key = segment.slice(0, eq).trim().toLowerCase();
    const value = segment.slice(eq + 1).trim();
    tags[key] = value;
  }

  const p = (tags.p ?? '').replace(/\s+/g, '');
  if (!p) {
    return { bits: null, algorithm: null, revoked: true, parseError: false };
  }

  const declaredType = (tags.k ?? 'rsa').toLowerCase(); // DKIM default is rsa
  try {
    const der = Buffer.from(p, 'base64');
    const pk = createPublicKey({ key: der, format: 'der', type: 'spki' });
    const details = pk.asymmetricKeyDetails ?? {};
    const algorithm = pk.asymmetricKeyType ?? declaredType;
    const bits = typeof details.modulusLength === 'number' ? details.modulusLength : null;
    return { bits, algorithm, revoked: false, parseError: bits === null && algorithm !== 'ed25519' };
  } catch {
    return { bits: null, algorithm: declaredType, revoked: false, parseError: true };
  }
}

// Mechanisms/modifiers that consume a DNS lookup under RFC 7208.
// `ip4`, `ip6`, and `all` do not count.
const LOOKUP_MECHANISMS = new Set(['a', 'mx', 'ptr', 'exists', 'include', 'redirect']);

function parseSpfMechanisms(record: string): string[] {
  return record.split(/\s+/).filter(Boolean).slice(1); // drop "v=spf1"
}

function getMechanismType(token: string): string | null {
  const stripped = token.replace(/^[+\-~?]/, '');
  if (stripped.includes('=')) {
    return stripped.split('=')[0].toLowerCase();
  }
  return stripped.split(':')[0].toLowerCase();
}

function getMechanismArg(token: string): string | null {
  const stripped = token.replace(/^[+\-~?]/, '');
  const eqIdx = stripped.indexOf('=');
  const colonIdx = stripped.indexOf(':');
  if (eqIdx !== -1) return stripped.slice(eqIdx + 1);
  if (colonIdx !== -1) return stripped.slice(colonIdx + 1);
  return null;
}

async function resolveSpfRecord(hostname: string): Promise<string | null> {
  try {
    const records = await resolveTxtWithTimeout(hostname);
    return records.flat().find(r => r.startsWith('v=spf1')) ?? null;
  } catch {
    return null;
  }
}

async function countSpfLookups(
  record: string,
  visited: Set<string> = new Set(),
  depth = 0
): Promise<number> {
  if (depth > SPF_RECURSION_DEPTH) return 0;

  const mechanisms = parseSpfMechanisms(record);
  let count = 0;
  const nested: Promise<number>[] = [];

  for (const token of mechanisms) {
    const type = getMechanismType(token);
    if (!type || !LOOKUP_MECHANISMS.has(type)) continue;

    count += 1;

    if (type === 'include' || type === 'redirect') {
      const target = getMechanismArg(token);
      if (!target) continue;
      const normalized = target.toLowerCase();
      if (visited.has(normalized)) continue;
      visited.add(normalized);

      nested.push(
        (async () => {
          const inner = await resolveSpfRecord(target);
          if (!inner) return 0;
          return countSpfLookups(inner, visited, depth + 1);
        })()
      );
    }
  }

  const sub = await Promise.all(nested);
  return count + sub.reduce((a, b) => a + b, 0);
}

function getAllQualifier(record: string): '+' | '-' | '~' | '?' | null {
  const mechanisms = parseSpfMechanisms(record);
  for (let i = mechanisms.length - 1; i >= 0; i--) {
    const token = mechanisms[i];
    const qualifier = /^[+\-~?]/.test(token) ? (token[0] as '+' | '-' | '~' | '?') : '+';
    const body = token.replace(/^[+\-~?]/, '').toLowerCase();
    if (body === 'all') return qualifier;
  }
  return null;
}

async function checkSPF(domain: string): Promise<DNSCheckResult> {
  try {
    const records = await resolveTxtWithTimeout(domain);
    const spfRecord = records.flat().find(record => record.startsWith('v=spf1'));

    if (!spfRecord) {
      return {
        status: 'not-configured',
        value: '',
        details: 'No SPF record found'
      };
    }

    const advisories: string[] = [];
    let worstStatus: DNSCheckResult['status'] = 'success';

    // Basic syntax check (non-fatal — recorded as advisory)
    if (!spfRecord.match(/v=spf1( [+\-~?]?(all|include:[^\s]+|ip4:[^\s]+|ip6:[^\s]+|a|mx|ptr|exists:[^\s]+|redirect=[^\s]+))*( [+\-~?]all)?$/)) {
      advisories.push('Non-standard SPF syntax');
      worstStatus = 'advisory';
    }

    // Recursive DNS-lookup count
    let lookupCount: number | null = null;
    try {
      lookupCount = await countSpfLookups(spfRecord, new Set([domain.toLowerCase()]));
    } catch {
      // Best effort — if counting fails we just omit this advisory
    }

    if (lookupCount !== null) {
      if (lookupCount > SPF_LOOKUP_LIMIT) {
        advisories.push(`Exceeds SPF 10 DNS lookup limit (${lookupCount} lookups)`);
        worstStatus = 'advisory';
      } else if (lookupCount >= SPF_LOOKUP_WARN_THRESHOLD) {
        advisories.push(`Approaching SPF lookup limit (${lookupCount}/10)`);
        worstStatus = 'advisory';
      }
    }

    // `all` qualifier check
    const qualifier = getAllQualifier(spfRecord);
    if (qualifier === '+') {
      advisories.push('Uses +all (allows any sender)');
      worstStatus = 'advisory';
    } else if (qualifier === '?') {
      advisories.push('Uses ?all (neutral, no enforcement)');
      worstStatus = 'advisory';
    } else if (qualifier === null) {
      advisories.push('Missing final "all" mechanism');
      worstStatus = 'advisory';
    }

    if (advisories.length > 0) {
      return {
        status: worstStatus,
        value: spfRecord,
        details: advisories.join('; '),
      };
    }

    return {
      status: 'success',
      value: spfRecord,
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOTFOUND' || (error as NodeJS.ErrnoException).code === 'ENODATA') {
      return {
        status: 'not-configured',
        value: '',
        details: 'Domain not found'
      };
    }
    if ((error as NodeJS.ErrnoException).code === 'ETIMEOUT') {
      return {
        status: 'error',
        value: '',
        details: 'DNS lookup timed out'
      };
    }
    return {
      status: 'error',
      value: '',
      details: (error as Error).message
    };
  }
}

function parseDmarcTags(record: string): Record<string, string> {
  const tags: Record<string, string> = {};
  for (const segment of record.split(';')) {
    const trimmed = segment.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim().toLowerCase();
    const value = trimmed.slice(eq + 1).trim();
    tags[key] = value;
  }
  return tags;
}

async function checkDMARC(domain: string): Promise<DNSCheckResult> {
  try {
    const records = await resolveTxtWithTimeout(`_dmarc.${domain}`);
    const dmarcRecord = records.flat().join(' ');

    if (!dmarcRecord.includes('v=DMARC1')) {
      return {
        status: 'advisory',
        value: dmarcRecord,
        details: 'Record found but missing v=DMARC1 tag'
      };
    }

    const tags = parseDmarcTags(dmarcRecord);

    if (!('p' in tags)) {
      return {
        status: 'advisory',
        value: dmarcRecord,
        details: 'Missing required tags: p='
      };
    }

    const advisories: string[] = [];
    const summary: string[] = [`p=${tags.p}`];
    if (tags.sp) summary.push(`sp=${tags.sp}`);
    if (tags.pct) summary.push(`pct=${tags.pct}`);
    if (tags.adkim) summary.push(`adkim=${tags.adkim}`);
    if (tags.aspf) summary.push(`aspf=${tags.aspf}`);

    if (tags.p === 'none') {
      advisories.push('Monitor-only policy (p=none), no enforcement');
    }

    if (tags.pct) {
      const pct = Number(tags.pct);
      if (!Number.isNaN(pct) && pct < 100 && tags.p !== 'none') {
        advisories.push(`Partial enforcement (pct=${pct})`);
      }
    }

    if (!tags.rua) {
      advisories.push('No aggregate report address (rua) configured');
    }

    if (tags.adkim && !['r', 's'].includes(tags.adkim.toLowerCase())) {
      advisories.push(`Unknown DKIM alignment mode: ${tags.adkim}`);
    }
    if (tags.aspf && !['r', 's'].includes(tags.aspf.toLowerCase())) {
      advisories.push(`Unknown SPF alignment mode: ${tags.aspf}`);
    }

    if (advisories.length > 0) {
      return {
        status: 'advisory',
        value: dmarcRecord,
        details: `${summary.join(', ')}; ${advisories.join('; ')}`,
      };
    }

    return {
      status: 'success',
      value: dmarcRecord,
      details: summary.join(', '),
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOTFOUND' || (error as NodeJS.ErrnoException).code === 'ENODATA') {
      return {
        status: 'not-configured',
        value: '',
        details: 'No DMARC record found'
      };
    }
    if ((error as NodeJS.ErrnoException).code === 'ETIMEOUT') {
      return {
        status: 'error',
        value: '',
        details: 'DNS lookup timed out'
      };
    }
    return {
      status: 'error',
      value: '',
      details: (error as Error).message
    };
  }
}

export { checkDKIM, checkSPF, checkDMARC };
