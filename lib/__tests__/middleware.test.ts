/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';

jest.mock('jose', () => ({
  jwtVerify: jest.fn((token: string) => {
    if (token === 'valid-token') return Promise.resolve({ payload: { access: true } });
    return Promise.reject(new Error('Invalid token'));
  }),
}));

const mockRedirect = jest.fn((url: URL) => ({ type: 'redirect', url: url.toString(), cookies: { delete: jest.fn() } }));
const mockNext = jest.fn(() => ({ type: 'next' }));

jest.mock('next/server', () => ({
  NextResponse: {
    redirect: (url: URL) => mockRedirect(url),
    next: () => mockNext(),
  },
}));

// Mock fetch to prevent actual DB calls - middleware falls back to process.env.STORE_MODE
global.fetch = jest.fn(() => Promise.reject(new Error('no db'))) as any;

import { middleware, _resetCacheForTesting } from '../../middleware';

const createRequest = (pathname: string, cookies: Record<string, string> = {}) => {
  const url = new URL(`http://localhost${pathname}`);
  return {
    nextUrl: url,
    url: url.toString(),
    cookies: {
      get: (name: string) => cookies[name] ? { value: cookies[name] } : undefined,
    },
  } as unknown as NextRequest;
};

describe('middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.STORE_MODE;
    process.env.JWT_SECRET = 'test-secret';
    if (_resetCacheForTesting) _resetCacheForTesting();
  });

  describe('admin routes', () => {
    it('always allows /admin access', async () => {
      const req = createRequest('/admin');
      await middleware(req);
      expect(mockNext).toHaveBeenCalled();
    });

    it('allows /admin/products', async () => {
      const req = createRequest('/admin/products');
      await middleware(req);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('unknown routes', () => {
    it('redirects unknown paths to /', async () => {
      const req = createRequest('/unknown-path');
      await middleware(req);
      expect(mockRedirect).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/' }));
    });

    it('redirects deeply nested unknown paths to /', async () => {
      const req = createRequest('/foo/bar/baz');
      await middleware(req);
      expect(mockRedirect).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/' }));
    });
  });

  describe('soldout mode', () => {
    beforeEach(() => { process.env.STORE_MODE = 'soldout'; });

    it('redirects everything to /soldout', async () => {
      const req = createRequest('/catalog');
      await middleware(req);
      expect(mockRedirect).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/soldout' }));
    });

    it('allows /soldout page', async () => {
      const req = createRequest('/soldout');
      await middleware(req);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('active mode', () => {
    beforeEach(() => { process.env.STORE_MODE = 'active'; });

    it('redirects / to /catalog', async () => {
      const req = createRequest('/');
      await middleware(req);
      expect(mockRedirect).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/catalog' }));
    });

    it('redirects /password to /catalog', async () => {
      const req = createRequest('/password');
      await middleware(req);
      expect(mockRedirect).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/catalog' }));
    });

    it('allows /catalog directly', async () => {
      const req = createRequest('/catalog');
      await middleware(req);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('password mode', () => {
    beforeEach(() => { process.env.STORE_MODE = 'password'; });

    it('redirects / to /password without token', async () => {
      const req = createRequest('/');
      await middleware(req);
      expect(mockRedirect).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/password' }));
    });

    it('redirects /catalog to /password without token', async () => {
      const req = createRequest('/catalog');
      await middleware(req);
      expect(mockRedirect).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/password' }));
    });

    it('allows /catalog with valid token', async () => {
      const req = createRequest('/catalog', { limito_access: 'valid-token' });
      await middleware(req);
      expect(mockNext).toHaveBeenCalled();
    });

    it('redirects to /password with invalid token', async () => {
      const req = createRequest('/catalog', { limito_access: 'invalid-token' });
      await middleware(req);
      expect(mockRedirect).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/password' }));
    });

    it('allows /password page without token', async () => {
      const req = createRequest('/password');
      await middleware(req);
      expect(mockNext).toHaveBeenCalled();
    });

    it('redirects /password to /catalog with valid token', async () => {
      const req = createRequest('/password', { limito_access: 'valid-token' });
      await middleware(req);
      expect(mockRedirect).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/catalog' }));
    });
  });

  describe('env fallback', () => {
    it('uses STORE_MODE env when no cookie', async () => {
      process.env.STORE_MODE = 'active';
      const req = createRequest('/');
      await middleware(req);
      expect(mockRedirect).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/catalog' }));
    });

    it('defaults to password mode', async () => {
      const req = createRequest('/');
      await middleware(req);
      expect(mockRedirect).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/password' }));
    });
  });
});
