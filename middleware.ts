import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_ROUTES = [
  '/contact',
  '/contacto', 
  '/policies',
  '/politicas',
  '/password',
  '/soldout',
  '/api/',
  '/_next/',
  '/favicon.ico',
  '/images/',
];

const PROTECTED_ROUTES = [
  '/catalogo',
  '/catalog',
  '/producto',
  '/product',
  '/checkout',
  '/cart',
  '/carrito',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Admin routes bypass all checks
  if (pathname.startsWith('/admin')) {
    return NextResponse.next();
  }
  
  // Skip middleware for static assets and API routes
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }
  
  // Get store mode from cookie or default to 'active'
  const storeMode = request.cookies.get('store_mode')?.value || 'active';
  const accessToken = request.cookies.get('limito_access')?.value;
  const isHomePage = pathname === '/';
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
  
  // Handle soldout mode
  if (storeMode === 'soldout') {
    if (pathname !== '/soldout') {
      return NextResponse.redirect(new URL('/soldout', request.url));
    }
    return NextResponse.next();
  }
  
  // Handle password mode
  if (storeMode === 'password') {
    if (!accessToken && (isProtectedRoute || isHomePage)) {
      return NextResponse.redirect(new URL('/password', request.url));
    }
    if (accessToken && isHomePage) {
      return NextResponse.redirect(new URL('/catalog', request.url));
    }
  }
  
  // Handle active mode
  if (storeMode === 'active' && isHomePage) {
    return NextResponse.redirect(new URL('/catalog', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images).*)'],
};
