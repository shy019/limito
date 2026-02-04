import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const knownRoutes = ['/', '/password', '/catalog', '/catalogo', '/product', '/producto', '/checkout', '/cart', '/carrito', '/soldout', '/admin', '/policies', '/contact'];

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
  
  const storeMode = request.cookies.get('store_mode')?.value || process.env.STORE_MODE || 'password';
  const accessToken = request.cookies.get('limito_access')?.value;
  
  // SOLDOUT: everything redirects to /soldout
  if (storeMode === 'soldout') {
    if (pathname !== '/soldout') {
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
