import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Test database connection
    const tables = await db.execute(`
      SELECT name FROM sqlite_master WHERE type='table';
    `);

    // Get row counts for each table
    const userCount = await db.execute(`
      SELECT COUNT(*) as count FROM users;
    `);

    const campaignCount = await db.execute(`
      SELECT COUNT(*) as count FROM campaigns;
    `);

    const donationCount = await db.execute(`
      SELECT COUNT(*) as count FROM donations;
    `);

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      tables: tables.rows,
      counts: {
        users: userCount.rows[0].count,
        campaigns: campaignCount.rows[0].count,
        donations: donationCount.rows[0].count
      }
    });
  } catch (error) {
    console.error('Error testing database connection:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to test database connection', error: String(error) },
      { status: 500 }
    );
  }
} 