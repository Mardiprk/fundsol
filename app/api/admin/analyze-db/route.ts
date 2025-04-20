import { NextRequest, NextResponse } from 'next/server';
import { analyzeDatabase, getDatabaseStats, analyzeCommonQueries } from '@/lib/db-analyze';

export async function POST(request: NextRequest) {
  try {
    // This is an admin-only endpoint and should be protected
    // Add proper authentication check here in production
    
    // Run the database analysis and optimization
    const success = await analyzeDatabase();
    
    if (!success) {
      return NextResponse.json(
        { success: false, message: 'Failed to analyze database' },
        { status: 500 }
      );
    }
    
    // Get the updated database statistics
    const stats = await getDatabaseStats();
    
    // Analyze common queries to provide optimization insights
    const queryAnalysis = await analyzeCommonQueries();
    
    return NextResponse.json({
      success: true,
      message: 'Database analysis and optimization completed',
      stats,
      query_analysis: queryAnalysis,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error during database analysis:', error);
    return NextResponse.json(
      { success: false, message: 'Error during database analysis', error: String(error) },
      { status: 500 }
    );
  }
} 