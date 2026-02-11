import { prisma } from '@/lib/prisma';
import type { DNSCheckResult } from '@/utils/dns';
import { Prisma } from '@prisma/client';

type DomainDNSState = {
  id: string;
  dkim: string | null;
  spf: string | null;
  dmarc: string | null;
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

  const changes: Prisma.DNSRecordHistoryCreateManyInput[] = [];

  if (domain.dkim !== nextValues.dkim) {
    changes.push({
      domainId: domain.id,
      recordType: 'DKIM',
      before: domain.dkim,
      after: nextValues.dkim,
    });
  }

  if (domain.spf !== nextValues.spf) {
    changes.push({
      domainId: domain.id,
      recordType: 'SPF',
      before: domain.spf,
      after: nextValues.spf,
    });
  }

  if (domain.dmarc !== nextValues.dmarc) {
    changes.push({
      domainId: domain.id,
      recordType: 'DMARC',
      before: domain.dmarc,
      after: nextValues.dmarc,
    });
  }

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

    if (changes.length > 0) {
      await tx.dNSRecordHistory.createMany({
        data: changes,
      });
    }
  });

  return nextValues;
}
