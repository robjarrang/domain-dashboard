import { describe, expect, test, jest, beforeEach, afterEach } from '@jest/globals';
import { prisma } from '@/lib/prisma';
import { checkDKIM, checkSPF, checkDMARC } from '@/utils/dns';

const originalSecret = process.env.CRON_SECRET;

describe('Cron Check Domains API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env.CRON_SECRET = originalSecret;
  });

  test('returns 200 when secret is correct', async () => {
    process.env.CRON_SECRET = 'secret';

    const { GET } = await import('@/app/api/cron/check-domains/route');

    const mockDomains = [
      { id: '1', name: 'example.com', dkimSelector: 'selector' },
    ];
    (prisma.domain.findMany as jest.Mock).mockResolvedValue(mockDomains);
    (prisma.domain.update as jest.Mock).mockResolvedValue({});
    (checkDKIM as jest.Mock).mockResolvedValue({ status: 'success', value: 'dkim' });
    (checkSPF as jest.Mock).mockResolvedValue({ status: 'success', value: 'spf' });
    (checkDMARC as jest.Mock).mockResolvedValue({ status: 'success', value: 'dmarc' });

    const request = new Request('http://localhost', {
      headers: { Authorization: 'Bearer secret' }
    });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true, message: 'Domains checked successfully' });
    expect(prisma.domain.findMany).toHaveBeenCalled();
    expect(prisma.domain.update).toHaveBeenCalled();
  });

  test('returns 401 when secret is missing', async () => {
    process.env.CRON_SECRET = 'secret';

    const { GET } = await import('@/app/api/cron/check-domains/route');

    const request = new Request('http://localhost');
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  test('returns 401 when secret is wrong', async () => {
    process.env.CRON_SECRET = 'secret';

    const { GET } = await import('@/app/api/cron/check-domains/route');

    const request = new Request('http://localhost', {
      headers: { Authorization: 'Bearer wrong' }
    });
    const response = await GET(request);

    expect(response.status).toBe(401);
  });
});
