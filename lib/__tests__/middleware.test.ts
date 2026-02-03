/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';

// Mock jose
jest.mock('jose', () => ({
  jwtVerify: jest.fn((token: string) => {
    if (token === 'valid-token') return Promise.resolve({ payload: { access: true } });
    return Promise.reject(new Error('Invalid token'));
  }),
}));

// Mock NextResponse
const mockRedirect = jest.fn((url: URL) => ({ type: 'redirect', url: url.toString(), cookies: { delete: jest.fn() } }));
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
    process.env.JWT_SECRET = 'test-secret';
  });

  describe('admin routes', () => {
    it('always allows /admin access', async () => {
      const req = createRequest('/admin', { store_mode: 'soldout' });
      await middleware(req);
      expect(mockNext).toHaveBeenCalled();
    });

    it('allows /admin/products', async () => {
      const req = createRequest('/admin/products', { store_mode: 'password' });
      await middleware(req);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('unknown routes', () => {
    it('redirects unknown paths to /', async () => {
      const req = createRequest('/unknown-path', { store_mode: 'password' });
      await middleware(req);
      expect(mockRedirect).toHaveBeenCalledWith(expect.objectContaining({
        pathname: '/'
      }));
    });

    it('redirects deeply nested unknown paths to /', async () => {
      const req = createRequest('/foo/bar/baz', { store_mode: 'active' });
      await middleware(req);
      expect(mockRedirect).toHaveBeenCalledWith(expect.objectContaining({
        pathname: '/'
      }));
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

    it('allows /catalog with valid token', async () => {
      const req = createRequest('/catalog', { store_mode: 'password', limito_access: 'valid-token' });
      await middleware(req);
      expect(mockNext).toHaveBeenCalled();
    });

    it('redirects to /password with invalid token', async () => {
      const req = createRequest('/catalog', { store_mode: 'password', limito_access: 'invalid-token' });
      await middleware(req);
      expect(mockRedirect).toHaveBeenCalledWith(expect.objectContaining({
        pathname: '/password'
      }));
    });

    it('allows /password page without token', async () => {
      const req = createRequest('/password', { store_mode: 'password' });
      await middleware(req);
      expect(mockNext).toHaveBeenCalled();
    });

    it('redirects /password to /catalog with valid token', async () => {
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
