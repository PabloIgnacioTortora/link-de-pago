import { NextResponse } from 'next/server';
import { auth } from '@/auth';

const PROTECTED_PATHS = ['/dashboard', '/links', '/transactions', '/settings'];
const AUTH_PATHS = ['/login', '/register', '/forgot-password', '/reset-password'];

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  const isAuthPage = AUTH_PATHS.some((p) => pathname.startsWith(p));

  if (isProtected && !session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (session && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/dashboard/:path*', '/links/:path*', '/transactions/:path*', '/settings/:path*', '/login', '/register', '/forgot-password', '/reset-password'],
};
