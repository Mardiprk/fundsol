'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { campaignCategories } from '@/lib/validations';
import { DonateButton } from '@/components/donate-button';
import { YouTubeEmbed } from '@/components/youtube-embed';
import { isYouTubeUrl } from '@/lib/utils';
import MDEditor from '@uiw/react-md-editor';
import { ShareButtons } from '@/components/share-buttons';

interface Creator {
  id: string;
  name?: string;
  walletAddress: string;
  verified: boolean;
  shortAddress: string;
}

interface Campaign {
  id: string;
  title: string;
  summary: string;
  description: string;
  goal_amount: number;
  slug: string;
  end_date: string;
  category: string;
  image_url: string | null;
  wallet_address: string;
  creator_id: string;
  created_at: string;
  updated_at: string;
  donation_count: number;
  total_raised: number;
  funding_percentage: number;
  has_matching: boolean;
  matching_amount: number;
  matching_sponsor: string | null;
  creator: Creator;
}

// Create a simple cache for campaigns
const campaignCache = new Map<string, {data: Campaign, timestamp: number}>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

export default function CampaignPage() {
  const params = useParams<{ slug: string }>();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [totalRaised, setTotalRaised] = useState(0);
  const [donationCount, setDonationCount] = useState(0);

  // Calculate progress with useMemo to avoid unnecessary recalculations
  const progress = useMemo(() => {
    if (!campaign || campaign.goal_amount <= 0) return 0;
    return Math.min(Math.round((totalRaised / campaign.goal_amount) * 100), 100);
  }, [campaign, totalRaised]);

  // Get category label using useMemo
  const categoryLabel = useMemo(() => {
    if (!campaign) return '';
    const categoryObj = campaignCategories.find(c => c.value === campaign.category);
    return categoryObj ? categoryObj.label : campaign.category;
  }, [campaign]);

  // Check if campaign has ended using useMemo
  const isEnded = useMemo(() => {
    if (!campaign) return false;
    const endDate = new Date(campaign.end_date);
    return endDate < new Date();
  }, [campaign]);

  // Memoize the fetch campaign function
  const fetchCampaign = useCallback(async (slug: string) => {
    try {
      setIsLoading(true);
      
      // Check cache first
      const now = Date.now();
      const cachedData = campaignCache.get(slug);
      
      if (cachedData && (now - cachedData.timestamp < CACHE_DURATION)) {
        // Use cached data if it's still valid
        const campaignData = cachedData.data;
        setCampaign(campaignData);
        setTotalRaised(campaignData.total_raised);
        setDonationCount(campaignData.donation_count);
        setIsLoading(false);
        return;
      }
      
      // Fetch from the correct API endpoint: /api/campaigns/[slug]
      const response = await fetch(`/api/campaigns/${slug}`);
      
      if (!response.ok) {
        // Log more details about the failed response
        let errorBody = 'Could not read error body';
        try {
          errorBody = await response.text(); // Try to read response text
        } catch (e) {}
        console.error(`API Error: Status ${response.status}, Body: ${errorBody}`);
        throw new Error('Failed to fetch campaign');
      }
      
      const data = await response.json();
      
      // The [slug] route returns the campaign directly, not nested in 'campaigns' array
      if (!data.success || !data.campaign) {
        throw new Error('Campaign not found');
      }
      
      const campaignData = data.campaign;
      
      // Convert numeric values
      campaignData.goal_amount = Number(campaignData.goal_amount);
      campaignData.total_raised = Number(campaignData.total_raised);
      campaignData.donation_count = Number(campaignData.donation_count);
      
      // Cache the result
      campaignCache.set(slug, {
        data: campaignData,
        timestamp: now
      });
      
      setCampaign(campaignData);
      setTotalRaised(campaignData.total_raised);
      setDonationCount(campaignData.donation_count);
    } catch (error) {
      console.error('Error fetching campaign:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (params.slug) {
      fetchCampaign(params.slug);
    }
    
    // Cleanup function
    return () => {
      // Cancel any pending requests if needed
    };
  }, [params.slug, fetchCampaign]);

  const handleDonationComplete = useCallback((amount: number) => {
    if (!campaign) return;
    
    // Update local state to reflect the new donation
    setTotalRaised(prevTotal => prevTotal + amount);
    setDonationCount(prevCount => prevCount + 1);
    
    // Update cache with new values
    const cachedCampaign = campaignCache.get(params.slug as string);
    if (cachedCampaign) {
      const updatedCampaign = {
        ...cachedCampaign.data,
        total_raised: cachedCampaign.data.total_raised + amount,
        donation_count: cachedCampaign.data.donation_count + 1
      };
      
      campaignCache.set(params.slug as string, {
        data: updatedCampaign,
        timestamp: cachedCampaign.timestamp
      });
    }
  }, [campaign, params.slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 container py-10 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full inline-block mb-4"></div>
            <p>Loading campaign details...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 container py-10 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Campaign Not Found</h1>
            <p className="mb-6">The campaign you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          </div>
        </main>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container px-4 py-4 md:py-10">
        <div className="max-w-4xl mx-auto">
          {/* Campaign Header */}
          <div className="mb-6 md:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-2">
              <h1 className="text-2xl md:text-3xl font-bold">{campaign.title}</h1>
              <span className="text-sm px-3 py-1 rounded-full bg-[#b5f265]/20 text-gray-800 dark:text-gray-100 w-fit font-medium">
                {categoryLabel}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-muted-foreground text-sm">
              <span className="flex items-center gap-1.5">
                Created by{' '}
                {campaign.creator.name ? (
                  <span className="font-medium text-foreground flex items-center">
                    {campaign.creator.name}
                    {campaign.creator.verified && (
                      <span className="ml-1 inline-flex items-center justify-center rounded-full bg-[#b5f265] w-4 h-4 text-xs" title="Verified creator">
                        ✓
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="font-mono text-xs">{campaign.creator.shortAddress}</span>
                )}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600"></span>
              <span className="text-sm">{new Date(campaign.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Campaign Media */}
          {campaign.image_url && (
            isYouTubeUrl(campaign.image_url) ? (
              <div className="mb-6 md:mb-8 rounded-xl overflow-hidden shadow-md">
                <YouTubeEmbed 
                  url={campaign.image_url} 
                  title={campaign.title}
                  className="w-full"
                />
              </div>
            ) : (
              <div className="relative w-full overflow-hidden mb-6 md:mb-8 rounded-xl shadow-md">
                <img
                  src={campaign.image_url}
                  alt={campaign.title}
                  className="w-full h-auto object-cover max-h-[300px] md:max-h-[500px]"
                />
              </div>
            )
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div className="md:col-span-2 space-y-5">
              <div>
                {campaign.summary && (
                  <div className="mb-5">
                    <p className="text-base md:text-lg text-gray-700 dark:text-gray-300 font-medium p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800">
                      {campaign.summary}
                    </p>
                  </div>
                )}
                <div className="flex justify-end mb-4">
                  <ShareButtons 
                    url={`/campaigns/${campaign.slug}`}
                    title={campaign.title}
                    description={campaign.summary || ''} 
                    className="flex-shrink-0"
                  />
                </div>
              </div>

              {/* Mobile donation info - visible only on small screens */}
              <div className="md:hidden rounded-lg border p-5 space-y-4 bg-card shadow-sm">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-muted-foreground flex items-center">
                      {isEnded ? (
                        <span className="inline-flex items-center">
                          <span className="h-2.5 w-2.5 bg-gray-400 rounded-full mr-2"></span>
                          Ended
                        </span>
                      ) : (
                        <span className="inline-flex items-center">
                          <span className="h-2.5 w-2.5 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                          Active
                        </span>
                      )}
                    </span>
                    <span className="font-medium text-[#b5f265] bg-[#b5f265]/10 px-3 py-0.5 rounded-full">
                      {progress}%
                    </span>
                  </div>
                  <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#b5f265] transition-all duration-500 ease-in-out"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-end pt-1">
                    <div>
                      <span className="text-2xl font-bold">{totalRaised} SOL</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">raised</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Goal: <span className="font-medium">{campaign.goal_amount} SOL</span>
                      </span>
                    </div>
                  </div>
                </div>

                {campaign.has_matching && (
                  <div className="p-4 bg-[#f7ffea] dark:bg-[#253615] rounded-md border border-[#b5f265] shadow-inner">
                    <div className="font-medium text-base mb-1 flex items-center">
                      <span className="mr-2">✨</span>
                      Donation Matching
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {campaign.matching_sponsor ? `${campaign.matching_sponsor} is` : 'The campaign creator is'} matching donations up to {campaign.matching_amount} SOL in total.
                    </p>
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 font-medium">
                      Your donation could have twice the impact!
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2">
                  <div className="text-sm text-muted-foreground flex items-center">
                    <span className="mr-1">👥</span>
                    {donationCount} supporter{donationCount !== 1 ? 's' : ''}
                  </div>

                  <div className={`text-xs flex items-center ${isEnded ? 'text-destructive' : 'text-muted-foreground'}`}>
                    <span className="mr-1">🗓️</span>
                    {isEnded ? 'Campaign has ended' : `Ends ${new Date(campaign.end_date).toLocaleDateString()}`}
                  </div>
                </div>

                <DonateButton 
                  campaignId={campaign.id}
                  campaignTitle={campaign.title}
                  isEnded={isEnded}
                  hasMatching={campaign.has_matching}
                  matchingAmount={campaign.matching_amount}
                  remainingMatchingAmount={Math.max(0, campaign.matching_amount - totalRaised)}
                  onDonationComplete={handleDonationComplete}
                />
              </div>

              <div className="prose dark:prose-invert max-w-none bg-white dark:bg-gray-900 rounded-lg border shadow-sm p-4 md:p-6">
                <h2 className="text-xl font-bold mb-4 border-b pb-2">About this campaign</h2>
                <MDEditor.Markdown 
                  source={campaign.description} 
                  style={{ 
                    padding: '0',
                    backgroundColor: 'transparent',
                    color: 'inherit'
                  }}
                  components={{
                    a: () => null, // Disable links
                  }}
                />
              </div>
            </div>

            {/* Desktop donation info - hidden on mobile */}
            <div className="hidden md:block md:col-span-1 space-y-6">
              <div className="rounded-lg border p-6 space-y-6 sticky top-20 shadow-sm bg-white dark:bg-gray-900">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-muted-foreground flex items-center">
                      {isEnded ? (
                        <span className="inline-flex items-center">
                          <span className="h-2 w-2 bg-gray-400 rounded-full mr-2"></span>
                          Ended
                        </span>
                      ) : (
                        <span className="inline-flex items-center">
                          <span className="h-2 w-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                          Active
                        </span>
                      )}
                    </span>
                    <span className="font-medium text-[#b5f265] bg-[#b5f265]/10 px-2 py-0.5 rounded">
                      {progress}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#b5f265] transition-all duration-500 ease-in-out"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div>
                      <span className="text-2xl font-bold">{totalRaised} SOL</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">raised</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Goal: <span className="font-medium">{campaign.goal_amount} SOL</span>
                      </span>
                    </div>
                  </div>
                </div>

                {campaign.has_matching && (
                  <div className="p-4 bg-[#f7ffea] dark:bg-[#253615] rounded-md border border-[#b5f265] shadow-inner">
                    <div className="font-medium text-sm mb-1 flex items-center">
                      <span className="mr-2">✨</span>
                      Donation Matching
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {campaign.matching_sponsor ? `${campaign.matching_sponsor} is` : 'The campaign creator is'} matching donations up to {campaign.matching_amount} SOL in total.
                    </p>
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 font-medium">
                      Your donation could have twice the impact!
                    </div>
                  </div>
                )}

                <div className="text-sm text-muted-foreground flex items-center">
                  <span className="mr-1">👥</span>
                  {donationCount} supporter{donationCount !== 1 ? 's' : ''}
                </div>

                <div className={`text-sm flex items-center ${isEnded ? 'text-destructive' : 'text-muted-foreground'}`}>
                  <span className="mr-1">🗓️</span>
                  {isEnded ? 'Campaign has ended' : `Ends on ${new Date(campaign.end_date).toLocaleDateString()}`}
                </div>

                <DonateButton 
                  campaignId={campaign.id}
                  campaignTitle={campaign.title}
                  isEnded={isEnded}
                  hasMatching={campaign.has_matching}
                  matchingAmount={campaign.matching_amount}
                  remainingMatchingAmount={Math.max(0, campaign.matching_amount - totalRaised)}
                  onDonationComplete={handleDonationComplete}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 