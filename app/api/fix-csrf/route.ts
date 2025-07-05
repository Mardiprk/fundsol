import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  // Generate a new CSRF token
  const newCsrfToken = uuidv4();
  
  // Create response with token info
  const response = NextResponse.json({
    success: true,
    message: 'New CSRF token has been set',
    token: newCsrfToken,
  });
  
  // Set the CSRF token cookie - make it accessible to JavaScript
  response.cookies.set({
    name: 'csrf-token',
    value: newCsrfToken,
    httpOnly: false, // Allow JavaScript access
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', // Changed from strict to lax for better compatibility
    path: '/'
  });
  
  return response;
} 