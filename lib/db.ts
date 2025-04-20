import { createClient, type Value } from '@libsql/client';
import { runMigrations } from './db-migrations';

// Connection configuration with better error handling
const getDbConfig = () => {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  
  if (!url) {
    throw new Error('TURSO_DATABASE_URL environment variable is not set');
  }
  
  return {
    url,
    authToken,
  };
};

// Create database client with retry logic
const createDbClient = () => {
  try {
    const config = getDbConfig();
    console.log(`Connecting to database at ${config.url.split('?')[0]}`);
    return createClient(config);
  } catch (error) {
    console.error('Failed to create database client:', error);
    throw error;
  }
};

export const db = createDbClient();

// Create database tables if they don't exist
export async function initializeDatabase() {
  console.log('Initializing database...');
  
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS campaigns (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        summary TEXT,
        description TEXT NOT NULL,
        goal_amount INTEGER NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        end_date TEXT NOT NULL,
        category TEXT NOT NULL,
        image_url TEXT,
        wallet_address TEXT NOT NULL,
        creator_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        has_matching BOOLEAN DEFAULT 0,
        matching_amount NUMERIC DEFAULT 0,
        matching_sponsor TEXT
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS donations (
        id TEXT PRIMARY KEY,
        campaign_id TEXT NOT NULL,
        donor_id TEXT,
        amount INTEGER NOT NULL,
        transaction_signature TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        wallet_address TEXT UNIQUE NOT NULL,
        name TEXT,
        verified BOOLEAN DEFAULT 0,
        profile_completed BOOLEAN DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);
    
    // Run migrations to update existing tables
    await runMigrations();
    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Function to verify database schema and fix if needed
export async function verifyDatabase() {
  console.log('Verifying database schema...');
  try {
    // Check if campaigns table exists
    const tableCheck = await db.execute({
      sql: "SELECT name FROM sqlite_master WHERE type='table' AND name='campaigns'"
    });
    
    if (tableCheck.rows.length === 0) {
      console.log('Database tables not found. Initializing database...');
      await initializeDatabase();
      return true;
    }
    
    // Check if we have any campaigns
    const campaignCheck = await db.execute({
      sql: "SELECT COUNT(*) as count FROM campaigns"
    });
    
    const count = Number(campaignCheck.rows[0]?.count || 0);
    console.log(`Found ${count} campaigns in database`);
    
    return true;
  } catch (error) {
    console.error('Error verifying database:', error);
    console.log('Attempting to initialize database...');
    try {
      await initializeDatabase();
      return true;
    } catch (initError) {
      console.error('Failed to initialize database:', initError);
      return false;
    }
  }
}

// Helper function to execute database queries with retry logic
export async function executeWithRetry(sql: string, args?: Value[], maxRetries = 3) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await db.execute({ sql, args });
    } catch (error) {
      console.error(`Database query attempt ${attempt}/${maxRetries} failed:`, error);
      lastError = error;
      
      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.min(100 * Math.pow(2, attempt), 2000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
} 