import { db } from './db';

/**
 * Analyze the database to optimize query performance
 * This runs ANALYZE to collect statistics for the SQLite query planner
 */
export async function analyzeDatabase() {
  console.log('Analyzing database to optimize query performance...');
  
  try {
    // Run ANALYZE to gather statistics for the query planner
    await db.execute({ sql: 'ANALYZE' });
    
    // Create optimized indexes based on query patterns
    await createOptimizedIndexes();
    
    console.log('Database analysis completed successfully');
    return true;
  } catch (error) {
    console.error('Error analyzing database:', error);
    return false;
  }
}

/**
 * Create optimized indexes based on known query patterns
 */
async function createOptimizedIndexes() {
  console.log('Creating optimized indexes...');
  
  try {
    // Compound indexes for performance-critical queries
    const indexesToCreate = [
      // Index for campaign listing with category and sorting
      {
        name: 'idx_campaigns_category_end_date',
        sql: 'CREATE INDEX IF NOT EXISTS idx_campaigns_category_end_date ON campaigns(category, end_date)'
      },
      // Index for campaign listing with sorting by created date
      {
        name: 'idx_campaigns_category_created_at',
        sql: 'CREATE INDEX IF NOT EXISTS idx_campaigns_category_created_at ON campaigns(category, created_at DESC)'
      },
      // Index for donations by campaign with sorting
      {
        name: 'idx_donations_campaign_created',
        sql: 'CREATE INDEX IF NOT EXISTS idx_donations_campaign_created ON donations(campaign_id, created_at DESC)'
      },
      // Index for text search optimization (requires SQLite FTS extension)
      {
        name: 'idx_campaigns_title_summary_description',
        sql: 'CREATE INDEX IF NOT EXISTS idx_campaigns_title_summary_description ON campaigns(title, summary, description)'
      }
    ];
    
    // Execute index creation
    for (const index of indexesToCreate) {
      console.log(`Creating index: ${index.name}`);
      await db.execute({ sql: index.sql });
    }
    
    console.log('Optimized indexes created successfully');
  } catch (error) {
    console.error('Error creating optimized indexes:', error);
    throw error;
  }
}

/**
 * Get database statistics for performance tuning
 */
export async function getDatabaseStats() {
  try {
    // Get table row counts
    const tables = ['campaigns', 'donations', 'users'];
    const counts: Record<string, number> = {};
    
    for (const table of tables) {
      const result = await db.execute({
        sql: `SELECT COUNT(*) as count FROM ${table}`
      });
      counts[table] = Number(result.rows[0]?.count || 0);
    }
    
    // Get index list
    const indexesResult = await db.execute({
      sql: "SELECT name, tbl_name FROM sqlite_master WHERE type='index'"
    });
    
    const indexes = indexesResult.rows.map((row: any) => ({
      name: row.name,
      table: row.tbl_name
    }));
    
    // Get database size
    const pageCountResult = await db.execute({
      sql: 'PRAGMA page_count'
    });
    const pageSizeResult = await db.execute({
      sql: 'PRAGMA page_size'
    });
    
    const pageCount = Number(pageCountResult.rows[0]?.page_count || 0);
    const pageSize = Number(pageSizeResult.rows[0]?.page_size || 0);
    const dbSizeBytes = pageCount * pageSize;
    
    return {
      table_counts: counts,
      indexes,
      database_size_bytes: dbSizeBytes,
      database_size_mb: (dbSizeBytes / (1024 * 1024)).toFixed(2)
    };
  } catch (error) {
    console.error('Error getting database stats:', error);
    throw error;
  }
}

/**
 * Run explain plan on common queries to help with optimization
 */
export async function analyzeCommonQueries() {
  try {
    const queries = [
      {
        name: 'fetch_latest_campaigns',
        sql: 'EXPLAIN QUERY PLAN SELECT id, title, summary FROM campaigns ORDER BY created_at DESC LIMIT 10'
      },
      {
        name: 'fetch_campaign_by_slug',
        sql: 'EXPLAIN QUERY PLAN SELECT * FROM campaigns WHERE slug = ?',
        args: ['example-campaign']
      },
      {
        name: 'fetch_campaign_donations',
        sql: 'EXPLAIN QUERY PLAN SELECT * FROM donations WHERE campaign_id = ? ORDER BY created_at DESC LIMIT 10',
        args: ['some-campaign-id']
      },
      {
        name: 'fetch_user_donations',
        sql: 'EXPLAIN QUERY PLAN SELECT d.id, d.amount, c.title FROM donations d JOIN campaigns c ON d.campaign_id = c.id WHERE d.donor_id = ? LIMIT 10',
        args: ['some-user-id']
      }
    ];
    
    const results: Record<string, any> = {};
    
    for (const query of queries) {
      try {
        const result = await db.execute({
          sql: query.sql,
          args: query.args || []
        });
        results[query.name] = result.rows;
      } catch (error) {
        results[query.name] = { error: String(error) };
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error analyzing common queries:', error);
    throw error;
  }
} 