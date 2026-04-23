import { prisma } from '@/lib/prisma';
import { checkDKIM, checkSPF, checkDMARC } from '@/utils/dns';
import { updateDomainWithHistory } from '@/lib/domain-dns';
import { NextResponse } from 'next/server';

// Vercel cron jobs are protected by a secret header
const CRON_SECRET = process.env.CRON_SECRET;

// Allow the cron function to run long enough to check every domain.
// Hobby plans cap Serverless Functions at 60s; Pro allows up to 300s.
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

async function checkOneDomain(domain: Awaited<ReturnType<typeof prisma.domain.findMany>>[number]) {
  const [dkimResult, spfResult, dmarcResult] = await Promise.all([
    checkDKIM(domain.name, domain.dkimSelector),
    checkSPF(domain.name),
    checkDMARC(domain.name),
  ]);

  await updateDomainWithHistory(domain, {
    dkim: dkimResult,
    spf: spfResult,
    dmarc: dmarcResult,
  });
}

export async function GET(request: Request) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get('Authorization');
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const domains = await prisma.domain.findMany();

    // Run all domain checks concurrently and isolate failures so that one
    // slow/failing domain cannot prevent the rest from being updated. With
    // sequential processing, the function would hit Vercel's maxDuration
    // before reaching every domain whenever DNS lookups were slow.
    const results = await Promise.allSettled(domains.map((domain) => checkOneDomain(domain)));

    const failures = results
      .map((result, index) => ({ result, domain: domains[index] }))
      .filter(({ result }) => result.status === 'rejected');

    for (const { result, domain } of failures) {
      console.error(
        `Failed to check domain ${domain.name} (${domain.id}):`,
        (result as PromiseRejectedResult).reason,
      );
    }

    return NextResponse.json({
      success: true,
      checked: domains.length,
      failed: failures.length,
      message: 'Domains checked successfully',
    });
  } catch (error) {
    console.error('Error checking domains:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check domains' },
      { status: 500 }
    );
  }
}