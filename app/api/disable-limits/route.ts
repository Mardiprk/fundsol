import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

/**
 * GET - Disable both CSRF validation and rate limiting
 * This endpoint sets a special cookie that signals the middleware
 * to bypass both CSRF token validation and rate limiting for this client.
 */
export async function GET(request: NextRequest) {
  const response = NextResponse.json({
    success: true,
    message: 'CSRF validation and rate limiting disabled for this session',
  });
  
  // Set a cookie that will be checked by middleware to bypass security checks
  response.cookies.set({
    name: 'csrf-bypass',
    value: 'development-only',
    path: '/',
    httpOnly: false, // Make it accessible to JavaScript
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    // Long expiration for development convenience
    maxAge: 60 * 60 * 24 * 7 // 7 days
  });
  
  // Also try to create a fresh CSRF token
  const csrfToken = uuidv4();
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