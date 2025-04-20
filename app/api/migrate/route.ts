import { NextResponse } from 'next/server';
import { runMigrations } from '@/lib/db-migrations';

export async function GET() {
  try {
    await runMigrations();
    
    return NextResponse.json({
      success: true,
      message: 'Database migrations completed successfully'
    });
  } catch (error) {
    console.error('Migration API error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to run database migrations', error: (error as Error).message },
      { status: 500 }
    );
  }
} 