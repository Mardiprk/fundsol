import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');

    if (!wallet) {
      return NextResponse.json(
        { success: false, message: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Get user campaigns with donation information
    const results = await db.execute({
      sql: `
        SELECT c.*, COUNT(d.id) as donation_count, COALESCE(SUM(d.amount), 0) as total_raised
        FROM campaigns c
        LEFT JOIN donations d ON c.id = d.campaign_id
        WHERE c.wallet_address = ?
        GROUP BY c.id
        ORDER BY c.created_at DESC
      `,
      args: [wallet]
    });

    return NextResponse.json({
      success: true,
      campaigns: results.rows
    });

  } catch (error) {
    console.error('Error fetching user campaigns:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch user campaigns', error: String(error) },
      { status: 500 }
    );
  }
} 