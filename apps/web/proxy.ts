import { NextRequest, NextResponse } from 'next/server';

const exactPublicRoutes = ['/'];
const prefixPublicRoutes = ['/login', '/register', '/verify-email'];
const authRoutes = ['/login', '/register', '/verify-email']; // redirect to dashboard if already logged in

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // check session cookie
  const sessionCookie = req.cookies.get('better-auth.session_token')?.value;
  const isAuthenticated = !!sessionCookie;

  const isPublicRoute =
    exactPublicRoutes.includes(pathname) ||
    prefixPublicRoutes.some((route) => pathname.startsWith(route));
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
