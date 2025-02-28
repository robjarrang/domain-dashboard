import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkDKIM, checkSPF, checkDMARC } from '@/utils/dns';
import { Prisma } from '@prisma/client';

// Mark route as dynamic
export const dynamic = 'force-dynamic';

// Define route segment config
export const runtime = 'nodejs';

// Route handlers
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
    });

    if (!domain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    const [dkimResult, spfResult, dmarcResult] = await Promise.all([
      checkDKIM(domain.name, domain.dkimSelector),
      checkSPF(domain.name),
      checkDMARC(domain.name),
    ]);

    const dismissedAdvisories = domain.dismissedAdvisories ? 
      domain.dismissedAdvisories.split(',').filter(Boolean) : 
      [];

    const updatedDomain = await prisma.domain.update({
      where: { id },
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

    return NextResponse.json({
      ...updatedDomain,
      lastChecked: updatedDomain.lastChecked.toISOString(),
      dismissedAdvisories,
      dkimStatus: dkimResult.status,
      spfStatus: spfResult.status,
      dmarcStatus: dmarcResult.status,
    });
  } catch (_error) {
    console.error('Error fetching domain:', _error);
    return NextResponse.json(
      { error: 'Failed to fetch domain' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    });

    if (!domain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    await prisma.domain.delete({
      where: { id },
    });
    
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting domain:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to delete domain' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = context.params;
  if (!id) {
    return NextResponse.json({ error: 'Domain ID is required' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { dismissedAdvisories, name, dkimSelector, espId } = body;
    
    // If we're updating dismissedAdvisories
    if (dismissedAdvisories !== undefined) {
      if (!Array.isArray(dismissedAdvisories)) {
        return NextResponse.json({ 
          error: 'dismissedAdvisories must be an array' 
        }, { status: 400 });
      }

      const currentDomain = await prisma.domain.findUnique({
        where: { id },
        select: {
          id: true,
          dismissedAdvisories: true,
          lastChecked: true
        }
      });

      if (!currentDomain) {
        return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
      }

      const cleanedAdvisories = dismissedAdvisories
        .filter((item: unknown): item is string => typeof item === 'string')
        .map((s: string) => s.trim())
        .filter(Boolean);

      const finalString = cleanedAdvisories.join(',');
      
      if (finalString.length > 1000) {
        return NextResponse.json(
          { error: 'Too many advisories to store' },
          { status: 400 }
        );
      }

      const domain = await prisma.domain.update({
        where: { id },
        data: { 
          dismissedAdvisories: finalString || null
        },
        include: {
          esp: true
        }
      });

      return NextResponse.json({
        ...domain,
        lastChecked: domain.lastChecked.toISOString(),
        dismissedAdvisories: finalString ? finalString.split(',') : [],
      });
    }

    // If we're updating domain details
    if (name || dkimSelector || espId !== undefined) {
      // Basic validation
      if (name) {
        const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
        if (!domainRegex.test(name)) {
          return NextResponse.json(
            { error: 'Invalid domain format' },
            { status: 400 }
          );
        }

        const existingDomain = await prisma.domain.findFirst({
          where: { 
            name,
            NOT: { id }
          },
        });

        if (existingDomain) {
          return NextResponse.json(
            { error: 'Domain already exists' },
            { status: 400 }
          );
        }
      }

      if (dkimSelector) {
        const selectorRegex = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/i;
        if (!selectorRegex.test(dkimSelector)) {
          return NextResponse.json(
            { error: 'Invalid DKIM selector format' },
            { status: 400 }
          );
        }
      }

      const updateData: any = {};
      if (name) updateData.name = name;
      if (dkimSelector) updateData.dkimSelector = dkimSelector;
      if (espId !== undefined) updateData.espId = espId || null;

      const domain = await prisma.domain.update({
        where: { id },
        data: updateData,
        include: {
          esp: true
        }
      });

      return NextResponse.json(domain);
    }

    return NextResponse.json(
      { error: 'No valid update parameters provided' },
      { status: 400 }
    );
  } catch (_error) {
    console.error('Error in PATCH /api/domains/[id]:', _error);
    return NextResponse.json(
      { error: 'Failed to update domain' },
      { status: 500 }
    );
  }
}