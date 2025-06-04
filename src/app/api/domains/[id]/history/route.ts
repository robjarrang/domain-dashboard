import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(_request: Request, context: { params: { id: string } }) {
  const { id } = context.params;
  if (!id) {
    return NextResponse.json({ error: 'Domain ID is required' }, { status: 400 });
  }

  const limit = Number(new URL(_request.url).searchParams.get('limit') ?? '10');

  try {
    const history = await prisma.domainCheck.findMany({
      where: { domainId: id },
      orderBy: { checkedAt: 'desc' },
      take: limit,
    });
    return NextResponse.json(history);
  } catch (error) {
    console.error('Error fetching history:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}
