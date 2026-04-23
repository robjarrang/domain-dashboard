import { prisma } from '@/lib/prisma';
import type { DNSCheckResult } from '@/utils/dns';

type DomainDNSState = {
  id: string;
};

type DNSCheckResults = {
  dkim: DNSCheckResult;
  spf: DNSCheckResult;
  dmarc: DNSCheckResult;
};

export function formatDNSResult(result: DNSCheckResult): string {
  return result.details ? `${result.value} (${result.details})` : result.value;
}

export async function updateDomainWithHistory(domain: DomainDNSState, results: DNSCheckResults) {
  const nextValues = {
    dkim: formatDNSResult(results.dkim),
    spf: formatDNSResult(results.spf),
    dmarc: formatDNSResult(results.dmarc),
  };

  await prisma.$transaction(async (tx) => {
    await tx.domain.update({
      where: { id: domain.id },
      data: {
        ...nextValues,
        dkimStatus: results.dkim.status,
        spfStatus: results.spf.status,
        dmarcStatus: results.dmarc.status,
        lastChecked: new Date(),
      },
    });
  });

  return nextValues;
}
