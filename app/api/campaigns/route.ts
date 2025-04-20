import { NextRequest, NextResponse } from 'next/server';
import { db, verifyDatabase } from '@/lib/db';
import { campaignSchema } from '@/lib/validations';
import { v4 as uuidv4 } from 'uuid';
import { sanitizeHtml } from '@/lib/utils';
import { getCampaigns } from '@/lib/db-utils';
import { campaignCache } from '@/lib/cache';

// Enum for sort types to avoid string concatenation
enum SortType {
  NEWEST = 'created_at DESC',
  ENDING_SOON = 'end_date ASC',
  MOST_FUNDED = 'total_raised DESC',
  MOST_BACKERS = 'donation_count DESC',
}

// GET: Fetch campaigns with filtering
export async function GET(request: NextRequest) {
  try {
    // Verify database is initialized and has proper schema
    await verifyDatabase();
    
    const { searchParams } = new URL(request.url);
    
    // Get query parameters
    const slug = searchParams.get('slug') || undefined;
    const id = searchParams.get('id') || undefined;
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 20;
    const pageParam = searchParams.get('page');
    const page = pageParam ? parseInt(pageParam, 10) : 1;
    const category = searchParams.get('category') || undefined;
    const sortBy = searchParams.get('sort') || 'newest';
    const query = searchParams.get('q') || undefined;
    const walletAddress = searchParams.get('wallet') || undefined;
    
    // Use optimized campaign fetcher
    const campaigns = await getCampaigns({
      slug,
      id,
      category,
      walletAddress,
      searchQuery: query,
      sortBy: sortBy as any,
      page,
      limit,
    });

    return NextResponse.json({ 
      success: true, 
      campaigns 
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    
    // Return a generic error message to avoid exposing implementation details
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch campaigns'
    }, { status: 500 });
  }
}

// POST: Create a new campaign
export async function POST(request: NextRequest) {
  try {
    await verifyDatabase();
    
    const body = await request.json();
    
    // Use zod to validate the request body
    const result = campaignSchema.safeParse(body);
    
    if (!result.success) {
      const errorMessage = result.error.errors.map(e => 
        `${e.path.join('.')}: ${e.message}`
      ).join(', ');
      
      return NextResponse.json({
        success: false,
        message: 'Invalid campaign data',
        error: errorMessage
      }, { status: 400 });
    }
    
    const {
      title,
      summary,
      description,
      goalAmount,
      slug,
      endDate,
      category,
      imageUrl,
      hasMatching,
      matchingAmount,
      matchingSponsor
    } = result.data;
    
    // Get wallet address from request body
    const { walletAddress } = body;
    
    if (!walletAddress) {
      return NextResponse.json({
        success: false,
        message: 'Wallet address is required'
      }, { status: 400 });
    }
    
    // Sanitize HTML content in description to prevent XSS
    const sanitizedDescription = sanitizeHtml(description);
    
    // Check if a campaign with this slug already exists
    const existingCampaign = await db.execute({
      sql: 'SELECT id FROM campaigns WHERE slug = ?',
      args: [slug as string]
    });
    
    if (existingCampaign.rows.length > 0) {
      return NextResponse.json({
        success: false,
        message: 'A campaign with this slug already exists'
      }, { status: 409 });
    }
    
    // Create or find user ID based on wallet address
    let userId;
    const userResult = await db.execute({
      sql: 'SELECT id FROM users WHERE wallet_address = ?',
      args: [walletAddress]
    });
    
    if (userResult.rows.length > 0) {
      // User already exists
      userId = userResult.rows[0].id;
    } else {
      // Create a new user
      userId = uuidv4();
      const now = new Date().toISOString();
      
      await db.execute({
        sql: `
          INSERT INTO users (id, wallet_address, created_at, updated_at)
          VALUES (?, ?, ?, ?)
        `,
        args: [userId, walletAddress, now, now]
      });
    }
    
    // Create the campaign
    const campaignId = uuidv4();
    const now = new Date().toISOString();
    
    await db.execute({
      sql: `
        INSERT INTO campaigns (
          id, title, summary, description, goal_amount, slug, end_date, 
          category, image_url, wallet_address, creator_id, created_at, updated_at,
          has_matching, matching_amount, matching_sponsor
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        campaignId, 
        title, 
        summary || null, 
        sanitizedDescription, 
        goalAmount, 
        slug, 
        endDate, 
        category, 
        imageUrl || null, 
        walletAddress, 
        userId, 
        now, 
        now,
        hasMatching || false,
        matchingAmount || 0,
        matchingSponsor || null
      ]
    });
    
    // Clear the campaign cache for this wallet to ensure fresh data
    const cacheKeys = campaignCache.getKeys()
      .filter(key => key.includes(walletAddress));
    cacheKeys.forEach(key => campaignCache.delete(key));
    
    return NextResponse.json({
      success: true,
      message: 'Campaign created successfully',
      id: campaignId,
      slug: slug
    });
  } catch (error) {
    console.error('Error creating campaign:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to create campaign',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verify CSRF token
    const csrfToken = request.headers.get('X-CSRF-Token');
    if (!csrfToken) {
      return NextResponse.json({ 
        success: false, 
        message: 'CSRF token missing' 
      }, { status: 403 });
    }
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const walletAddress = searchParams.get('wallet');
    
    if (!id || !walletAddress) {
      return NextResponse.json({
        success: false,
        message: 'Campaign ID and wallet address are required'
      }, { status: 400 });
    }
    
    // Security: verify that the campaign belongs to the wallet owner
    const campaignCheck = await db.execute({
      sql: 'SELECT id FROM campaigns WHERE id = ? AND wallet_address = ?',
      args: [id, walletAddress]
    });
    
    if (campaignCheck.rows.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Campaign not found or you do not have permission to delete it'
      }, { status: 404 });
    }
    
    // First delete associated donations to maintain database integrity
    await db.execute({
      sql: 'DELETE FROM donations WHERE campaign_id = ?',
      args: [id]
    });
    
    // Then delete the campaign
    await db.execute({
      sql: 'DELETE FROM campaigns WHERE id = ?',
      args: [id]
    });
    
    return NextResponse.json({
      success: true,
      message: 'Campaign deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to delete campaign'
    }, { status: 500 });
  }
} 