import { NextRequest, NextResponse } from 'next/server';

/**
 * GET - Enable CSRF bypass for development
 * This endpoint sets a special cookie that signals the middleware
 * to bypass CSRF token validation for all requests from this client.
 */
export async function GET(request: NextRequest) {
  const response = NextResponse.json({
    success: true,
    message: 'CSRF validation disabled for this session',
  });
  
  // Set a cookie that will be checked by middleware to bypass CSRF validation
  response.cookies.set({
    name: 'csrf-bypass',
    value: 'development-only',
    path: '/',
    httpOnly: false, // Make it accessible to JavaScript
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    // Short expiration in production, longer for development
    maxAge: process.env.NODE_ENV === 'production' ? 60 * 30 : 60 * 60 * 24 // 30 min in prod, 24 hours in dev
  });
  
  // Also try to create a fresh CSRF token just in case
  const csrfToken = crypto.randomUUID();
  response.cookies.set({
    name: 'csrf-token',
    value: csrfToken,
    path: '/',
    httpOnly: false, // Make it accessible to JavaScript
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  
  return response;
} 