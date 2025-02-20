// middleware.js
import { NextResponse } from 'next/server';

export function middleware(request) {
  // Add security headers
  const headers = new Headers(request.headers);
  
  // Prevent clickjacking
  headers.set('X-Frame-Options', 'DENY');
  
  // Enable strict transport security
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // Prevent MIME type sniffing
  headers.set('X-Content-Type-Options', 'nosniff');

  // Basic rate limiting (implement more sophisticated solution for production)
  const ip = request.headers.get('x-forwarded-for') || request.ip;
  // Here you would implement rate limiting logic using Redis or similar

  return NextResponse.next({
    request: {
      headers: headers,
    },
  });
}

export const config = {
  matcher: '/api/stream/:path*',
};