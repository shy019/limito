import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Admin routes always accessible
  if (pathname.startsWith('/admin')) {
    return NextResponse.next();
  }
  
  // Skip for static/api
  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/') || pathname.startsWith('/images/')) {
    return NextResponse.next();
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
  
  // PASSWORD: requires token for protected routes
  const protectedRoutes = ['/catalog', '/catalogo', '/product', '/producto', '/checkout', '/cart', '/carrito'];
  const isProtected = pathname === '/' || protectedRoutes.some(r => pathname.startsWith(r));
  
  if (!accessToken && isProtected) {
    return NextResponse.redirect(new URL('/password', request.url));
  }
  if (accessToken && pathname === '/password') {
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
