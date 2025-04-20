import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/db';
import { analyzeDatabase } from '@/lib/db-analyze';

export async function GET() {
  try {
    // Initialize the database schema
    await initializeDatabase();
    
    // Run analysis and optimization
    await analyzeDatabase();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database initialized and optimized successfully'
    });
  } catch (error) {
    console.error('Error initializing database:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to initialize database', error: String(error) },
      { status: 500 }
    );
  }
} 