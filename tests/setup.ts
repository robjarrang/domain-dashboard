import { jest } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';

jest.mock('next/server', () => {
  class MockNextResponse extends Response {
    constructor(body?: BodyInit | null, init?: ResponseInit) {
      super(body, init);
    }

    static json(data: any, init?: ResponseInit) {
      return new MockNextResponse(
        data === null ? null : JSON.stringify(data),
        init
      );
    }
  }

  return {
    NextRequest: function(url: string, init?: RequestInit) {
      return {
        url,
        ...(init || {}),
        json: () =>
          Promise.resolve(
            init?.body ? JSON.parse(init.body as string) : {}
          )
      } as unknown as NextRequest;
    },
    NextResponse: MockNextResponse
  };
});

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    domain: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    domainCheck: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

// Mock DNS functions
jest.mock('@/utils/dns', () => ({
  checkDKIM: jest.fn(),
  checkSPF: jest.fn(),
  checkDMARC: jest.fn(),
}));

// Mock Prisma error class to avoid loading the real @prisma/client ESM module
jest.mock('@prisma/client', () => ({
  Prisma: { PrismaClientKnownRequestError: class extends Error {} }
}));