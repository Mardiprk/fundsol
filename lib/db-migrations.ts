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