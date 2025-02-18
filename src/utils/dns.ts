import { promises as dns } from 'dns';

export type DNSCheckResult = {
  status: 'success' | 'error' | 'not-configured' | 'advisory';
  value: string;
  details?: string;
};

const DNS_TIMEOUT = 5000; // 5 seconds timeout

async function resolveTxtWithTimeout(hostname: string): Promise<string[][]> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('DNS lookup timeout')), DNS_TIMEOUT);
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
    
    return {
      status: 'success',
      value: dkimRecord
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
    
    // Validate SPF syntax
    if (!spfRecord.match(/v=spf1( [+-]?(all|include:[^\s]+|ip4:[^\s]+|ip6:[^\s]+|a|mx|ptr|exists:[^\s]+))*( [+-]all)?$/)) {
      return {
        status: 'advisory',
        value: spfRecord,
        details: 'Invalid SPF syntax'
      };
    }
    
    return {
      status: 'success',
      value: spfRecord
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
    
    // Check for required DMARC tags
    const requiredTags = ['p='];
    const missingTags = requiredTags.filter(tag => !dmarcRecord.includes(tag));
    
    if (missingTags.length > 0) {
      return {
        status: 'advisory',
        value: dmarcRecord,
        details: `Missing required tags: ${missingTags.join(', ')}`
      };
    }
    
    return {
      status: 'success',
      value: dmarcRecord
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