import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { campaignCache, userCache, donationCache } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    // This is an administrative endpoint - it should be protected in production
    // with proper authentication and authorization

    // Run a simple query to get the most resource-intensive queries
    const result = await db.execute({
      sql: `SELECT * FROM sqlite_stat1 LIMIT 50`
    });

    // Get cache stats
    const cacheStats = {
      campaigns: {
        size: campaignCache.getKeys().length,
        keys: campaignCache.getKeys().slice(0, 10) // Just show first 10 keys to avoid huge response
      },
      users: {
        size: userCache.getKeys().length,
        keys: userCache.getKeys().slice(0, 10)
      },
      donations: {
        size: donationCache.getKeys().length,
        keys: donationCache.getKeys().slice(0, 10)
      }
    };

    // Get database file size
    const dbSizeResult = await db.execute({
      sql: `PRAGMA page_count`
    });
    const pageCount = Number(dbSizeResult.rows[0]?.page_count || 0);

    const pageSize = await db.execute({
      sql: `PRAGMA page_size`
    });
    const pageSizeBytes = Number(pageSize.rows[0]?.page_size || 0);

    const databaseSizeBytes = pageCount * pageSizeBytes;
    const databaseSizeMB = (databaseSizeBytes / (1024 * 1024)).toFixed(2);

    return NextResponse.json({
      success: true,
      table_stats: result.rows,
      cache_stats: cacheStats,
      database: {
        size_bytes: databaseSizeBytes,
        size_mb: databaseSizeMB,
        page_count: pageCount,
        page_size: pageSizeBytes
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching query stats:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch query statistics' },
      { status: 500 }
    );
  }
} 