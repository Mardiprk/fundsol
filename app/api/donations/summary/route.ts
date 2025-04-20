import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaign_id');

    if (!campaignId) {
      return NextResponse.json(
        { success: false, message: 'Campaign ID is required' },
        { status: 400 }
      );
    }

    // Check if campaign exists
    const campaignCheck = await db.execute({
      sql: 'SELECT id, goal_amount FROM campaigns WHERE id = ?',
      args: [campaignId]
    });

    if (campaignCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Campaign not found' },
        { status: 404 }
      );
    }

    const campaign = campaignCheck.rows[0];
    const goalAmount = Number(campaign.goal_amount);

    // Get basic donation stats
    const donationStats = await db.execute({
      sql: `
        SELECT 
          COUNT(id) as donation_count,
          COALESCE(SUM(amount), 0) as total_raised,
          MAX(amount) as largest_donation,
          AVG(amount) as average_donation,
          MIN(created_at) as first_donation_date,
          MAX(created_at) as last_donation_date
        FROM donations
        WHERE campaign_id = ?
      `,
      args: [campaignId]
    });

    // Get unique donor count
    const donorCount = await db.execute({
      sql: `
        SELECT COUNT(DISTINCT donor_id) as unique_donors
        FROM donations
        WHERE campaign_id = ?
      `,
      args: [campaignId]
    });

    // Get recent donations
    const recentDonations = await db.execute({
      sql: `
        SELECT d.id, d.amount, d.created_at, d.transaction_signature, u.wallet_address
        FROM donations d
        JOIN users u ON d.donor_id = u.id
        WHERE d.campaign_id = ?
        ORDER BY d.created_at DESC
        LIMIT 5
      `,
      args: [campaignId]
    });

    const stats = donationStats.rows[0];
    const totalRaised = Number(stats.total_raised || 0);
    const donationCount = Number(stats.donation_count || 0);
    const progress = goalAmount > 0 ? Math.min(Math.round((totalRaised / goalAmount) * 100), 100) : 0;
    const uniqueDonors = Number(donorCount.rows[0]?.unique_donors || 0);
    const largestDonation = Number(stats.largest_donation || 0);
    const averageDonation = Number(stats.average_donation || 0);

    // Define interface for recent donation row structure
    interface RecentDonationRow {
      id: string;
      amount: string | number;
      created_at: string;
      transaction_signature: string;
      wallet_address: string;
    }

    return NextResponse.json({
      success: true,
      summary: {
        campaign_id: campaignId,
        goal_amount: goalAmount,
        total_raised: totalRaised,
        donation_count: donationCount,
        unique_donors: uniqueDonors,
        progress_percentage: progress,
        largest_donation: largestDonation,
        average_donation: averageDonation,
        first_donation_date: stats.first_donation_date,
        last_donation_date: stats.last_donation_date,
        recent_donations: recentDonations.rows.map((donation) => {
          // Type assertion to treat database row as our RecentDonationRow type
          const donationRow = donation as unknown as RecentDonationRow;
          return {
            ...donationRow,
            amount: Number(donationRow.amount)
          };
        })
      }
    });

  } catch (error) {
    console.error('Error fetching donation summary:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch donation summary', error: String(error) },
      { status: 500 }
    );
  }
} 