import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { campaignSchema } from '@/lib/validations';
import { sanitizeHtml } from '@/lib/utils';

/**
 * GET a campaign by its slug
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    console.log(`API Route: Received request for slug: ${slug}`);

    if (!slug) {
      console.error('API Route Error: Campaign slug is missing');
      return NextResponse.json(
        { success: false, message: "Campaign slug is required" },
        { status: 400 }
      );
    }

    // Fetch the campaign by slug
    console.log(`API Route: Querying database for slug: ${slug}`);
    const result = await db.execute({
      sql: `
        SELECT c.*, u.name as creator_name
        FROM campaigns c
        LEFT JOIN users u ON c.creator_id = u.id
        WHERE c.slug = ?
      `,
      args: [slug]
    });
    
    console.log(`API Route: Database query returned ${result.rows.length} rows for slug: ${slug}`);

    if (result.rows.length === 0) {
      console.warn(`API Route Warning: Campaign not found for slug: ${slug}`);
      return NextResponse.json(
        { success: false, message: "Campaign not found" },
        { status: 404 }
      );
    }

    const campaign = result.rows[0];
    console.log(`API Route: Found campaign ID: ${campaign.id} for slug: ${slug}`);

    return NextResponse.json(
      { success: true, campaign },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching campaign:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to fetch campaign",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update a campaign by ID
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    
    if (!slug) {
      return NextResponse.json(
        { success: false, message: "Campaign slug is required" },
        { status: 400 }
      );
    }
    
    // Get request data
    const data = await request.json();
    
    // Validate update data
    const { keepExistingSlug, ...updateData } = data;
    const validation = campaignSchema.partial().safeParse(updateData);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Invalid campaign data", 
          errors: validation.error.format() 
        },
        { status: 400 }
      );
    }
    
    // Find the campaign
    const existingCampaign = await db.execute({
      sql: 'SELECT * FROM campaigns WHERE slug = ?',
      args: [slug]
    });
    
    if (existingCampaign.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Campaign not found" },
        { status: 404 }
      );
    }
    
    const campaign = existingCampaign.rows[0];
    
    // Build the update fields
    const updates: Record<string, any> = {};
    const validData = validation.data;
    
    // Add fields that are present in the request
    if (validData.title) updates.title = validData.title;
    if (validData.summary) updates.summary = sanitizeHtml(validData.summary);
    if (validData.description) updates.description = sanitizeHtml(validData.description);
    if (validData.goalAmount) updates.goal_amount = validData.goalAmount;
    if (validData.category) updates.category = validData.category;
    if (validData.imageUrl) updates.image_url = validData.imageUrl;
    if (validData.endDate) updates.end_date = validData.endDate;
    if (validData.hasMatching !== undefined) updates.has_matching = validData.hasMatching;
    if (validData.matchingAmount) updates.matching_amount = validData.matchingAmount;
    if (validData.matchingSponsor) updates.matching_sponsor = validData.matchingSponsor;
    
    // Handle slug update
    let newSlug = slug;
    if (validData.title && !keepExistingSlug) {
      // Generate a new slug from title
      newSlug = validData.title
        .toLowerCase()
        .replace(/[^\w\s]/gi, '')
        .replace(/\s+/g, '-');
      
      // Check if the new slug already exists (but not for this campaign)
      const slugCheck = await db.execute({
        sql: 'SELECT id FROM campaigns WHERE slug = ? AND id != ?',
        args: [newSlug, campaign.id]
      });
      
      if (slugCheck.rows.length > 0) {
        // If slug exists, append a random suffix
        newSlug = `${newSlug}-${Math.random().toString(36).substring(2, 7)}`;
      }
      
      updates.slug = newSlug;
    }
    
    // Only update if there are changes
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: true, message: "No changes to update" },
        { status: 200 }
      );
    }
    
    // Build SQL query for update
    const setStatements = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const updateValues = Object.values(updates);
    
    // Add updated_at and id for WHERE clause
    const now = new Date().toISOString();
    updateValues.push(now); // for updated_at
    updateValues.push(campaign.id); // for WHERE id = ?
    
    // Execute update
    await db.execute({
      sql: `UPDATE campaigns SET ${setStatements}, updated_at = ? WHERE id = ?`,
      args: updateValues
    });
    
    // Get updated campaign
    const updatedCampaign = await db.execute({
      sql: 'SELECT * FROM campaigns WHERE id = ?',
      args: [campaign.id]
    });
    
    return NextResponse.json(
      { 
        success: true, 
        message: "Campaign updated successfully",
        campaign: updatedCampaign.rows[0],
        slug: newSlug 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating campaign:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to update campaign",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
} 