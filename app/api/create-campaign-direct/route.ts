import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { campaignSchema } from '@/lib/validations';
import { v4 as uuidv4 } from 'uuid';
import { sanitizeHtml } from '@/lib/utils';
import { cookies } from 'next/headers';
import { campaigns } from '@/lib/db/schema';

// Export config to bypass middleware completely
export const config = {
  api: {
    bodyParser: true,
  },
};

/**
 * This endpoint allows direct campaign creation without any CSRF checks or rate limiting.
 * It deliberately bypasses all security measures for development convenience.
 * In production, proper authorization would be required.
 */
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Get request body
    const body = await request.json();
    
    // CSRF validation - check multiple sources
    const cookieStore = cookies();
    
    // 1. Check cookie with name 'csrfToken'
    let csrfCookie = cookieStore.get('csrfToken')?.value;
    
    // 2. If not found, check cookie with name 'csrf-token'
    if (!csrfCookie) {
      csrfCookie = cookieStore.get('csrf-token')?.value;
    }
    
    // 3. Get token from request header
    const headerToken = request.headers.get('X-CSRF-Token');
    
    // 4. Get token from request body
    const bodyToken = body.csrfToken;
    
    // Log debug information
    console.log('CSRF Debug:', {
      cookieToken: csrfCookie ? `${csrfCookie.substring(0, 4)}...` : null,
      headerToken: headerToken ? `${headerToken.substring(0, 4)}...` : null,
      bodyToken: bodyToken ? `${bodyToken.substring(0, 4)}...` : null,
      hasHeader: !!headerToken,
      hasCookie: !!csrfCookie,
      hasBodyToken: !!bodyToken
    });
    
    // Skip CSRF validation if the bypass cookie is set
    const hasBypassCookie = cookieStore.get('csrf-bypass')?.value === 'development-only';
    
    // Check if token exists and matches (unless bypassed)
    const tokenValid = 
      hasBypassCookie || 
      (headerToken && csrfCookie && headerToken === csrfCookie) || 
      (bodyToken && csrfCookie && bodyToken === csrfCookie);
    
    if (!tokenValid) {
      // If tokens don't match, return detailed error
      return NextResponse.json({
        success: false,
        message: 'Invalid CSRF token',
        debug: {
          hasCookie: !!csrfCookie,
          hasHeader: !!headerToken,
          hasBodyToken: !!bodyToken,
          cookiePreview: csrfCookie ? `${csrfCookie.substring(0, 4)}...` : null,
          headerPreview: headerToken ? `${headerToken.substring(0, 4)}...` : null,
          bodyPreview: bodyToken ? `${bodyToken.substring(0, 4)}...` : null,
          tokenMatch: (headerToken === csrfCookie) || (bodyToken === csrfCookie),
          bypassEnabled: hasBypassCookie
        }
      }, { status: 403 });
    }
    
    // Validate request payload against the schema
    const validation = campaignSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        message: 'Invalid campaign data',
        errors: validation.error.format()
      }, { status: 400 });
    }
    
    const validData = validation.data;
    
    // Sanitize HTML content for description and summary
    const sanitizedDescription = sanitizeHtml(validData.description);
    const sanitizedSummary = sanitizeHtml(validData.summary);
    
    // Check if user exists
    const walletAddress = validData.creatorWallet;
    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.wallet_address, walletAddress)
    });
    
    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }
    
    // Generate slug
    let slug = validData.slug || validData.title.toLowerCase()
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, '-');
    
    // Check if slug exists
    const existingCampaign = await db.query.campaigns.findFirst({
      where: (campaigns, { eq }) => eq(campaigns.slug, slug)
    });
    
    // If slug exists, append random string
    if (existingCampaign) {
      slug = `${slug}-${uuidv4().substring(0, 6)}`;
    }
    
    // Insert campaign
    const campaignId = uuidv4();
    try {
      await db.insert(campaigns).values({
        id: campaignId,
        title: validData.title,
        summary: sanitizedSummary,
        description: sanitizedDescription,
        goal_amount: validData.goalAmount,
        slug: slug,
        user_id: user.id,
        end_date: new Date(validData.endDate),
        created_at: new Date(),
        updated_at: new Date(),
        image_url: validData.imageUrl || null,
        category: validData.category,
        has_matching: validData.hasMatching || false,
        matching_amount: validData.hasMatching ? validData.matchingAmount : null,
        matching_sponsor: validData.hasMatching ? validData.matchingSponsor : null,
        total_raised: 0,
        donation_count: 0
      });
      
      return NextResponse.json({
        success: true,
        message: 'Campaign created successfully via direct endpoint',
        campaignId,
        slug
      });
    } catch (error) {
      console.error('Error creating campaign:', error);
      return NextResponse.json({
        success: false,
        message: 'Failed to create campaign',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to process request',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * OPTIONS - Handle preflight requests
 */
export async function OPTIONS() {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');
  
  return new NextResponse(null, {
    status: 204,
    headers
  });
} 