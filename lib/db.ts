import { createClient, type Value, LibsqlError, Transaction } from '@libsql/client';
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

/**
 * Executes a database query with a retry mechanism.
 *
 * WARNING: This function currently retries on ANY error encountered during query execution.
 * This can be problematic for non-transient errors (e.g., unique constraint violations,
 * SQL syntax errors, data validation errors from triggers) as retrying them will not
 * lead to success and may obscure the original issue or cause unintended side effects.
 *
 * RECOMMENDATION:
 * For production use, this function should be enhanced to:
 * 1. Identify specific, transient error codes or types that are safe to retry
 *    (e.g., network connection issues, temporary server unavailability, lock timeouts).
 *    Consult Turso/libSQL documentation for such error codes.
 * 2. Only retry when one of those specific transient errors is caught.
 *
 * USAGE GUIDANCE (Current State):
 * Until refined, use this function judiciously. It is best suited for operations where:
 * - Transient errors are a known concern.
 * - The operation is idempotent (retrying multiple times has the same effect as one successful attempt).
 * - Or, where the consequences of retrying a non-transient error are well understood and acceptable.
 *
 * Consider if the underlying @libsql/client offers any built-in retry strategies for
 * specific scenarios (like connection establishment) that might be leveraged or preferred.
 */
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

export async function executeInTransaction<T>(
  callback: (tx: Transaction) => Promise<T>
): Promise<T> {
  const tx = await db.transaction();
  try {
    const result = await callback(tx);
    await tx.commit();
    return result;
  } catch (error) {
    // Check if it's an error where rollback is possible/needed
    if (tx && typeof tx.rollback === 'function') {
      try {
        await tx.rollback();
      } catch (rollbackError) {
        console.error('Failed to rollback transaction:', rollbackError);
        // Potentially throw a combined error or the original error
      }
    }
    console.error('Transaction error:', error);
    throw error; // Re-throw the original error after attempting rollback
  }
}