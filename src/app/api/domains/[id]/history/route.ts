import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = context.params;

  if (!id) {
    return NextResponse.json({ error: 'Domain ID is required' }, { status: 400 });
  }

  try {
    const domain = await prisma.domain.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!domain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    const history = await prisma.dNSRecordHistory.findMany({
      where: { domainId: id },
      orderBy: { changedAt: 'desc' },
      take: 50,
    });

    return NextResponse.json(history);
  } catch (error) {
    console.error('Error fetching DNS history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch DNS history' },
      { status: 500 }
    );
  }
}
