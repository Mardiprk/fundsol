import { NextRequest, NextResponse } from 'next/server';

/**
 * POST - Create a new campaign with no CSRF checks
 * This is a simplified version that just returns success for testing
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Log what we received but don't save it yet
    console.log('Campaign creation attempt with data:', {
      title: body.title,
      summary: body.summary?.substring(0, 20) + '...',
      walletAddress: body.walletAddress,
      hasSubmission: !!body
    });
    
    // For debugging purposes, return what was sent in the request body
    return NextResponse.json({
      success: true,
      message: 'Campaign received (CSRF bypass mode)',
      data: {
        ...body,
        id: 'temp-' + Math.random().toString(36).substring(2, 10),
        slug: body.slug || body.title?.toLowerCase().replace(/[^\w\s]/gi, '').replace(/\s+/g, '-'),
        created: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error processing campaign:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to process campaign',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 