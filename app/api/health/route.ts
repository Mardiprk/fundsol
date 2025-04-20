import { NextResponse } from 'next/server';
import {  executeWithRetry } from '@/lib/db';

export async function GET() {
  try {
    // Check database connectivity
    const dbStatus = await checkDatabaseConnection();
    
    // Return detailed health status
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      database: dbStatus,
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

async function checkDatabaseConnection() {
  try {
    // Simple query to check database connectivity
    const startTime = Date.now();
    const result = await executeWithRetry('SELECT 1 as value', [], 2);
    const responseTime = Date.now() - startTime;
    
    if (result && result.rows && result.rows.length > 0) {
      return { 
        connected: true,
        responseTime: `${responseTime}ms`, 
      };
    } else {
      return { 
        connected: false,
        error: 'Database returned an unexpected response' 
      };
    }
  } catch (error) {
    return { 
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown database error' 
    };
  }
} 