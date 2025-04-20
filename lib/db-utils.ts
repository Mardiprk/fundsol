import { db } from './db';
import { campaignCache, userCache, donationCache } from './cache';

// Interface for pagination
export interface PaginationOptions {
  page?: number;
  limit?: number;
  offset?: number;
}

// Interface for campaign query options
export interface CampaignQueryOptions extends PaginationOptions {
  slug?: string;
  id?: string;
  category?: string;
  walletAddress?: string;
  searchQuery?: string;
  sortBy?: 'newest' | 'endingSoon' | 'mostFunded' | 'mostBackers';
  includeDonations?: boolean;
  includeCreator?: boolean;
}

// Define common table fields to avoid using SELECT *
const CAMPAIGN_FIELDS = [
  'id', 'title', 'summary', 'description', 'goal_amount', 
  'slug', 'end_date', 'category', 'image_url', 'wallet_address', 
  'creator_id', 'created_at', 'updated_at', 'has_matching',
  'matching_amount', 'matching_sponsor'
].join(', ');

const DONATION_FIELDS = [
  'id', 'campaign_id', 'donor_id', 'amount', 
  'transaction_signature', 'created_at'
].join(', ');

const USER_FIELDS = [
  'id', 'wallet_address', 'name', 'verified', 
  'profile_completed', 'created_at', 'updated_at'
].join(', ');

/**
 * Optimized function to get campaigns with caching and pagination
 */
export async function getCampaigns(options: CampaignQueryOptions = {}) {
  const {
    slug,
    id,
    category,
    walletAddress,
    searchQuery,
    sortBy = 'newest',
    page = 1,
    limit = 20,
    includeCreator = true,
    includeDonations = true,
  } = options;
  
  const offset = options.offset || (page - 1) * limit;
  
  // Generate cache key based on query parameters
  const cacheKey = `campaigns:${JSON.stringify({
    slug, id, category, walletAddress, searchQuery, sortBy, offset, limit
  })}`;
  
  // Check cache first
  const cachedResult = campaignCache.get(cacheKey);
  if (cachedResult) {
    return cachedResult;
  }
  
  // Prepare base query using specific fields instead of SELECT *
  let sqlQuery = `
    SELECT c.${CAMPAIGN_FIELDS}
  `;
  
  // Only include joins if needed
  if (includeCreator) {
    sqlQuery += `, u.name as creator_name, u.wallet_address as creator_wallet_address, u.verified as creator_verified`;
  }
  
  if (includeDonations) {
    sqlQuery += `, 
      COALESCE((SELECT COUNT(*) FROM donations WHERE campaign_id = c.id), 0) as donation_count,
      COALESCE((SELECT SUM(amount) FROM donations WHERE campaign_id = c.id), 0) as total_raised
    `;
  }
  
  sqlQuery += ` FROM campaigns c`;
  
  if (includeCreator) {
    sqlQuery += ` LEFT JOIN users u ON c.creator_id = u.id`;
  }
  
  const queryParams: (string | number)[] = [];
  const conditions: string[] = [];
  
  // Build WHERE conditions
  if (slug) {
    conditions.push('c.slug = ?');
    queryParams.push(slug);
  } else if (id) {
    conditions.push('c.id = ?');
    queryParams.push(id);
  } else {
    if (category && category !== 'all') {
      conditions.push('c.category = ?');
      queryParams.push(category);
    }
    
    if (walletAddress) {
      conditions.push('c.wallet_address = ?');
      queryParams.push(walletAddress);
    }
    
    if (searchQuery) {
      const sanitizedQuery = searchQuery.replace(/[%_]/g, '\\$&');
      conditions.push('(c.title LIKE ? OR c.description LIKE ? OR c.summary LIKE ?)');
      queryParams.push(`%${sanitizedQuery}%`, `%${sanitizedQuery}%`, `%${sanitizedQuery}%`);
    }
  }
  
  if (conditions.length > 0) {
    sqlQuery += ' WHERE ' + conditions.join(' AND ');
  }
  
  // Add ORDER BY
  sqlQuery += ' ORDER BY ';
  switch (sortBy) {
    case 'endingSoon':
      sqlQuery += 'c.end_date ASC';
      break;
    case 'mostFunded':
      if (includeDonations) {
        sqlQuery += 'total_raised DESC';
      } else {
        sqlQuery += 'c.created_at DESC';
      }
      break;
    case 'mostBackers':
      if (includeDonations) {
        sqlQuery += 'donation_count DESC';
      } else {
        sqlQuery += 'c.created_at DESC';
      }
      break;
    case 'newest':
    default:
      sqlQuery += 'c.created_at DESC';
  }
  
  // Add pagination
  sqlQuery += ' LIMIT ? OFFSET ?';
  queryParams.push(limit, offset);
  
  try {
    // Execute the query
    const result = await db.execute({
      sql: sqlQuery,
      args: queryParams,
    });
    
    // Transform the data
    const campaigns = result.rows.map(row => {
      const campaign = { ...row } as any;
      
      // Ensure numeric values
      if (campaign.goal_amount) campaign.goal_amount = Number(campaign.goal_amount);
      if (campaign.total_raised) campaign.total_raised = Number(campaign.total_raised);
      if (campaign.donation_count) campaign.donation_count = Number(campaign.donation_count);
      if (campaign.matching_amount) campaign.matching_amount = Number(campaign.matching_amount);
      
      // Calculate funding percentage
      if (campaign.total_raised && campaign.goal_amount) {
        campaign.funding_percentage = Math.min(
          Math.round((Number(campaign.total_raised) / Number(campaign.goal_amount)) * 100), 
          100
        );
      } else {
        campaign.funding_percentage = 0;
      }
      
      // Add creator object if available
      if (includeCreator && campaign.creator_name) {
        campaign.creator = {
          id: campaign.creator_id,
          name: campaign.creator_name,
          walletAddress: campaign.creator_wallet_address,
          verified: Boolean(campaign.creator_verified),
          shortAddress: campaign.creator_wallet_address 
            ? `${String(campaign.creator_wallet_address).slice(0, 4)}...${String(campaign.creator_wallet_address).slice(-4)}`
            : null,
        };
        
        // Clean up raw fields
        delete campaign.creator_name;
        delete campaign.creator_wallet_address;
        delete campaign.creator_verified;
      }
      
      return campaign;
    });
    
    // Cache the result
    campaignCache.set(cacheKey, campaigns);
    
    return campaigns;
  } catch (error) {
    console.error('Error in getCampaigns:', error);
    throw error;
  }
}

/**
 * Get donations for a campaign with caching and pagination
 */
export async function getCampaignDonations(campaignId: string, options: PaginationOptions = {}) {
  const { page = 1, limit = 20 } = options;
  const offset = options.offset || (page - 1) * limit;
  
  // Generate cache key
  const cacheKey = `donations:campaign:${campaignId}:${page}:${limit}`;
  
  // Check cache first
  const cachedResult = donationCache.get(cacheKey);
  if (cachedResult) {
    return cachedResult;
  }
  
  try {
    // First check if campaign exists
    const campaignExists = await db.execute({
      sql: 'SELECT 1 FROM campaigns WHERE id = ? LIMIT 1',
      args: [campaignId]
    });
    
    if (campaignExists.rows.length === 0) {
      throw new Error('Campaign not found');
    }
    
    // Get campaign donations with user information
    const results = await db.execute({
      sql: `
        SELECT d.${DONATION_FIELDS},
               u.name as donor_name, u.wallet_address as donor_wallet_address
        FROM donations d
        LEFT JOIN users u ON d.donor_id = u.id
        WHERE d.campaign_id = ?
        ORDER BY d.created_at DESC
        LIMIT ? OFFSET ?
      `,
      args: [campaignId, limit, offset]
    });
    
    // Get total count for pagination
    const countResult = await db.execute({
      sql: 'SELECT COUNT(*) as total FROM donations WHERE campaign_id = ?',
      args: [campaignId]
    });
    
    const total = Number(countResult.rows[0]?.total || 0);
    
    // Transform the data
    const donations = results.rows.map(row => {
      const donation = { ...row };
      
      // Ensure numeric values
      if (donation.amount) donation.amount = Number(donation.amount);
      
      return donation;
    });
    
    const result = {
      donations,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
    
    // Cache the result
    donationCache.set(cacheKey, result);
    
    return result;
  } catch (error) {
    console.error('Error in getCampaignDonations:', error);
    throw error;
  }
}

/**
 * Get donations summary (aggregated stats) for a campaign
 */
export async function getCampaignDonationsSummary(campaignId: string) {
  const cacheKey = `donations:summary:${campaignId}`;
  
  // Check cache first
  const cachedResult = donationCache.get(cacheKey);
  if (cachedResult) {
    return cachedResult;
  }
  
  try {
    const result = await db.execute({
      sql: `
        SELECT 
          COUNT(*) as donation_count,
          COALESCE(SUM(amount), 0) as total_raised,
          MAX(amount) as largest_donation,
          MIN(amount) as smallest_donation,
          AVG(amount) as average_donation
        FROM donations
        WHERE campaign_id = ?
      `,
      args: [campaignId]
    });
    
    if (result.rows.length === 0) {
      return {
        donation_count: 0,
        total_raised: 0,
        largest_donation: 0,
        smallest_donation: 0,
        average_donation: 0
      };
    }
    
    const summary = result.rows[0];
    
    // Ensure numeric values
    Object.keys(summary).forEach(key => {
      if (summary[key] !== null) {
        summary[key] = Number(summary[key]);
      }
    });
    
    // Cache the result
    donationCache.set(cacheKey, summary);
    
    return summary;
  } catch (error) {
    console.error('Error in getCampaignDonationsSummary:', error);
    throw error;
  }
} 