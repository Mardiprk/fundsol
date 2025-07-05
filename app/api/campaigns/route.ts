import { NextRequest, NextResponse } from 'next/server';
import { db, verifyDatabase } from '@/lib/db';
import { campaignSchema } from '@/lib/validations';
import { v4 as uuidv4 } from 'uuid';
import { sanitizeHtml } from '@/lib/utils';

// Enum for sort types to avoid string concatenation
enum SortType {
  NEWEST = 'created_at DESC',
  ENDING_SOON = 'end_date ASC',
  MOST_FUNDED = 'total_raised DESC',
  MOST_BACKERS = 'donation_count DESC',
}

export async function GET(request: NextRequest) {
  try {
    // Verify database is initialized and has proper schema
    await verifyDatabase();
    
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const id = searchParams.get('id');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : null;
    const category = searchParams.get('category');
    const sortBy = searchParams.get('sort') || 'newest';
    const query = searchParams.get('q');

    // Prepare base query with parameter placeholders
    let sqlQuery = `
      SELECT 
        c.*,
        u.name as creator_name,
        u.wallet_address as creator_wallet_address,
        COALESCE(
          (SELECT COUNT(*) FROM donations WHERE campaign_id = c.id), 
          0
        ) as donation_count,
        COALESCE(
          (SELECT SUM(amount) FROM donations WHERE campaign_id = c.id), 
          0
        ) as total_raised
      FROM campaigns c
      LEFT JOIN users u ON c.creator_id = u.id
    `;

    const queryParams: (string | number | boolean | Date)[] = [];
    const conditions: string[] = [];

    // Build WHERE conditions with parameterized queries
    if (slug) {
      conditions.push('c.slug = ?');
      queryParams.push(slug);
    } else if (id) {
      conditions.push('c.id = ?');
      queryParams.push(id);
    } else {
      // Only apply these filters for general listing, not specific campaign fetch
      if (category && category !== 'all') {
        conditions.push('c.category = ?');
        queryParams.push(category);
      }
      
      if (query) {
        // Safely handle search terms
        const sanitizedQuery = query.replace(/[%_]/g, '\\$&'); // Escape SQL wildcards
        conditions.push('(c.title LIKE ? OR c.description LIKE ?)');
        queryParams.push(`%${sanitizedQuery}%`);
        queryParams.push(`%${sanitizedQuery}%`);
      }
    }

    // Build complete query with appropriate sorting and limits
    if (conditions.length > 0) {
      sqlQuery += ' WHERE ' + conditions.join(' AND ');
    }

    // Add ORDER BY using a prepared statement approach to prevent SQL injection
    sqlQuery += ' ORDER BY ';
    switch (sortBy) {
      case 'endingSoon':
        sqlQuery += SortType.ENDING_SOON;
        break;
      case 'mostFunded':
        sqlQuery += SortType.MOST_FUNDED;
        break;
      case 'mostBackers':
        sqlQuery += SortType.MOST_BACKERS;
        break;
      case 'newest':
      default:
        sqlQuery += SortType.NEWEST;
    }

    // Add limit using parameterized query
    if (limit !== null && !isNaN(limit)) {
      sqlQuery += ' LIMIT ?';
      queryParams.push(limit);
    }

    // Execute the query with retry and parameterized values
    const result = await db.execute({
      sql: sqlQuery,
      args: queryParams,
    });

    // Safely transform the data
    interface CampaignRow {
      id: string;
      title: string;
      summary?: string;
      description: string;
      goal_amount: string | number;
      slug: string;
      end_date: string;
      category: string;
      image_url: string | null;
      wallet_address: string;
      creator_id: string;
      created_at: string;
      updated_at: string;
      has_matching?: boolean;
      matching_amount?: number;
      matching_sponsor?: string | null;
      // Joined fields
      creator_name: string | null;
      creator_wallet_address: string | null;
      // Calculated fields
      donation_count: string | number;
      total_raised: string | number;
      // For any other fields that might be included
      [key: string]: string | number | boolean | null | undefined;
    }

    const campaigns = result.rows.map((row) => {
      // Type assertion to treat database row as our CampaignRow type
      const campaignRow = row as unknown as CampaignRow;
      
      const totalRaised = Number(campaignRow.total_raised) || 0;
      const goalAmount = Number(campaignRow.goal_amount);
      
      // Calculate funding percentage, capped at 100%
      const fundingPercentage = goalAmount > 0 
        ? Math.min(Math.round((totalRaised / goalAmount) * 100), 100) 
        : 0;
      
      return {
        ...campaignRow,
        goal_amount: goalAmount,
        total_raised: totalRaised,
        funding_percentage: fundingPercentage,
        creator: {
          id: campaignRow.creator_id,
          name: campaignRow.creator_name,
          walletAddress: campaignRow.creator_wallet_address,
          verified: false,
          shortAddress: campaignRow.creator_wallet_address 
            ? `${campaignRow.creator_wallet_address.slice(0, 4)}...${campaignRow.creator_wallet_address.slice(-4)}`
            : null,
        },
      };
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

export async function POST(request: NextRequest) {
  try {
    // Get request body
    const body = await request.json();
    
    // Validate request payload against the schema
    const validation = campaignSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        message: 'Invalid campaign data',
        errors: validation.error.format()
      }, { status: 400 });
    }
    
    const data = validation.data;
    const { walletAddress } = body;
    
    if (!walletAddress) {
      return NextResponse.json({
        success: false,
        message: 'Wallet address is required'
      }, { status: 400 });
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
    let slug = data.slug || slugify(data.title);
    
    // Check if slug already exists
    const slugCheck = await db.execute({
      sql: 'SELECT id FROM campaigns WHERE slug = ?',
      args: [slug]
    });
    
    // If slug exists, generate a unique one by appending a number
    if (slugCheck.rows.length > 0) {
      let counter = 1;
      let newSlug = `${slug}-${counter}`;
      
      while (true) {
        const newSlugCheck = await db.execute({
          sql: 'SELECT id FROM campaigns WHERE slug = ?',
          args: [newSlug]
        });
        
        if (newSlugCheck.rows.length === 0) {
          slug = newSlug;
          break;
        }
        
        counter++;
        newSlug = `${slug}-${counter}`;
      }
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
        data.matchingSponsor || null
      ]
    });
    
    return NextResponse.json({
      success: true,
      message: 'Campaign created successfully',
      campaignId,
      slug
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating campaign:', error);
    
    // Return a generic error message to avoid exposing implementation details
    return NextResponse.json({
      success: false,
      message: 'Failed to create campaign. Please try again later.'
    }, { status: 500 });
  }
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function DELETE(request: NextRequest) {
  try {
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