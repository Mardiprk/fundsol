'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter, Loader2, TrendingUp, Users, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { campaignCategories } from '@/lib/validations';
import { cn } from '@/lib/utils';

interface Campaign {
  id: string;
  title: string;
  description: string;
  goal_amount: number;
  slug: string;
  end_date: string;
  category: string;
  image_url: string | null;
  wallet_address: string;
  creator_id: string;
  created_at: string;
  donation_count: number;
  total_raised: number;
  funding_percentage?: number;
  creator?: {
    id?: string;
    name?: string;
    walletAddress?: string;
    shortAddress?: string;
    verified?: boolean;
  };
}

export default function ExplorePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || '');
  const [sortBy, setSortBy] = useState<string>(searchParams.get('sort') || 'newest');

  useEffect(() => {
    async function fetchCampaigns() {
      setIsLoading(true);
      try {
        // Build query parameters
        const params = new URLSearchParams();
        if (searchQuery) params.append('q', searchQuery);
        if (selectedCategory) params.append('category', selectedCategory);
        params.append('sort', sortBy);

        console.log(`Fetching campaigns with params: ${params.toString()}`);
        const response = await fetch(`/api/campaigns?${params.toString()}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('API error:', errorData);
          throw new Error(errorData.message || 'Failed to fetch campaigns');
        }

        const data = await response.json();
        console.log('API response:', data);
        
        if (!data.success) {
          throw new Error(data.message || 'Failed to fetch campaigns');
        }
        
        if (!data.campaigns || !Array.isArray(data.campaigns)) {
          console.error('Invalid campaign data format:', data);
          setCampaigns([]);
          return;
        }
        
        // Convert numeric values from string to number if needed
        const processedCampaigns = data.campaigns.map((campaign: Omit<Campaign, 'goal_amount' | 'total_raised' | 'donation_count'> & {
          goal_amount: string | number;
          total_raised: string | number;
          donation_count: string | number;
        }) => {
          return {
            ...campaign,
            goal_amount: Number(campaign.goal_amount),
            total_raised: Number(campaign.total_raised),
            donation_count: Number(campaign.donation_count)
          };
        });
        
        setCampaigns(processedCampaigns);
      } catch (error) {
        console.error('Error fetching campaigns:', error);
        setCampaigns([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCampaigns();
  }, [searchQuery, selectedCategory, sortBy]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const query = formData.get('searchQuery') as string;
    setSearchQuery(query);

    // Update URL
    const params = new URLSearchParams(searchParams.toString());
    if (query) params.set('q', query);
    else params.delete('q');
    router.push(`/explore?${params.toString()}`);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    
    // Update URL
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set('category', value);
    else params.delete('category');
    router.push(`/explore?${params.toString()}`);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    
    // Update URL
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', value);
    router.push(`/explore?${params.toString()}`);
  };

  const getSortLabel = (sort: string) => {
    switch (sort) {
      case 'newest': return 'Newest';
      case 'endingSoon': return 'Ending Soon';
      case 'mostFunded': return 'Most Funded';
      case 'mostBackers': return 'Most Backers';
      default: return 'Newest';
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <section className="w-full bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 border-b">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-3">Explore Campaigns</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              Discover and support fundraising campaigns from creators around the world
            </p>
            
            <form onSubmit={handleSearch} className="flex w-full max-w-2xl gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
                <Input
                  name="searchQuery"
                  placeholder="Search campaigns..."
                  defaultValue={searchQuery}
                  className="pl-10 h-11 focus-visible:ring-[#b5f265] focus-visible:ring-offset-0"
                />
              </div>
              <Button 
                type="submit" 
                className="bg-[#b5f265] hover:bg-[#a5e354] text-gray-900 font-medium h-11"
              >
                Search
              </Button>
            </form>
          </div>
        </div>
      </section>
      
      <main className="flex-1 container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex items-center">
            <div className="flex items-center gap-2 p-1 px-3 bg-[#b5f265]/20 rounded-full">
              <Filter className="h-4 w-4 text-gray-700 dark:text-gray-300" />
              <span className="text-sm font-medium">Filters</span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <Select value={selectedCategory} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-full sm:w-[180px] h-10 bg-white dark:bg-gray-800">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {campaignCategories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-full sm:w-[180px] h-10 bg-white dark:bg-gray-800">
                <SelectValue placeholder="Sort by">
                  {getSortLabel(sortBy)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Newest</span>
                  </div>
                </SelectItem>
                <SelectItem value="endingSoon">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Ending Soon</span>
                  </div>
                </SelectItem>
                <SelectItem value="mostFunded">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    <span>Most Funded</span>
                  </div>
                </SelectItem>
                <SelectItem value="mostBackers">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>Most Backers</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#b5f265]" />
            <span className="ml-2 text-gray-500 dark:text-gray-400">Loading campaigns...</span>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium mb-2">No campaigns found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
              We couldn&apos;t find any campaigns matching your search criteria. Try adjusting your filters or search terms.
            </p>
            <Button 
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('');
                setSortBy('newest');
                router.push('/explore');
              }}
              className="bg-[#b5f265] hover:bg-[#a5e354] text-gray-900 font-medium"
            >
              Clear All Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => {
              const endDate = new Date(campaign.end_date);
              const isEnded = endDate < new Date();
              const progress = campaign.goal_amount > 0 
                ? Math.min(Math.round((campaign.total_raised / campaign.goal_amount) * 100), 100) 
                : 0;
              
              // Find category label
              const categoryObj = campaignCategories.find(c => c.value === campaign.category);
              const categoryLabel = categoryObj ? categoryObj.label : campaign.category;
              
              // Calculate days left
              const now = new Date();
              const diffTime = endDate.getTime() - now.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              const daysLeft = diffDays > 0 ? diffDays : 0;
              
              return (
                <Card 
                  key={campaign.id} 
                  className="overflow-hidden group hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-800 shadow-sm hover:border-gray-200 dark:hover:border-gray-700 cursor-pointer"
                  onClick={() => router.push(`/campaigns/${campaign.slug}`)}
                >
                  <div className="aspect-[16/9] w-full overflow-hidden bg-gray-100 dark:bg-gray-800 relative">
                    {campaign.image_url ? (
                      <img
                        src={campaign.image_url}
                        alt={campaign.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
                        <span className="text-gray-400">No image</span>
                      </div>
                    )}
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute top-3 right-3 z-10">
                      <span className="px-3 py-1 text-xs font-medium bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full shadow-sm">
                        {categoryLabel}
                      </span>
                    </div>
                    {!isEnded && daysLeft <= 5 && (
                      <div className="absolute top-3 left-3 z-10">
                        <span className="px-3 py-1 text-xs font-medium bg-red-500/90 text-white backdrop-blur-sm rounded-full shadow-sm animate-pulse">
                          {daysLeft === 0 ? 'Last day!' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left!`}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <CardContent className="p-6">
                    <div className="flex items-center mb-3">
                      <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden mr-2 flex-shrink-0">
                        {campaign.creator?.walletAddress && (
                          <div className="w-full h-full bg-[#b5f265]/30 flex items-center justify-center">
                            <span className="text-[10px] font-medium">{campaign.creator?.shortAddress?.substring(0, 2) || '??'}</span>
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        {campaign.creator?.name || campaign.creator?.shortAddress || 'Anonymous'}
                      </span>
                    </div>
                    
                    <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-[#b5f265] transition-colors">
                      {campaign.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-5 line-clamp-2">
                      {campaign.description}
                    </p>
                    
                    <div className="mt-4 space-y-3">
                      <div className="flex justify-between text-sm items-center">
                        <span className="text-gray-500 dark:text-gray-400 flex items-center">
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
                      <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full",
                            isEnded ? "bg-gray-400" : "bg-[#b5f265]"
                          )}
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between">
                        <div>
                          <span className="text-lg font-bold">{campaign.total_raised} SOL</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                            raised
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            Goal: <span className="font-medium">{campaign.goal_amount} SOL</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30 flex justify-between items-center">
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                      <Users className="h-3 w-3 mr-1" />
                      {campaign.donation_count} supporter{campaign.donation_count !== 1 ? 's' : ''}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {isEnded ? 'Campaign ended' : 
                        `Ends ${new Date(campaign.end_date).toLocaleDateString()}`
                      }
                    </span>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
} 