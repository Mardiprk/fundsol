'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { campaignCategories } from '@/lib/validations';
import { CreateCampaignButton } from '@/components/create-campaign-button';
import { Search, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/lib/use-debounce';
import { isYouTubeUrl } from '@/lib/utils';
import { YouTubeEmbed } from '@/components/youtube-embed';

// Define Campaign interface based on the API response structure
interface Campaign {
  id: string;
  title: string;
  summary?: string;
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
  has_matching?: boolean;
  matching_amount?: number;
  matching_sponsor?: string | null;
  donation_count: number;
  total_raised: number;
  funding_percentage: number;
  creator: {
    id: string;
    name: string | null;
    walletAddress: string | null;
    verified: boolean;
    shortAddress: string | null;
  };
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  
  // Use debounce to prevent too many filter operations
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Fetch campaigns from API
  useEffect(() => {
    async function fetchCampaigns() {
      setIsLoading(true);
      try {
        const response = await fetch('/api/campaigns?limit=50');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // Transform the campaigns data to ensure numeric values
            const formattedCampaigns = data.campaigns.map((campaign: Campaign) => ({
              ...campaign,
              goal_amount: Number(campaign.goal_amount),
              total_raised: Number(campaign.total_raised || 0),
              donation_count: Number(campaign.donation_count || 0),
            }));
            
            setCampaigns(formattedCampaigns);
            setFilteredCampaigns(formattedCampaigns);
          }
        }
      } catch (error) {
        console.error('Error fetching campaigns:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchCampaigns();
  }, []);

  // Filter campaigns based on search query and category
  useEffect(() => {
    const filterCampaigns = () => {
      let filtered = [...campaigns];
      
      // Filter out ended campaigns
      filtered = filtered.filter(campaign => {
        const endDate = new Date(campaign.end_date);
        return endDate > new Date();
      });
      
      // Filter by search query
      if (debouncedSearchQuery.trim()) {
        const query = debouncedSearchQuery.toLowerCase();
        filtered = filtered.filter(campaign => 
          campaign.title.toLowerCase().includes(query) || 
          campaign.description.toLowerCase().includes(query)
        );
      }
      
      // Filter by category
      if (activeCategory !== 'all') {
        filtered = filtered.filter(campaign => campaign.category === activeCategory);
      }
      
      setFilteredCampaigns(filtered);
    };
    
    filterCampaigns();
  }, [campaigns, debouncedSearchQuery, activeCategory]);

  // Handle category selection
  const handleCategoryClick = (category: string) => {
    setActiveCategory(category);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero section */}
      <section className="w-full bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 border-b">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Discover Campaigns</h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              Find and support causes that matter to you on the Solana blockchain
            </p>
            
            {/* Search & filter */}
            <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <Input 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search campaigns..." 
                  className="w-full pl-10 pr-4 py-2 h-11 focus-visible:ring-[#b5f265] focus-visible:ring-offset-0"
                />
                {debouncedSearchQuery && (
                  <button
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    onClick={() => setSearchQuery('')}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1 container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Category quick filters */}
        <div className="flex overflow-x-auto pb-4 mb-8 gap-2 no-scrollbar">
          <Button 
            className={`${activeCategory === 'all' ? 'bg-[#b5f265] text-gray-900' : 'bg-transparent text-gray-600 border-gray-300 dark:border-gray-600'} hover:bg-[#a5e354] rounded-full px-4 shrink-0`}
            variant={activeCategory === 'all' ? 'default' : 'outline'}
            onClick={() => handleCategoryClick('all')}
          >
            All Categories
          </Button>
          {campaignCategories.slice(0, 6).map(category => (
            <Button 
              key={category.value} 
              variant={activeCategory === category.value ? 'default' : 'outline'} 
              className={`rounded-full px-4 shrink-0 ${
                activeCategory === category.value 
                  ? 'bg-[#b5f265] text-gray-900 hover:bg-[#a5e354]' 
                  : 'border-gray-300 dark:border-gray-600 hover:border-[#b5f265] hover:text-[#b5f265]'
              }`}
              onClick={() => handleCategoryClick(category.value)}
            >
              {category.label}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#b5f265]" />
            <span className="ml-2 text-gray-600 dark:text-gray-300">Loading campaigns...</span>
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="text-center p-12 border rounded-xl bg-white dark:bg-gray-800 shadow-md">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔍</span>
            </div>
            {searchQuery ? (
              <>
                <h3 className="text-xl font-medium mb-4">No matching campaigns found</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  We couldn&apos;t find any campaigns matching &quot;{searchQuery}&quot;. Try a different search term or browse all campaigns.
                </p>
                <Button 
                  onClick={() => {setSearchQuery(''); setActiveCategory('all');}}
                  className="bg-[#b5f265] hover:bg-[#a5e354] text-black font-medium rounded-xl px-6 py-3"
                >
                  Show All Campaigns
                </Button>
              </>
            ) : (
              <>
                <h3 className="text-xl font-medium mb-4">No campaigns yet</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  Be the first to create a campaign and start fundraising for a cause you care about!
                </p>
                <CreateCampaignButton 
                  className="bg-[#b5f265] hover:bg-[#a5e354] text-black font-medium rounded-xl px-6 py-3"
                >
                  Create Campaign
                </CreateCampaignButton>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                {searchQuery 
                  ? `Search Results${activeCategory !== 'all' ? ` in ${campaignCategories.find(c => c.value === activeCategory)?.label || activeCategory}` : ''}`
                  : activeCategory !== 'all' 
                    ? campaignCategories.find(c => c.value === activeCategory)?.label || activeCategory
                    : 'All Campaigns'
                }
              </h2>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Showing <span className="font-medium">{filteredCampaigns.length}</span> results
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredCampaigns.map((campaign) => {
                const endDate = new Date(campaign.end_date);
                const isEnded = endDate < new Date();
                const progress = campaign.goal_amount > 0 
                  ? Math.min(Math.round((campaign.total_raised / campaign.goal_amount) * 100), 100) 
                  : 0;

                // Find category label
                const categoryObj = campaignCategories.find(c => c.value === campaign.category);
                const categoryLabel = categoryObj ? categoryObj.label : campaign.category;

                return (
                  <Link href={`/campaigns/${campaign.slug}`} key={campaign.id}>
                    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 overflow-hidden h-full hover:shadow-md transition-all">
                      {/* Media - Edge to edge with no border radius */}
                      {campaign.image_url ? (
                        isYouTubeUrl(campaign.image_url) ? (
                          <div className="aspect-video w-full">
                            <YouTubeEmbed 
                              url={campaign.image_url} 
                              title={campaign.title} 
                              className="w-full h-full"
                            />
                          </div>
                        ) : (
                          <div className="aspect-video w-full">
                            <img
                              src={campaign.image_url}
                              alt={campaign.title}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )
                      ) : (
                        <div className="aspect-video w-full bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                          <span className="text-gray-400 dark:text-gray-500 text-sm">No Image</span>
                        </div>
                      )}
                      
                      <div className="p-3">
                        {/* Title and summary */}
                        <h3 className="font-medium text-base line-clamp-1">{campaign.title}</h3>
                        {campaign.summary && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                            {campaign.summary}
                          </p>
                        )}
                        
                        {/* Compact category tag */}
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs py-0.5 px-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                            {categoryLabel}
                          </span>
                          
                          <span className="text-xs text-gray-500">
                            {progress}% funded
                          </span>
                        </div>
                        
                        {/* Minimal progress bar */}
                        <div className="h-1 w-full bg-gray-100 dark:bg-gray-700 mt-2 mb-2">
                          <div
                            className="h-full bg-[#b5f265]"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                        
                        {/* Amount and time left */}
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-medium">
                            {campaign.total_raised}/{campaign.goal_amount} SOL
                          </span>
                          <span className={isEnded ? 'text-red-500' : 'text-gray-500'}>
                            {isEnded ? 'Ended' : `Ends ${endDate.toLocaleDateString()}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
} 