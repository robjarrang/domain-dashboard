import { prisma } from '@/lib/prisma';
import { checkDKIM, checkSPF, checkDMARC } from '@/utils/dns';
import { NextResponse } from 'next/server';

// Vercel cron jobs are protected by a secret header
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: Request) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get('Authorization');
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const domains = await prisma.domain.findMany();
    
    for (const domain of domains) {
      const [dkimResult, spfResult, dmarcResult] = await Promise.all([
        checkDKIM(domain.name, domain.dkimSelector),
        checkSPF(domain.name),
        checkDMARC(domain.name),
      ]);

      await prisma.domain.update({
        where: { id: domain.id },
        data: {
          dkim: dkimResult.details ? `${dkimResult.value} (${dkimResult.details})` : dkimResult.value,
          spf: spfResult.details ? `${spfResult.value} (${spfResult.details})` : spfResult.value,
          dmarc: dmarcResult.details ? `${dmarcResult.value} (${dmarcResult.details})` : dmarcResult.value,
          dkimStatus: dkimResult.status,
          spfStatus: spfResult.status,
          dmarcStatus: dmarcResult.status,
          lastChecked: new Date(),
        },
      });
    }

    return NextResponse.json({ success: true, message: 'Domains checked successfully' });
  } catch (error) {
    console.error('Error checking domains:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check domains' },
      { status: 500 }
    );
  }
}