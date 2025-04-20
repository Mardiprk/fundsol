import { db } from './db';

// Define interface for PRAGMA table_info results
interface TableColumnInfo {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: string | null;
  pk: number;
}

export async function runMigrations() {
  console.log('Running database migrations...');
  
  try {
    // Migration 1: Add name and profile_completed columns to users table
    await addNameColumnToUsers();
    
    // Migration 2: Add summary column to campaigns table
    await addSummaryColumnToCampaigns();
    
    // Migration 3: Add matching columns to campaigns table
    await addMatchingColumnsToCampaigns();
    
    // Migration 4: Create indexes for performance optimization
    await createPerformanceIndexes();
    
    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Error running migrations:', error);
    throw error;
  }
}

async function addNameColumnToUsers() {
  try {
    // Check if the column already exists
    const tableInfo = await db.execute({
      sql: 'PRAGMA table_info(users)',
    });
    
    const columns = tableInfo.rows.map(row => (row as unknown as TableColumnInfo).name);
    
    if (!columns.includes('name')) {
      console.log('Adding name column to users table');
      await db.execute({
        sql: 'ALTER TABLE users ADD COLUMN name TEXT',
      });
    }
    
    if (!columns.includes('profile_completed')) {
      console.log('Adding profile_completed column to users table');
      await db.execute({
        sql: 'ALTER TABLE users ADD COLUMN profile_completed BOOLEAN DEFAULT 0',
      });
    }
    
    console.log('Users table migration completed');
  } catch (error) {
    console.error('Error adding columns to users table:', error);
    throw error;
  }
}

async function addSummaryColumnToCampaigns() {
  try {
    // Check if the column already exists
    const tableInfo = await db.execute({
      sql: 'PRAGMA table_info(campaigns)',
    });
    
    const columns = tableInfo.rows.map(row => (row as unknown as TableColumnInfo).name);
    
    if (!columns.includes('summary')) {
      console.log('Adding summary column to campaigns table');
      await db.execute({
        sql: 'ALTER TABLE campaigns ADD COLUMN summary TEXT',
      });
      console.log('Summary column added to campaigns table');
    } else {
      console.log('Summary column already exists in campaigns table');
    }
  } catch (error) {
    console.error('Error adding summary column to campaigns table:', error);
    throw error;
  }
}

async function addMatchingColumnsToCampaigns() {
  try {
    // Check if the columns already exist
    const tableInfo = await db.execute({
      sql: 'PRAGMA table_info(campaigns)',
    });
    
    const columns = tableInfo.rows.map(row => (row as unknown as TableColumnInfo).name);
    
    if (!columns.includes('has_matching')) {
      console.log('Adding has_matching column to campaigns table');
      await db.execute({
        sql: 'ALTER TABLE campaigns ADD COLUMN has_matching BOOLEAN DEFAULT 0',
      });
      console.log('has_matching column added to campaigns table');
    }
    
    if (!columns.includes('matching_amount')) {
      console.log('Adding matching_amount column to campaigns table');
      await db.execute({
        sql: 'ALTER TABLE campaigns ADD COLUMN matching_amount NUMERIC DEFAULT 0',
      });
      console.log('matching_amount column added to campaigns table');
    }
    
    if (!columns.includes('matching_sponsor')) {
      console.log('Adding matching_sponsor column to campaigns table');
      await db.execute({
        sql: 'ALTER TABLE campaigns ADD COLUMN matching_sponsor TEXT',
      });
      console.log('matching_sponsor column added to campaigns table');
    }
  } catch (error) {
    console.error('Error adding matching columns to campaigns table:', error);
    throw error;
  }
}

async function createPerformanceIndexes() {
  try {
    console.log('Creating performance indexes...');
    
    // Check existing indexes to avoid duplicates
    const indexesResult = await db.execute({
      sql: "SELECT name FROM sqlite_master WHERE type='index'"
    });
    
    const existingIndexes = indexesResult.rows.map(row => String(row.name));
    
    // Create indexes only if they don't exist
    const indexesToCreate = [
      {
        name: 'idx_campaigns_slug',
        sql: 'CREATE INDEX IF NOT EXISTS idx_campaigns_slug ON campaigns(slug)'
      },
      {
        name: 'idx_campaigns_wallet_address',
        sql: 'CREATE INDEX IF NOT EXISTS idx_campaigns_wallet_address ON campaigns(wallet_address)'
      },
      {
        name: 'idx_campaigns_category',
        sql: 'CREATE INDEX IF NOT EXISTS idx_campaigns_category ON campaigns(category)'
      },
      {
        name: 'idx_campaigns_created_at',
        sql: 'CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns(created_at)'
      },
      {
        name: 'idx_campaigns_end_date',
        sql: 'CREATE INDEX IF NOT EXISTS idx_campaigns_end_date ON campaigns(end_date)'
      },
      {
        name: 'idx_donations_campaign_id',
        sql: 'CREATE INDEX IF NOT EXISTS idx_donations_campaign_id ON donations(campaign_id)'
      },
      {
        name: 'idx_donations_donor_id',
        sql: 'CREATE INDEX IF NOT EXISTS idx_donations_donor_id ON donations(donor_id)'
      },
      {
        name: 'idx_users_wallet_address',
        sql: 'CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address)'
      }
    ];
    
    for (const index of indexesToCreate) {
      if (!existingIndexes.includes(index.name)) {
        console.log(`Creating index: ${index.name}`);
        await db.execute({ sql: index.sql });
      } else {
        console.log(`Index ${index.name} already exists`);
      }
    }
    
    console.log('Performance indexes created successfully');
  } catch (error) {
    console.error('Error creating performance indexes:', error);
    throw error;
  }
} 