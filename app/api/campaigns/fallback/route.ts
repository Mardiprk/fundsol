import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { campaigns, users } from '@/lib/db/schema';
import { v4 as uuidv4 } from 'uuid';
import { sql } from 'drizzle-orm';

/**
 * POST - Create a new campaign with FormData instead of JSON
 * This creates a more reliable campaign submission endpoint
 */
export async function POST(request: NextRequest) {
  try {
    // Parse formData instead of JSON for broader compatibility
    const formData = await request.formData();
    
    // Extract form fields with fallbacks for optional fields
    const title = formData.get('title') as string;
    const summary = formData.get('summary') as string || '';
    const description = formData.get('description') as string || '';
    const goalAmount = Number(formData.get('goalAmount')) || 0;
    const walletAddress = formData.get('walletAddress') as string;
    const imageUrl = formData.get('imageUrl') as string || '';
    const endDate = formData.get('endDate') as string;
    const category = formData.get('category') as string;
    
    // Auto-generate slug from title if not provided
    let slug = formData.get('slug') as string || '';
    if (!slug && title) {
      slug = title
        .toLowerCase()
        .replace(/[^\w\s]/gi, '')
        .replace(/\s+/g, '-');
    }
    
    // Basic validation
    if (!title || !walletAddress) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields: title, walletAddress'
      }, { status: 400 });
    }
    
    // Check for unique slug
    const existingCampaign = await db.select({ id: campaigns.id })
      .from(campaigns)
      .where(sql`LOWER(${campaigns.slug}) = LOWER(${slug})`)
      .get();
    
    if (existingCampaign) {
      // Append random string to make slug unique
      slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`;
    }
    
    // Find or create user
    let userId;
    const existingUser = await db.select({ id: users.id })
      .from(users)
      .where(sql`${users.wallet_address} = ${walletAddress}`)
      .get();
    
    if (existingUser) {
      userId = existingUser.id;
    } else {
      // Create new user
      const newUser = {
        id: uuidv4(),
        wallet_address: walletAddress,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        profile_completed: 0
      };
      
      await db.insert(users).values(newUser);
      userId = newUser.id;
    }
    
    // Create campaign
    const hasMatching = formData.get('hasMatching') === 'true';
    const matchingAmount = Number(formData.get('matchingAmount')) || 0;
    const matchingSponsor = formData.get('matchingSponsor') as string || '';
    
    const campaignId = uuidv4();
    const timestamp = new Date().toISOString();
    
    const campaignData = {
      id: campaignId,
      title,
      description,
      summary,
      goal_amount: goalAmount,
      slug,
      end_date: endDate,
      category,
      image_url: imageUrl,
      wallet_address: walletAddress,
      creator_id: userId,
      created_at: timestamp,
      updated_at: timestamp,
      has_matching: hasMatching,
      matching_amount: matchingAmount,
      matching_sponsor: matchingSponsor,
      donation_count: 0,
      total_raised: 0
    };
    
    await db.insert(campaigns).values(campaignData);
    
    return NextResponse.json({
      success: true,
      message: 'Campaign created successfully',
      campaign: {
        id: campaignId,
        slug,
        title,
        walletAddress
      }
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