import { NextRequest, NextResponse } from 'next/server';
import { generateCsrfToken, setCsrfCookie, getCsrfTokenFromRequest } from '@/lib/csrf';

/**
 * GET - Get current CSRF token status or create a new one
 */
export async function GET(request: NextRequest) {
  // Get existing token if present
  const existingToken = getCsrfTokenFromRequest(request);
  
  // Create response
  const response = NextResponse.json({
    success: true,
    csrfExists: !!existingToken,
    csrfPreview: existingToken ? existingToken.substring(0, 4) + '...' : null,
    cookieCount: request.cookies.getAll().length,
    cookieNames: request.cookies.getAll().map(c => c.name)
  });
  
  // Set a new token if it doesn't exist or if force=true is specified
  const shouldRefresh = !existingToken || request.nextUrl.searchParams.get('refresh') === 'true';
  
  if (shouldRefresh) {
    const newToken = setCsrfCookie(response);
    return NextResponse.json({
      success: true,
      message: 'New CSRF token created',
      tokenPreview: newToken.substring(0, 4) + '...',
      token: newToken, // Send full token to client to ensure it's available immediately
    });
  }
  
  return response;
}

/**
 * POST - Test CSRF token validation
 */
export async function POST(request: NextRequest) {
  const csrfToken = request.headers.get('X-CSRF-Token');
  const cookieToken = getCsrfTokenFromRequest(request);
  
  // Return details about the tokens
  return NextResponse.json({
    success: true,
    receivedCsrfHeader: !!csrfToken,
    cookieTokenExists: !!cookieToken,
    headerToken: csrfToken ? `${csrfToken.substring(0, 4)}...` : null,
    cookieToken: cookieToken ? `${cookieToken.substring(0, 4)}...` : null,
    tokenMatch: csrfToken === cookieToken,
    allCookies: request.cookies.getAll().map(c => c.name)
  });
} 