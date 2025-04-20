import {  NextResponse } from 'next/server';
import { db, verifyDatabase } from '@/lib/db';

export async function GET() {
  try {
    // Verify the database is initialized
    const isValid = await verifyDatabase();
    
    // Get table counts
    const tables = [
      { name: 'campaigns', count: 0 },
      { name: 'users', count: 0 },
      { name: 'donations', count: 0 }
    ];
    
    for (const table of tables) {
      try {
        const result = await db.execute({
          sql: `SELECT COUNT(*) as count FROM ${table.name}`
        });
        table.count = Number(result.rows[0]?.count || 0);
      } catch (error) {
        console.error(`Error counting ${table.name}:`, error);
      }
    }
    
    return NextResponse.json({
      success: true,
      status: isValid ? 'ok' : 'error',
      message: isValid ? 'Database is properly initialized' : 'Database has issues',
      tables,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error checking database status:', error);
    return NextResponse.json({
      success: false,
      status: 'error',
      message: 'Failed to check database status',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 