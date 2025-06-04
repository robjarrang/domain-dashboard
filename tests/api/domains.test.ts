import { describe, expect, test, jest, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkDKIM, checkSPF, checkDMARC } from '@/utils/dns';
import { GET, DELETE, PATCH } from '@/app/api/domains/[id]/route';

describe('Domain API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/domains/[id]', () => {
    test('should return domain with DNS check results', async () => {
      const mockDomain = {
        id: '123',
        name: 'test.com',
        dkimSelector: 'selector',
        dismissedAdvisories: null,
        lastChecked: new Date(),
      };

      const mockDNSResult = {
        status: 'success',
        value: 'v=DKIM1',
      };

      (prisma.domain.findUnique as jest.Mock).mockResolvedValue(mockDomain);
      (checkDKIM as jest.Mock).mockResolvedValue(mockDNSResult);
      (checkSPF as jest.Mock).mockResolvedValue(mockDNSResult);
      (checkDMARC as jest.Mock).mockResolvedValue(mockDNSResult);
      (prisma.domain.update as jest.Mock).mockResolvedValue({
        ...mockDomain,
        dkim: mockDNSResult.value,
        spf: mockDNSResult.value,
        dmarc: mockDNSResult.value,
      });

      const request = new NextRequest('http://localhost');
      const response = await GET(request, { params: { id: '123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('dkimStatus', 'success');
      expect(data).toHaveProperty('spfStatus', 'success');
      expect(data).toHaveProperty('dmarcStatus', 'success');
      expect(prisma.domain.findUnique).toHaveBeenCalledWith({
        where: { id: '123' }
      });
    });

    test('should return 404 for non-existent domain', async () => {
      (prisma.domain.findUnique as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost');
      const response = await GET(request, { params: { id: 'nonexistent' } });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toHaveProperty('error', 'Domain not found');
    });
  });

  describe('DELETE /api/domains/[id]', () => {
    test('should delete domain successfully', async () => {
      // Explicitly resolve the delete operation
      (prisma.domain.delete as jest.Mock).mockResolvedValueOnce({});

      const request = new NextRequest('http://localhost');
      const context = { params: { id: '123' } };
      const response = await DELETE(request, context);

      expect(response.status).toBe(204);
      expect(prisma.domain.delete).toHaveBeenCalledWith({
        where: { id: '123' }
      });
    });

    test('should handle deletion error', async () => {
      (prisma.domain.delete as jest.Mock).mockRejectedValue(new Error('Delete failed'));

      const request = new NextRequest('http://localhost');
      const response = await DELETE(request, { params: { id: '123' } });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toHaveProperty('error', 'Failed to delete domain');
    });
  });

  describe('PATCH /api/domains/[id]', () => {
    test('should update dismissedAdvisories', async () => {
      const mockDomain = {
        id: '123',
        dismissedAdvisories: '',
        lastChecked: new Date(),
      };

      (prisma.domain.findUnique as jest.Mock).mockResolvedValue(mockDomain);
      (prisma.domain.update as jest.Mock).mockResolvedValue({
        ...mockDomain,
        dismissedAdvisories: 'dkim,spf'
      });

      const request = new NextRequest('http://localhost', {
        method: 'PATCH',
        body: JSON.stringify({ dismissedAdvisories: ['dkim', 'spf'] })
      });
      const response = await PATCH(request, { params: { id: '123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.dismissedAdvisories).toEqual(['dkim', 'spf']);
      expect(prisma.domain.update).toHaveBeenCalled();
    });

    test('should validate dismissedAdvisories input', async () => {
      const request = new NextRequest('http://localhost', {
        method: 'PATCH',
        body: JSON.stringify({ dismissedAdvisories: 'invalid' })
      });
      const response = await PATCH(request, { params: { id: '123' } });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error', 'dismissedAdvisories must be an array');
    });
  });
});