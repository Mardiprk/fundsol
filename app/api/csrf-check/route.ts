import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Get the CSRF token from cookies
  const csrfToken = request.cookies.get('csrf-token')?.value;
  
  return NextResponse.json({
    success: true,
    csrfExists: !!csrfToken,
    csrfToken: csrfToken ? csrfToken.substring(0, 4) + '...' : null, // Only send a partial token for security
    cookieCount: request.cookies.getAll().length,
    allCookies: request.cookies.getAll().map(c => c.name)
  });
} 