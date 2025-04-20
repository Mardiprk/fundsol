import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { campaignCache, donationCache } from '@/lib/cache';
import { getCampaignDonationsSummary } from '@/lib/db-utils';

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
    
    if (!walletAddress) {
      return NextResponse.json(
        { success: false, message: 'Wallet address is required' },
        { status: 400 }
      );
    }
    
    // Check cache first
    const cacheKey = `donations:wallet:${walletAddress}`;
    const cachedDonations = donationCache.get(cacheKey);
    if (cachedDonations) {
      return NextResponse.json({ success: true, donations: cachedDonations });
    }
    
    // Get user ID from wallet
    const userResult = await db.execute({
      sql: 'SELECT id FROM users WHERE wallet_address = ?',
      args: [walletAddress],
    });
    
    if (userResult.rows.length === 0) {
      // If user doesn't exist, they have no donations
      return NextResponse.json({ success: true, donations: [] });
    }
    
    const userId = userResult.rows[0].id;
    
    // Get donations with campaign information
    const donationsQuery = `
      SELECT 
        d.id, d.amount, d.transaction_signature, d.created_at,
        c.id as campaign_id, c.title, c.slug, c.image_url, c.end_date,
        c.goal_amount, 
        (SELECT SUM(amount) FROM donations WHERE campaign_id = c.id) as total_raised
      FROM donations d
      JOIN campaigns c ON d.campaign_id = c.id
      WHERE d.donor_id = ?
      ORDER BY d.created_at DESC
    `;
    
    const donationsResult = await db.execute({
      sql: donationsQuery,
      args: [userId],
    });
    
    // Process results
    const donations = donationsResult.rows.map(row => {
      return {
        id: row.id,
        amount: Number(row.amount),
        transaction_signature: row.transaction_signature,
        createdAt: row.created_at,
        campaign: {
          id: row.campaign_id,
          title: row.title,
          slug: row.slug,
          image_url: row.image_url,
          end_date: row.end_date,
          goalAmount: Number(row.goal_amount),
          total_raised: Number(row.total_raised || 0),
        }
      };
    });
    
    // Cache the results
    donationCache.set(cacheKey, donations);
    
    return NextResponse.json({ success: true, donations });
  } catch (error) {
    console.error('Error fetching donations:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch donations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { id, campaign_id, wallet_address, amount, transaction_signature } = body;
    
    if (!id || !campaign_id || !wallet_address || !amount || !transaction_signature) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check if campaign exists
    const campaignResult = await db.execute({
      sql: 'SELECT id, wallet_address FROM campaigns WHERE id = ?',
      args: [campaign_id],
    });
    
    if (campaignResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Campaign not found' },
        { status: 404 }
      );
    }
    
    // Get or create user
    let userId;
    const userResult = await db.execute({
      sql: 'SELECT id FROM users WHERE wallet_address = ?',
      args: [wallet_address],
    });
    
    if (userResult.rows.length === 0) {
      // Create a new user
      userId = uuidv4();
      const now = new Date().toISOString();
      
      await db.execute({
        sql: 'INSERT INTO users (id, wallet_address, created_at, updated_at) VALUES (?, ?, ?, ?)',
        args: [userId, wallet_address, now, now],
      });
    } else {
      userId = userResult.rows[0].id;
    }
    
    // Create the donation
    const now = new Date().toISOString();
    
    await db.execute({
      sql: `
        INSERT INTO donations (id, campaign_id, donor_id, amount, transaction_signature, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      args: [id, campaign_id, userId, amount, transaction_signature, now],
    });
    
    // Clear all related cache entries
    const donorCacheKey = `donations:wallet:${wallet_address}`;
    donationCache.delete(donorCacheKey);
    
    // Clear campaign cache
    const campaignCacheKeys = campaignCache.getKeys().filter(key => 
      key.includes(campaign_id)
    );
    campaignCacheKeys.forEach(key => campaignCache.delete(key));
    
    // Clear donation summary cache for this campaign
    const donationSummaryKey = `donations:summary:${campaign_id}`;
    donationCache.delete(donationSummaryKey);
    
    // Get updated campaign stats
    const updatedStats = await getCampaignDonationsSummary(campaign_id);
    
    return NextResponse.json({
      success: true,
      message: 'Donation recorded successfully',
      donation_id: id,
      campaign_stats: updatedStats
    });
  } catch (error) {
    console.error('Error recording donation:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to record donation' },
      { status: 500 }
    );
  }
} 