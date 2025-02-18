import { jest } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';

jest.mock('next/server', () => ({
  NextRequest: function(url: string, init?: RequestInit) {
    return {
      url,
      ...(init || {}),
      json: () => Promise.resolve(init?.body ? JSON.parse(init.body as string) : {})
    } as unknown as NextRequest;
  },
  NextResponse: {
    json: (data: any, init?: ResponseInit) => new Response(
      data === null ? null : JSON.stringify(data),
      init
    ),
  }
}));

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    domain: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

// Mock DNS functions
jest.mock('@/utils/dns', () => ({
  checkDKIM: jest.fn(),
  checkSPF: jest.fn(),
  checkDMARC: jest.fn(),
}));