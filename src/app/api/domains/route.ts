import { prisma } from '@/lib/prisma';
import { checkDKIM, checkSPF, checkDMARC, type DNSCheckResult } from '@/utils/dns';
import { NextResponse } from 'next/server';

function formatDNSResult(result: DNSCheckResult): string {
  return result.details ? `${result.value} (${result.details})` : result.value;
}

export async function GET(_request: Request) {
  try {
    const domains = await prisma.domain.findMany({
      orderBy: { name: 'asc' },
      include: {
        esp: true
      }
    });
    return NextResponse.json(domains);
  } catch (_error) {
    return NextResponse.json(
      { error: 'Failed to fetch domains' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { name, dkimSelector, espId } = await request.json();
    
    // Basic validation
    if (!name || !dkimSelector) {
      return NextResponse.json(
        { error: 'Domain name and DKIM selector are required' },
        { status: 400 }
      );
    }

    // Domain format validation
    const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
    if (!domainRegex.test(name)) {
      return NextResponse.json(
        { error: 'Invalid domain format' },
        { status: 400 }
      );
    }

    const existingDomain = await prisma.domain.findUnique({
      where: { name },
    });

    if (existingDomain) {
      return NextResponse.json(
        { error: 'Domain already exists' },
        { status: 400 }
      );
    }

    const [dkimResult, spfResult, dmarcResult] = await Promise.all([
      checkDKIM(name, dkimSelector),
      checkSPF(name),
      checkDMARC(name),
    ]);

    const domain = await prisma.domain.create({
      data: {
        name,
        dkimSelector,
        dkim: formatDNSResult(dkimResult),
        spf: formatDNSResult(spfResult),
        dmarc: formatDNSResult(dmarcResult),
        espId: espId || null,
      },
      include: {
        esp: true
      }
    });

    return NextResponse.json(domain);
  } catch (_error) {
    return NextResponse.json(
      { error: 'Failed to create domain' },
      { status: 500 }
    );
  }
}