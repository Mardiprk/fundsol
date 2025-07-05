import { v4 as uuidv4 } from 'uuid';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Generate a new CSRF token
 */
export function generateCsrfToken(): string {
  return uuidv4();
}

/**
 * Client-side: Get CSRF token from cookies
 */
export function getClientCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  
  const match = document.cookie.match(new RegExp('(^| )csrf-token=([^;]+)'));
  return match ? match[2] : null;
}

/**
 * Client-side: Force a CSRF token to exist
 * This should be called before making API requests
 */
export function ensureCsrfToken(): string {
  if (typeof document === 'undefined') return '';
  
  // Check if token already exists
  const existingToken = getClientCsrfToken();
  if (existingToken) return existingToken;
  
  // Create a new token if one doesn't exist
  const newToken = generateCsrfToken();
  document.cookie = `csrf-token=${newToken}; path=/; SameSite=Lax`;
  
  return newToken;
}

/**
 * Client-side: Add CSRF token to headers for client-side requests
 */
export function addCsrfToHeaders(headers: HeadersInit = {}): HeadersInit {
  // Ensure a token exists before trying to add it to headers
  const token = ensureCsrfToken();
  const headersObj = headers instanceof Headers 
    ? Object.fromEntries(headers.entries()) 
    : { ...headers };
  
  return {
    ...headersObj,
    'X-CSRF-Token': token,
  };
}

// Server-side CSRF functionality
// These functions will only be imported in server components/API routes

/**
 * Server-side: Set a CSRF token cookie in a response
 */
export function setCsrfCookie(response: NextResponse): string {
  const token = generateCsrfToken();
  
  response.cookies.set({
    name: 'csrf-token',
    value: token,
    // Make it accessible to JavaScript
    httpOnly: false,
    // Use 'lax' for better compatibility across browsers
    sameSite: 'lax', 
    // Secure in production
    secure: process.env.NODE_ENV === 'production',
    path: '/'
  });
  
  return token;
}

/**
 * Server-side: Get CSRF token from request cookies
 */
export function getCsrfTokenFromRequest(request: NextRequest): string | undefined {
  return request.cookies.get('csrf-token')?.value;
}

/**
 * Server-side: Validate CSRF token in a request
 */
export function validateCsrfToken(request: NextRequest): boolean {
  const requestToken = request.headers.get('X-CSRF-Token');
  const cookieToken = request.cookies.get('csrf-token')?.value;
  
  if (!requestToken || !cookieToken) {
    return false;
  }
  
  return requestToken === cookieToken;
}

/**
 * Server-side: Create a response with CSRF error
 */
export function createCsrfErrorResponse(debug: any = {}): NextResponse {
  return NextResponse.json({
    success: false,
    message: 'Invalid CSRF token',
    debug
  }, {
    status: 403,
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Invalid': 'true'
    }
  });
} 