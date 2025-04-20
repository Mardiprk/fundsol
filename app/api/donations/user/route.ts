import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const walletAddress = searchParams.get('walletAddress');

    if (!userId && !walletAddress) {
      return NextResponse.json(
        { success: false, message: 'User ID or wallet address is required' },
        { status: 400 }
      );
    }

    let donorId = userId;

    // If wallet address is provided but not user ID, look up the user ID
    if (!userId && walletAddress) {
      const userResult = await db.execute({
        sql: 'SELECT id FROM users WHERE wallet_address = ?',
        args: [walletAddress]
      });

      if (userResult.rows.length === 0) {
        return NextResponse.json({
          success: true,
          donations: []
        });
      }

      donorId = userResult.rows[0].id as string;
    }

    // Get user's donations with campaign details
    const results = await db.execute({
      sql: `
        SELECT d.id, d.amount, d.transaction_signature, d.created_at,
               c.id as campaign_id, c.title as campaign_title, c.slug as campaign_slug,
               c.image_url, c.end_date, c.goal_amount,
               (SELECT COALESCE(SUM(d2.amount), 0) FROM donations d2 WHERE d2.campaign_id = c.id) as total_raised
        FROM donations d
        JOIN campaigns c ON d.campaign_id = c.id
        WHERE d.donor_id = ?
        ORDER BY d.created_at DESC
      `,
      args: [donorId]
    });

    // Define interface for user donation row structure
    interface UserDonationRow {
      id: string;
      amount: string | number;
      transaction_signature: string;
      created_at: string;
      campaign_id: string;
      campaign_title: string;
      campaign_slug: string;
      image_url: string | null;
      end_date: string;
      goal_amount: string | number;
      total_raised: string | number;
    }

    // Format the results for the client
    const donations = results.rows.map((row) => {
      // Type assertion to treat database row as our UserDonationRow type
      const donationRow = row as unknown as UserDonationRow;
      
      return {
        id: donationRow.id,
        amount: donationRow.amount,
        transaction_signature: donationRow.transaction_signature,
        createdAt: donationRow.created_at,
        campaign: {
          id: donationRow.campaign_id,
          title: donationRow.campaign_title,
          slug: donationRow.campaign_slug,
          image_url: donationRow.image_url,
          end_date: donationRow.end_date,
          goalAmount: donationRow.goal_amount,
          total_raised: donationRow.total_raised
        }
      };
    });

    return NextResponse.json({
      success: true,
      donations
    });

  } catch (error) {
    console.error('Error fetching user donations:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch user donations', error: String(error) },
      { status: 500 }
    );
  }
} 