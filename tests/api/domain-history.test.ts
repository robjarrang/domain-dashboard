import { describe, expect, test, jest, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GET } from '@/app/api/domains/[id]/history/route';

describe('Domain DNS History API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns DNS record history for a domain', async () => {
    (prisma.domain.findUnique as jest.Mock).mockResolvedValue({ id: 'domain-1' });
    (prisma.dNSRecordHistory.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'hist-1',
        domainId: 'domain-1',
        recordType: 'SPF',
        before: 'v=spf1 include:old.example.com -all',
        after: 'v=spf1 include:new.example.com -all',
        changedAt: new Date().toISOString(),
      },
    ]);

    const response = await GET(new NextRequest('http://localhost'), {
      params: { id: 'domain-1' },
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveLength(1);
    expect(body[0]).toHaveProperty('recordType', 'SPF');
  });

  test('returns 404 when domain does not exist', async () => {
    (prisma.domain.findUnique as jest.Mock).mockResolvedValue(null);

    const response = await GET(new NextRequest('http://localhost'), {
      params: { id: 'missing' },
    });

    expect(response.status).toBe(404);
  });
});
