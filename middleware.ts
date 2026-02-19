import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const knownRoutes = ['/', '/password', '/catalog', '/catalogo', '/product', '/producto', '/checkout', '/cart', '/carrito', '/soldout', '/admin', '/policies', '/contact'];

let cachedMode: { value: string; expiry: number } | null = null;

export function _resetCacheForTesting() { cachedMode = null; }

async function getStoreMode(): Promise<string> {
  if (cachedMode && Date.now() < cachedMode.expiry) return cachedMode.value;

  try {
    const url = process.env.TURSO_DATABASE_URL!;
    const token = process.env.TURSO_AUTH_TOKEN!;
    // Convert libsql:// to https:// for HTTP API
    const httpUrl = url.replace('libsql://', 'https://');

    const res = await fetch(`${httpUrl}/v2/pipeline`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests: [{ type: 'execute', stmt: { sql: "SELECT value FROM settings WHERE key = 'store_mode' LIMIT 1" } }, { type: 'close' }] }),
    });

    if (res.ok) {
      const data = await res.json();
      const rows = data?.results?.[0]?.response?.result?.rows;
      if (rows?.[0]?.[0]?.value) {
        const mode = rows[0][0].value;
        cachedMode = { value: mode, expiry: Date.now() + 20_000 }; // cache 20s
        return mode;
      }
    }
  } catch {}

  return process.env.STORE_MODE || 'password';
}

async function isValidToken(token: string): Promise<boolean> {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) return false;
    await jwtVerify(token, new TextEncoder().encode(secret));
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip for static/api
  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/') || pathname.startsWith('/images/')) {
    return NextResponse.next();
  }
  
  // Admin routes always accessible
  if (pathname.startsWith('/admin')) {
    return NextResponse.next();
  }
  
  // Unknown routes redirect to base
  const isKnown = knownRoutes.some(r => pathname === r || pathname.startsWith(r + '/'));
  if (!isKnown) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  const storeMode = await getStoreMode();
  const accessToken = request.cookies.get('limito_access')?.value;
  
  // SOLDOUT: everything redirects to /soldout
  if (storeMode === 'soldout') {
    if (pathname !== '/soldout' && pathname !== '/policies' && pathname !== '/contact') {
      return NextResponse.redirect(new URL('/soldout', request.url));
    }
    return NextResponse.next();
  }
  
  // ACTIVE: free access to catalog, no password/soldout pages
  if (storeMode === 'active') {
    if (pathname === '/' || pathname === '/password' || pathname === '/soldout') {
      return NextResponse.redirect(new URL('/catalog', request.url));
    }
    return NextResponse.next();
  }
  
  // PASSWORD: requires valid token for protected routes
  const protectedRoutes = ['/catalog', '/catalogo', '/product', '/producto', '/checkout', '/cart', '/carrito'];
  const isProtected = pathname === '/' || protectedRoutes.some(r => pathname.startsWith(r));
  
  const hasValidToken = accessToken ? await isValidToken(accessToken) : false;
  
  // Clear invalid token and redirect to password
  if (accessToken && !hasValidToken) {
    const response = NextResponse.redirect(new URL('/password', request.url));
    response.cookies.delete('limito_access');
    return response;
  }
  
  if (!hasValidToken && isProtected) {
    return NextResponse.redirect(new URL('/password', request.url));
  }
  if (hasValidToken && pathname === '/password') {
    return NextResponse.redirect(new URL('/catalog', request.url));
  }
  if (pathname === '/soldout') {
    return NextResponse.redirect(new URL('/password', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images).*)'],
};
