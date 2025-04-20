import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!campaignId) {
      return NextResponse.json(
        { success: false, message: 'Campaign ID is required' },
        { status: 400 }
      );
    }

    // Check if campaign exists
    const campaignCheck = await db.execute({
      sql: 'SELECT id FROM campaigns WHERE id = ?',
      args: [campaignId]
    });

    if (campaignCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Get campaign donations with user information
    const results = await db.execute({
      sql: `
        SELECT d.id, d.amount, d.transaction_signature, d.created_at,
               u.name as donor_name, u.wallet_address as donor_wallet_address
        FROM donations d
        JOIN users u ON d.donor_id = u.id
        WHERE d.campaign_id = ?
        ORDER BY d.created_at DESC
        LIMIT ? OFFSET ?
      `,
      args: [campaignId, limit, offset]
    });

    // Get donation count for pagination
    const countResult = await db.execute({
      sql: 'SELECT COUNT(*) as total FROM donations WHERE campaign_id = ?',
      args: [campaignId]
    });
    
    const total = Number(countResult.rows[0].total || 0);

    // Define interface for donation row structure
    interface DonationRow {
      id: string;
      amount: string | number;
      transaction_signature: string;
      created_at: string;
      donor_name: string | null;
      donor_wallet_address: string;
    }

    // Format the results for the client
    const donations = results.rows.map((row) => {
      // Type assertion to treat database row as our DonationRow type
      const donationRow = row as unknown as DonationRow;
      
      return {
        id: donationRow.id,
        amount: Number(donationRow.amount),
        transaction_signature: donationRow.transaction_signature,
        created_at: donationRow.created_at,
        donor: {
          name: donationRow.donor_name || 'Anonymous', // Show 'Anonymous' if user has no name
          wallet_address: donationRow.donor_wallet_address
        }
      };
    });

    return NextResponse.json({
      success: true,
      donations,
      pagination: {
        total,
        limit,
        offset,
        has_more: offset + limit < total
      }
    });

  } catch (error) {
    console.error('Error fetching campaign donations:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch campaign donations', error: String(error) },
      { status: 500 }
    );
  }
} 