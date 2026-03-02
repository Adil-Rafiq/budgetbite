import { NextRequest, NextResponse } from 'next/server';

const publicRoutes = ['/', '/login', '/register', 'verify-email'];
const authRoutes = ['/login', '/register', '/verify-email']; // redirect to dashboard if already logged in

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // check session cookie
  const sessionCookie = req.cookies.get('better-auth.session_token')?.value;
  const isAuthenticated = !!sessionCookie;

  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // already logged in but trying to access auth pages, redirect to dashboard
  if (isAuthenticated && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // not logged in and trying to access protected pages, redirect to login
  if (!isAuthenticated && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)'],
};
