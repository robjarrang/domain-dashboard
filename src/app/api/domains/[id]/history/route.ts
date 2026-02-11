import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

type PrismaErrorLike = {
  code?: string;
};

function isMissingHistoryTableError(error: unknown): error is PrismaErrorLike {
  return Boolean(
    error &&
    typeof error === 'object' &&
    'code' in error &&
    (error as PrismaErrorLike).code === 'P2021'
  );
}

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
    if (isMissingHistoryTableError(error)) {
      console.warn('DNS history table not available yet. Returning empty history.');
      return NextResponse.json([]);
    }

    console.error('Error fetching DNS history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch DNS history' },
      { status: 500 }
    );
  }
}
