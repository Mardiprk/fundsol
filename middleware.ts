import { NextResponse, NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// Simple in-memory rate limiter
// NOTE: For production, use a Redis-based rate limiter instead of this in-memory solution
const ipRequestCounts = new Map<string, { count: number, resetTime: number }>();
const RATE_LIMIT_RESET_TIME = 60 * 1000; // 1 minute in milliseconds
const MAX_REQUESTS_PER_MINUTE = 100; // General rate limit
const MAX_WRITE_REQUESTS_PER_MINUTE = 10; // Stricter limit for POST/PUT/DELETE

export default function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Add CSRF token if not present
  const csrfToken = request.cookies.get('csrf-token')?.value;
  if (!csrfToken) {
    const newCsrfToken = uuidv4();
    // Set CSRF token cookie - secure, httpOnly, SameSite=Strict
    response.cookies.set({
      name: 'csrf-token',
      value: newCsrfToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    });
  }
  // Apply rate limiting
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
             request.headers.get('x-real-ip') || 
             'unknown';
  const currentTime = Date.now();
  
  if (!ipRequestCounts.has(ip)) {
    ipRequestCounts.set(ip, { count: 1, resetTime: currentTime + RATE_LIMIT_RESET_TIME });
  } else {
    const data = ipRequestCounts.get(ip)!;
    
    // Reset count if time has passed
    if (currentTime > data.resetTime) {
      data.count = 1;
      data.resetTime = currentTime + RATE_LIMIT_RESET_TIME;
    } else {
      data.count++;
      
      // Check if exceeded rate limit
      const isWriteRequest = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method);
      const maxRequests = isWriteRequest ? MAX_WRITE_REQUESTS_PER_MINUTE : MAX_REQUESTS_PER_MINUTE;
      
      if (data.count > maxRequests) {
        return new NextResponse(JSON.stringify({
          success: false,
          message: 'Too many requests, please try again later'
        }), {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60'
          }
        });
      }
    }
    
    ipRequestCounts.set(ip, data);
  }
  
  // Clean up old entries every 5 minutes
  if (Math.random() < 0.01) { // 1% chance to clean up on each request to avoid doing it too often
    const now = Date.now();
    for (const [key, value] of ipRequestCounts.entries()) {
      if (now > value.resetTime) {
        ipRequestCounts.delete(key);
      }
    }
  }

  // Set security headers
  const nonce = Buffer.from(uuidv4()).toString('base64');
  
  // Content Security Policy - fixed to remove newlines and extra whitespace
  response.headers.set(
    'Content-Security-Policy',
    `default-src 'self'; script-src 'self' 'nonce-${nonce}' https://cdn.jsdelivr.net https://*.solana.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https://* blob:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://*.solana.com wss://*.solana.com; frame-src 'self' https://www.youtube.com https://youtube.com; frame-ancestors 'none'; form-action 'self'; object-src 'none'; base-uri 'self';`
  );
  
  // Add other security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
  
  // Enable CORS for API routes only
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/');
  if (isApiRoute) {
    response.headers.set('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token');
    response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 204, headers: response.headers });
    }
    
    // Check CSRF token for mutating operations
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
      const requestCsrfToken = request.headers.get('X-CSRF-Token');
      
      if (!requestCsrfToken || requestCsrfToken !== csrfToken) {
        return new NextResponse(JSON.stringify({
          success: false,
          message: 'Invalid CSRF token'
        }), {
          status: 403,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
    }
  }

  return response;
} 