/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';

// Mock NextResponse
const mockRedirect = jest.fn((url: URL) => ({ type: 'redirect', url: url.toString() }));
const mockNext = jest.fn(() => ({ type: 'next' }));

jest.mock('next/server', () => ({
  NextResponse: {
    redirect: (url: URL) => mockRedirect(url),
    next: () => mockNext(),
  },
}));

// Import after mocking
import { middleware } from '../../middleware';

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
  });

  describe('admin routes', () => {
    it('always allows /admin access', async () => {
      const req = createRequest('/admin', { store_mode: 'soldout' });
      await middleware(req);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('soldout mode', () => {
    it('redirects everything to /soldout', async () => {
      const req = createRequest('/catalog', { store_mode: 'soldout' });
      await middleware(req);
      expect(mockRedirect).toHaveBeenCalledWith(expect.objectContaining({
        pathname: '/soldout'
      }));
    });

    it('allows /soldout page', async () => {
      const req = createRequest('/soldout', { store_mode: 'soldout' });
      await middleware(req);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('active mode', () => {
    it('redirects / to /catalog', async () => {
      const req = createRequest('/', { store_mode: 'active' });
      await middleware(req);
      expect(mockRedirect).toHaveBeenCalledWith(expect.objectContaining({
        pathname: '/catalog'
      }));
    });

    it('redirects /password to /catalog', async () => {
      const req = createRequest('/password', { store_mode: 'active' });
      await middleware(req);
      expect(mockRedirect).toHaveBeenCalledWith(expect.objectContaining({
        pathname: '/catalog'
      }));
    });

    it('allows /catalog directly', async () => {
      const req = createRequest('/catalog', { store_mode: 'active' });
      await middleware(req);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('password mode', () => {
    it('redirects / to /password without token', async () => {
      const req = createRequest('/', { store_mode: 'password' });
      await middleware(req);
      expect(mockRedirect).toHaveBeenCalledWith(expect.objectContaining({
        pathname: '/password'
      }));
    });

    it('redirects /catalog to /password without token', async () => {
      const req = createRequest('/catalog', { store_mode: 'password' });
      await middleware(req);
      expect(mockRedirect).toHaveBeenCalledWith(expect.objectContaining({
        pathname: '/password'
      }));
    });

    it('allows /catalog with token', async () => {
      const req = createRequest('/catalog', { store_mode: 'password', limito_access: 'valid-token' });
      await middleware(req);
      expect(mockNext).toHaveBeenCalled();
    });

    it('allows /password page without token', async () => {
      const req = createRequest('/password', { store_mode: 'password' });
      await middleware(req);
      expect(mockNext).toHaveBeenCalled();
    });

    it('redirects /password to /catalog with token', async () => {
      const req = createRequest('/password', { store_mode: 'password', limito_access: 'valid-token' });
      await middleware(req);
      expect(mockRedirect).toHaveBeenCalledWith(expect.objectContaining({
        pathname: '/catalog'
      }));
    });
  });

  describe('env fallback', () => {
    it('uses STORE_MODE env when no cookie', async () => {
      process.env.STORE_MODE = 'active';
      const req = createRequest('/');
      await middleware(req);
      expect(mockRedirect).toHaveBeenCalledWith(expect.objectContaining({
        pathname: '/catalog'
      }));
    });
  });
});
