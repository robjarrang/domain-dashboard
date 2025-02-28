import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const esps = await prisma.esp.findMany({
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(esps);
  } catch (error) {
    console.error('Failed to fetch ESPs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ESPs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();
    
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const esp = await prisma.esp.create({
      data: { name }
    });

    return NextResponse.json(esp);
  } catch (error) {
    console.error('Failed to create ESP:', error);
    return NextResponse.json(
      { error: 'Failed to create ESP' },
      { status: 500 }
    );
  }
}