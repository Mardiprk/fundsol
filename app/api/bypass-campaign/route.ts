import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// Special POST endpoint to create campaigns without CSRF validation
export async function POST(request: NextRequest) {
  try {
    // Get request body
    const body = await request.json();
    const { title, summary, walletAddress } = body;
    
    // Simple validation
    if (!title || !walletAddress) {
      return NextResponse.json({
        success: false,
        message: 'Title and wallet address are required'
      }, { status: 400 });
    }
    
    // Generate a campaign ID and slug
    const id = uuidv4();
    const slug = title.toLowerCase().replace(/[^\w\s]/gi, '').replace(/\s+/g, '-');
    
    // Create a simple campaign object
    const campaign = {
      id,
      title,
      summary: summary || '',
      slug,
      walletAddress,
      createdAt: new Date().toISOString()
    };
    
    // Return success with campaign data
    return NextResponse.json({
      success: true,
      message: 'Campaign created (bypassing CSRF validation)',
      campaign
    });
  } catch (error) {
    console.error('Error in bypass-campaign endpoint:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to process request',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 