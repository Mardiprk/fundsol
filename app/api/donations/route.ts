import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

interface DonationRow {
  id: string;
  campaign_id: string;
  campaign_title: string;
  donor_id: string;
  amount: string | number;
  transaction_signature: string;
  created_at: string;
  image_url: string | null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!walletAddress) {
      return NextResponse.json(
        { success: false, message: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Get user ID from wallet address
    const userResult = await db.execute({
      sql: 'SELECT id FROM users WHERE wallet_address = ?',
      args: [walletAddress]
    });

    if (userResult.rows.length === 0) {
      // No donations found since user doesn't exist
      return NextResponse.json({ 
        success: true, 
        donations: [],
        total: 0,
        hasMore: false
      });
    }

    const userId = userResult.rows[0].id;

    // Get donations with campaign info
    const donations = await db.execute({
      sql: `
        SELECT 
          d.id, 
          d.campaign_id, 
          c.title as campaign_title,
          d.donor_id, 
          d.amount, 
          d.transaction_signature, 
          d.created_at,
          c.image_url
        FROM donations d
        JOIN campaigns c ON d.campaign_id = c.id
        WHERE d.donor_id = ?
        ORDER BY d.created_at DESC
        LIMIT ? OFFSET ?
      `,
      args: [userId, limit, offset]
    });

    // Get total count for pagination
    const countResult = await db.execute({
      sql: 'SELECT COUNT(*) as total FROM donations WHERE donor_id = ?',
      args: [userId]
    });

    const total = Number(countResult.rows[0].total || 0);
    
    // Transform the data
    const formattedDonations = donations.rows.map((donation: unknown) => {
      const donationRow = donation as DonationRow;
      return {
        id: donationRow.id,
        campaign_id: donationRow.campaign_id,
        campaign_title: donationRow.campaign_title,
        amount: Number(donationRow.amount),
        transaction_signature: donationRow.transaction_signature,
        created_at: donationRow.created_at,
        image_url: donationRow.image_url
      };
    });

    return NextResponse.json({
      success: true,
      donations: formattedDonations,
      total,
      hasMore: offset + limit < total
    });
  } catch (error) {
    console.error('Error fetching donations:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch donations' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify CSRF token
    const csrfToken = request.headers.get('X-CSRF-Token');
    if (!csrfToken) {
      return NextResponse.json({ 
        success: false, 
        message: 'CSRF token missing' 
      }, { status: 403 });
    }
    
    const body = await request.json();
    const { id, campaign_id, wallet_address, amount, transaction_signature } = body;

    // Validate required fields
    if (!campaign_id || !wallet_address || !amount || !transaction_signature) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Validate data types and formats
    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Amount must be a positive number' },
        { status: 400 }
      );
    }
    
    if (!/^[a-zA-Z0-9]{32,}$/.test(transaction_signature)) {
      return NextResponse.json(
        { success: false, message: 'Invalid transaction signature format' },
        { status: 400 }
      );
    }

    // Check for duplicate transaction signature
    const txCheck = await db.execute({
      sql: 'SELECT id FROM donations WHERE transaction_signature = ?',
      args: [transaction_signature]
    });

    if (txCheck.rows.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Donation with this transaction signature already exists' },
        { status: 409 }
      );
    }

    // Ensure the campaign exists and get its details
    const campaignCheck = await db.execute({
      sql: 'SELECT id, goal_amount, title, has_matching, matching_amount FROM campaigns WHERE id = ?',
      args: [campaign_id]
    });

    if (campaignCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Campaign not found' },
        { status: 404 }
      );
    }

    const campaign = campaignCheck.rows[0];
    
    // Ensure the user exists or create them
    const userCheck = await db.execute({
      sql: 'SELECT id FROM users WHERE wallet_address = ?',
      args: [wallet_address]
    });

    let donorId;
    const now = new Date().toISOString();

    if (userCheck.rows.length === 0) {
      // Create a new user
      donorId = uuidv4();
      await db.execute({
        sql: 'INSERT INTO users (id, wallet_address, created_at, updated_at) VALUES (?, ?, ?, ?)',
        args: [donorId, wallet_address, now, now]
      });
    } else {
      donorId = userCheck.rows[0].id;
      // Update the user's last updated time
      await db.execute({
        sql: 'UPDATE users SET updated_at = ? WHERE id = ?',
        args: [now, donorId]
      });
    }

    // Create the donation record with proper transaction handling
    try {
      // Begin a transaction for data consistency
      await db.execute({ sql: 'BEGIN TRANSACTION' });
      
      // Create the donation record
      const donationId = id || uuidv4();
      await db.execute({
        sql: 'INSERT INTO donations (id, campaign_id, donor_id, amount, transaction_signature, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        args: [donationId, campaign_id, donorId, amount, transaction_signature, now]
      });
      
      // Commit the transaction
      await db.execute({ sql: 'COMMIT' });
      
      return NextResponse.json({
        success: true,
        message: 'Donation recorded successfully',
        donationId,
        campaign: {
          id: campaign_id,
          title: campaign.title,
        }
      });
    } catch (error) {
      // Rollback in case of error
      await db.execute({ sql: 'ROLLBACK' });
      throw error; // Re-throw to be caught by the outer try-catch
    }
  } catch (error) {
    console.error('Error processing donation:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process donation' },
      { status: 500 }
    );
  }
} 