import { db } from '@/lib/db';
import { generateSlug } from '@/lib/utils';

// GET: Fetch a single campaign by ID
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    
    if (!id) {
      return Response.json({ success: false, message: 'Campaign ID is required' }, { status: 400 });
    }

    const results = await db.execute({
      sql: `
        SELECT c.*, 
               COUNT(d.id) as donation_count, 
               COALESCE(SUM(d.amount), 0) as total_raised,
               (COALESCE(SUM(d.amount), 0) / c.goal_amount * 100) as funding_percentage,
               u.name as creator_name,
               u.profile_completed as creator_verified
        FROM campaigns c
        LEFT JOIN donations d ON c.id = d.campaign_id
        LEFT JOIN users u ON c.creator_id = u.id
        WHERE c.id = ?
        GROUP BY c.id
      `,
      args: [id]
    });

    if (results.rows.length === 0) {
      return Response.json({ success: false, message: 'Campaign not found' }, { status: 404 });
    }

    return Response.json({
      success: true,
      campaign: results.rows[0]
    });
  } catch (error) {
    console.error('Error fetching campaign:', error);
    return Response.json(
      { success: false, message: 'Failed to fetch campaign', error: String(error) },
      { status: 500 }
    );
  }
}

// PATCH: Update a campaign
export async function PATCH(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    
    if (!id) {
      return Response.json({ success: false, message: 'Campaign ID is required' }, { status: 400 });
    }

    const body = await request.json();

    const campaignResult = await db.execute({
      sql: 'SELECT * FROM campaigns WHERE id = ?',
      args: [id]
    });

    if (campaignResult.rows.length === 0) {
      return Response.json(
        { success: false, message: 'Campaign not found' },
        { status: 404 }
      );
    }

    const existingCampaign = campaignResult.rows[0];
    
    // Generate new slug if title changed and not keeping old one
    if (body.title && body.title !== existingCampaign.title && !body.keepExistingSlug) {
      const existingSlugsResult = await db.execute({
        sql: 'SELECT slug FROM campaigns WHERE id != ?',
        args: [id]
      });
      
      const existingSlugs = existingSlugsResult.rows.map(row => row.slug as string);
      body.slug = generateSlug(body.title, existingSlugs);
    }
      
    // Ensure slug is unique if changed
    if (body.slug && body.slug !== existingCampaign.slug) {
      const existingSlugCheck = await db.execute({
        sql: 'SELECT id FROM campaigns WHERE slug = ? AND id != ?',
        args: [body.slug, id]
      });
      
      if (existingSlugCheck.rows.length > 0) {
        const existingSlugsResult = await db.execute({
          sql: 'SELECT slug FROM campaigns',
          args: []
        });
        
        const existingSlugs = existingSlugsResult.rows.map(row => row.slug as string);
        body.slug = generateSlug(body.title || existingCampaign.title, existingSlugs);
      }
    }

    // Define type for SQL parameters to avoid 'any'
    type SQLParam = string | number | boolean | null;
    
    const updateFields: string[] = [];
    const args: SQLParam[] = [];

    const allowedFields = [
      'title', 'summary', 'description', 'goal_amount', 
      'slug', 'end_date', 'category', 'image_url'
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        args.push(body[field]);
      }
    }

    if (updateFields.length === 0) {
      return Response.json({
        success: false,
        message: 'No fields to update'
      }, { status: 400 });
    }

    updateFields.push('updated_at = ?');
    args.push(new Date().toISOString());
    args.push(id);

    await db.execute({
      sql: `
        UPDATE campaigns
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `,
      args
    });

    const updatedCampaignResult = await db.execute({
      sql: 'SELECT * FROM campaigns WHERE id = ?',
      args: [id]
    });

    return Response.json({
      success: true,
      message: 'Campaign updated successfully',
      campaign: updatedCampaignResult.rows[0]
    });
  } catch (error) {
    console.error('Error updating campaign:', error);
    return Response.json(
      { success: false, message: 'Failed to update campaign', error: String(error) },
      { status: 500 }
    );
  }
}

// DELETE: Delete a campaign
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    
    if (!id) {
      return Response.json({ success: false, message: 'Campaign ID is required' }, { status: 400 });
    }

    const campaignResult = await db.execute({
      sql: 'SELECT id FROM campaigns WHERE id = ?',
      args: [id]
    });

    if (campaignResult.rows.length === 0) {
      return Response.json(
        { success: false, message: 'Campaign not found' },
        { status: 404 }
      );
    }

    await db.execute({
      sql: 'DELETE FROM campaigns WHERE id = ?',
      args: [id]
    });

    return Response.json({
      success: true,
      message: 'Campaign deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return Response.json(
      { success: false, message: 'Failed to delete campaign', error: String(error) },
      { status: 500 }
    );
  }
}