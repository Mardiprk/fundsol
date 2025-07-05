import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { headers } from 'next/headers';
import { executeWithRetry } from '@/lib/db';

async function checkDatabaseConnection() {
  try {
    // Attempt to execute a simple query to check if the database is responsive
    const result = await executeWithRetry(
      'SELECT 1 as connected',
      []
    );
    
    return {
      connected: result && result.rows && result.rows.length > 0 && result.rows[0].connected === 1,
      error: null
    };
  } catch (error) {
    console.error('Database health check failed:', error);
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown database error'
    };
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check database connectivity
    const dbStatus = await checkDatabaseConnection();
    
    // Get headers safely
    const headersList = await headers();
    const headersObj = Object.fromEntries(headersList.entries());

    const response = NextResponse.json({
      success: true,
      status: 'online',
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      database: dbStatus,
      csrf: {
        exists: !!request.cookies.get('csrf-token')?.value,
      },
      headers: {
        received: headersObj
      }
    });

    // Set a new CSRF token if it doesn't exist or if force parameter is present
    const forceRefresh = request.nextUrl.searchParams.get('force') === 'true';
    if (forceRefresh || !request.cookies.get('csrf-token')?.value) {
      const newCsrfToken = uuidv4();
      response.cookies.set({
        name: 'csrf-token',
        value: newCsrfToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
      });
    }

    return response;
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      success: false,
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
} 