import { NextRequest, NextResponse } from 'next/server';

// Simple POST endpoint to test CSRF protection
export async function POST(request: NextRequest) {
  const csrfToken = request.headers.get('X-CSRF-Token');
  const cookieToken = request.cookies.get('csrf-token')?.value;
  
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