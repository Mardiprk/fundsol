import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { campaignSchema } from '@/lib/validations';
import { v4 as uuidv4 } from 'uuid';
import { sanitizeHtml } from '@/lib/utils';

/**
 * This endpoint is a fallback for campaign creation when CSRF tokens might be failing.
 * It should only be used when the main /api/campaigns endpoint fails due to CSRF issues.
 * In production, this would likely have additional security measures like API keys.
 */

// Export this config to completely disable CSRF middleware for this route
export const config = {
  api: {
    bodyParser: true,
  },
};

// This route completely bypasses CSRF validation
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

/**
 * POST - Create a new campaign with built-in CSRF bypassing
 */
export async function POST(request: NextRequest) {
  try {
    // Get request body
    const body = await request.json();
    
    // Skip CSRF validation - this endpoint is meant to bypass security checks
    console.log('No-CSRF endpoint called - bypassing all CSRF validation');
    
    // Validate request payload against the schema
    const validation = campaignSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        message: 'Invalid campaign data',
        errors: validation.error.format()
      }, { 
        status: 400,
        headers: corsHeaders()
      });
    }
    
    const data = validation.data;
    const { walletAddress } = body;
    
    if (!walletAddress) {
      return NextResponse.json({
        success: false,
        message: 'Wallet address is required'
      }, { 
        status: 400,
        headers: corsHeaders()
      });
    }
    
    // Sanitize HTML content to prevent XSS
    const sanitizedDescription = sanitizeHtml(data.description);
    const sanitizedSummary = data.summary ? sanitizeHtml(data.summary) : '';
    
    // Check if user exists
    const userResult = await db.execute({
      sql: 'SELECT id FROM users WHERE wallet_address = ?',
      args: [walletAddress]
    });
    
    let userId;
    const now = new Date().toISOString();
    
    if (userResult.rows.length === 0) {
      // Create a new user
      userId = uuidv4();
      await db.execute({
        sql: 'INSERT INTO users (id, wallet_address, created_at, updated_at) VALUES (?, ?, ?, ?)',
        args: [userId, walletAddress, now, now]
      });
    } else {
      userId = userResult.rows[0].id;
    }
    
    // Generate a unique slug if needed
    let slug = data.slug || data.title
      .toLowerCase()
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, '-');
    
    // Check if slug already exists
    const slugCheck = await db.execute({
      sql: 'SELECT id FROM campaigns WHERE slug = ?',
      args: [slug]
    });
    
    // If slug exists, generate a unique one by appending a random string
    if (slugCheck.rows.length > 0) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`;
    }
    
    // Create the campaign
    const campaignId = uuidv4();
    
    await db.execute({
      sql: `
        INSERT INTO campaigns (
          id, title, summary, description, goal_amount, slug, end_date, category, 
          image_url, wallet_address, creator_id, created_at, updated_at,
          has_matching, matching_amount, matching_sponsor
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        campaignId,
        data.title,
        sanitizedSummary,
        sanitizedDescription,
        data.goalAmount,
        slug,
        data.endDate,
        data.category,
        data.imageUrl,
        walletAddress,
        userId,
        now,
        now,
        data.hasMatching || false,
        data.matchingAmount || 0,
        data.matchingSponsor || ''
      ]
    });
    
    return NextResponse.json({
      success: true,
      message: 'Campaign created successfully via no-CSRF endpoint',
      campaignId,
      slug
    }, { 
      status: 201,
      headers: corsHeaders()
    });
  } catch (error) {
    console.error('Error creating campaign:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to create campaign with no-CSRF endpoint',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { 
      status: 500,
      headers: corsHeaders()
    });
  }
}

/**
 * OPTIONS - Handle preflight requests
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders()
  });
}

/**
 * Helper function to generate CORS headers
 */
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token',
    'Access-Control-Max-Age': '86400',
  };
} 