'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { WalletConnect } from '@/components/wallet-connect';
import { userSchema, UserFormValues, campaignSchema, CampaignFormValues, campaignCategories } from '@/lib/validations';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, UserCircle, CircleDollarSign, ExternalLink, Pencil, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import MDEditor from '@uiw/react-md-editor';

type User = {
  id: string;
  walletAddress: string;
  name: string;
  profileCompleted: boolean;
  createdAt: string;
  updatedAt: string;
};

type Campaign = {
  id: string;
  title: string;
  summary: string;
  description: string;
  goalAmount: number;
  slug: string;
  category: string;
  end_date: string;
  image_url: string | null;
  donation_count: number;
  total_raised: number;
  wallet_address: string;
};

type Donation = {
  id: string;
  amount: number;
  transaction_signature: string;
  createdAt: string;
  campaign: {
    id: string;
    title: string;
    slug: string;
    image_url: string | null;
    end_date: string;
    goalAmount: number;
    total_raised: number;
  };
};

export default function ProfilePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userData, setUserData] = useState<User | null>(null);
  const [userCampaigns, setUserCampaigns] = useState<Campaign[]>([]);
  const [userDonations, setUserDonations] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const { publicKey, connected } = useWallet();
  
  // Campaign edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [keepExistingSlug, setKeepExistingSlug] = useState(true);
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  // Campaign edit form
  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      title: '',
      description: '',
      goalAmount: 0,
      endDate: '',
      category: '',
      imageUrl: '',
      summary: '',
      slug: '',
      hasMatching: false,
      matchingAmount: 0,
      matchingSponsor: '',
    },
  });

  // Helper function to extract YouTube video ID
  const getYoutubeEmbedUrl = (url: string) => {
    if (!url) return null;
    
    // Match different YouTube URL patterns
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    
    // Return embed URL if valid YouTube URL, otherwise return original URL
    return match && match[2].length === 11 
      ? `https://www.youtube.com/embed/${match[2]}` 
      : null;
  };

  // Define user form
  const userForm = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
    },
  });

  // Function to determine the minimum end date (tomorrow)
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  // Function to determine the maximum end date (60 days from now)
  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 60);
    return maxDate.toISOString().split('T')[0];
  };

  // Open campaign edit modal with selected campaign data
  const handleEditCampaign = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    
    // Populate form with campaign data
    form.reset({
      title: campaign.title,
      summary: campaign.summary || '',
      description: campaign.description,
      goalAmount: campaign.goalAmount,
      slug: campaign.slug,
      endDate: campaign.end_date ? campaign.end_date.split('T')[0] : '',
      category: campaign.category,
      imageUrl: campaign.image_url || '',
    });
    
    setKeepExistingSlug(true);
    setEditModalOpen(true);
  };

  // Submit campaign edit form
  const handleCampaignEditSubmit = async (data: CampaignFormValues) => {
    if (!selectedCampaign) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/campaigns/${selectedCampaign.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          keepExistingSlug
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update campaign');
      }

      const result = await response.json();
      
      toast({
        title: "Success",
        description: "Campaign updated successfully",
      });
      
      // Close the modal
      setEditModalOpen(false);
      
      // Refresh campaign data
      if (publicKey) {
        fetchUserCampaigns(publicKey.toString());
      }
      
      // If slug changed, navigate to the new URL
      if (result.campaign.slug !== selectedCampaign.slug) {
        router.refresh();
      }
    } catch (error) {
      console.error('Error updating campaign:', error);
      toast({
        title: "Error",
        description: "Failed to update campaign",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fetch user donations
  const fetchUserDonations = async (walletAddress: string) => {
    try {
      const donationsRes = await fetch(`/api/donations/user?wallet=${walletAddress}`);
      if (donationsRes.ok) {
        const donationsData = await donationsRes.json();
        if (donationsData.success) {
          // Ensure proper type conversion for numeric fields
          const formattedDonations = donationsData.donations.map((donation: Omit<Donation, 'amount'> & { amount: string | number }) => ({
            ...donation,
            amount: Number(donation.amount),
            campaign: {
              ...donation.campaign,
              goalAmount: Number(donation.campaign.goalAmount || 0),
              total_raised: Number(donation.campaign.total_raised || 0)
            }
          }));
          setUserDonations(formattedDonations);
        }
      }
    } catch (error) {
      console.error('Error fetching user donations:', error);
    }
  };

  // Fetch user campaigns
  const fetchUserCampaigns = async (walletAddress: string) => {
    try {
      const campaignsRes = await fetch(`/api/campaigns/user?wallet=${walletAddress}`);
      if (campaignsRes.ok) {
        const campaignsData = await campaignsRes.json();
        if (campaignsData.success) {
          // Ensure proper type conversion for numeric fields
          const formattedCampaigns = campaignsData.campaigns.map((campaign: {
            id: string;
            title: string;
            summary: string;
            description: string;
            goal_amount: string | number;
            slug: string;
            category: string;
            end_date: string;
            image_url: string | null;
            donation_count: string | number;
            total_raised: string | number;
            wallet_address: string;
          }) => ({
            ...campaign,
            goalAmount: Number(campaign.goal_amount),
            total_raised: Number(campaign.total_raised || 0),
            donation_count: Number(campaign.donation_count || 0)
          }));
          setUserCampaigns(formattedCampaigns);
        }
      }
    } catch (error) {
      console.error('Error fetching user campaigns:', error);
    }
  };

  // Get user data when wallet is connected
  useEffect(() => {
    async function fetchUserData() {
      if (connected && publicKey) {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/users/profile?walletAddress=${publicKey.toString()}`);
          
          if (response.ok) {
            const data = await response.json();
            setUserData(data.user);
            userForm.reset({ name: data.user?.name || '' });
          }
          
          // Fetch user campaigns
          if (publicKey) {
            await fetchUserCampaigns(publicKey.toString());
            await fetchUserDonations(publicKey.toString());
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          toast({
            title: "Error",
            description: "Failed to load profile data",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      }
    }
    
    fetchUserData();
  }, [publicKey, connected, userForm, toast]);

  async function onSubmit(data: UserFormValues) {
    if (!connected || !publicKey) {
      toast({
        title: "Error",
        description: "Please connect your wallet to update your profile",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/users/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: publicKey.toString(),
          name: data.name,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Something went wrong');
      }

      const result = await response.json();
      setUserData(result.user);
      setIsEditing(false);
        toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
      } finally {
      setIsSubmitting(false);
    }
  }

  const handleDeleteCampaign = async (campaignId: string) => {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/campaigns?id=${campaignId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      // Refresh the campaigns list
      if (publicKey) {
        await fetchUserCampaigns(publicKey.toString());
      }
      
      toast({
        title: "Success",
        description: "Campaign deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast({
        title: "Error",
        description: "Failed to delete campaign",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!connected) {
    return (
      <div className="min-h-screen flex flex-col">
        <section className="w-full bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 py-12">
          <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto text-center py-12 px-4 sm:px-6 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <AlertCircle className="h-10 w-10 text-gray-500 dark:text-gray-400" />
              </div>
              <h1 className="text-3xl font-bold mb-4">Connect Your Wallet</h1>
              <p className="text-gray-600 dark:text-gray-300 mb-8">
                Please connect your Solana wallet to view and manage your profile.
              </p>
              <WalletConnect className="w-full" />
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <section className="w-full bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 border-b">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-5 mb-6">
              <div className="w-12 h-12 rounded-full bg-[#b5f265] flex items-center justify-center shrink-0">
                <UserCircle className="h-6 w-6 text-gray-800" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Your Profile</h1>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  Manage your account and view your campaigns and donations
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <main className="flex-1 container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3 mb-8">
            <TabsTrigger value="profile" className="data-[state=active]:bg-[#b5f265] data-[state=active]:text-gray-900">
              Profile
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="data-[state=active]:bg-[#b5f265] data-[state=active]:text-gray-900">
              My Campaigns
            </TabsTrigger>
            <TabsTrigger value="donations" className="data-[state=active]:bg-[#b5f265] data-[state=active]:text-gray-900">
              My Donations
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="space-y-4">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>View and manage your profile information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="bg-[#b5f265]/20 p-2 rounded-full">
                      <UserCircle className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Wallet Address</p>
                      <p className="text-sm font-mono text-gray-500 dark:text-gray-400">{publicKey ? publicKey.toString() : ''}</p>
                    </div>
                  </div>
                </div>
                
                {isLoading ? (
                  <div className="py-4 text-center">
                    <p>Loading profile information...</p>
                  </div>
                ) : isEditing ? (
                  <Form {...userForm}>
                    <form onSubmit={userForm.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={userForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-medium">Display Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Your name" 
                                {...field} 
                                className="h-11 focus-visible:ring-[#b5f265] focus-visible:ring-offset-0"
                              />
                            </FormControl>
                            <FormDescription className="text-gray-500 dark:text-gray-400 text-sm">
                              This name will be displayed publicly on your campaigns and donations
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-end gap-3">
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => setIsEditing(false)}
                          className="px-4 py-2"
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={isSubmitting}
                          className="px-4 py-2 bg-[#b5f265] hover:bg-[#a5e354] text-gray-900 font-medium"
                        >
                          {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </div>
                    </form>
                  </Form>
                ) : (
                  <div className="py-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">Display Name</h3>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-1 h-8 text-gray-500 hover:text-gray-900"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                    </div>
                    <p className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                      {userData?.name || 'No name set'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      This name is displayed publicly on your campaigns and donations
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="campaigns" className="space-y-4">
            <Card className="border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>My Campaigns</CardTitle>
                  <CardDescription>Campaigns you&apos;ve created</CardDescription>
                </div>
                <Button 
                  onClick={() => router.push('/create')}
                  className="bg-[#b5f265] hover:bg-[#a5e354] text-gray-900 font-medium"
                >
                  Create New
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <p>Loading your campaigns...</p>
                  </div>
                ) : userCampaigns.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {userCampaigns.map((campaign) => {
                      // Calculate percentage raised with proper handling for zero goals
                      const percentRaised = campaign.goalAmount > 0 
                        ? Math.min(100, Math.round((campaign.total_raised / campaign.goalAmount) * 100))
                        : 0;
                      
                      // Calculate days remaining
                      const endDate = new Date(campaign.end_date);
                      const today = new Date();
                      const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
                      const isEnded = endDate < today;
                      
                      // Default image if none provided
                      const campaignImage = campaign.image_url || '/images/campaign-placeholder.jpg';
                      
                      return (
                        <div key={campaign.id} className="group overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-200">
                          <div className="aspect-video relative overflow-hidden bg-gray-100 dark:bg-gray-900">
                            {/* Campaign Image or Video */}
                            {(() => {
                              const youtubeEmbedUrl = getYoutubeEmbedUrl(campaignImage);
                              
                              if (youtubeEmbedUrl) {
                                return (
                                  <div className="absolute inset-0 w-full h-full">
                                    <iframe 
                                      src={youtubeEmbedUrl} 
                                      className="w-full h-full"
                                      allowFullScreen
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                      frameBorder="0"
                                      title={`${campaign.title} video`}
                                    />
                                  </div>
                                );
                              } else {
                                return (
                                  <img 
                                    src={campaignImage} 
                                    alt={campaign.title}
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                  />
                                );
                              }
                            })()}
                            
                            {/* Status Badge */}
                            {isEnded ? (
                              <div className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-xs font-medium rounded">
                                Ended
                              </div>
                            ) : (
                              <div className="absolute top-2 right-2 px-2 py-1 bg-[#b5f265] text-gray-900 text-xs font-medium rounded">
                                {daysRemaining} days left
                              </div>
                            )}
                          </div>
                          
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{campaign.category}</span>
                              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{campaign.donation_count} donation{campaign.donation_count !== 1 ? 's' : ''}</span>
                            </div>
                            
                            <h3 className="font-medium text-lg mb-2 line-clamp-1">{campaign.title}</h3>
                            
                            {campaign.summary && (
                              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                                {campaign.summary}
                              </p>
                            )}
                            
                            <div className="mt-2 space-y-2">
                              <div className="flex justify-between items-center text-sm">
                                <span className="font-medium">{campaign.total_raised} SOL</span>
                                <span className={`font-semibold ${percentRaised >= 100 ? 'text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-gray-200'}`}>
                                  {percentRaised}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                                <div 
                                  className={`${percentRaised >= 100 ? 'bg-green-500' : 'bg-[#b5f265]'} h-2 rounded-full transition-all duration-300 ease-in-out`}
                                  style={{ width: `${percentRaised}%` }}
                                ></div>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                of {campaign.goalAmount} SOL goal
                              </p>
                            </div>
                          </div>
                          
                          <div className="border-t border-gray-100 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => router.push(`/campaigns/${campaign.slug}`)}
                                  className="flex items-center gap-1 h-8 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                  View
                                </Button>
                                <Button 
                                  size="sm"
                                  onClick={() => handleEditCampaign(campaign)}
                                  className="flex items-center gap-1 h-8 bg-[#b5f265]/70 hover:bg-[#b5f265] text-gray-900"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                  Edit
                                </Button>
                              </div>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    disabled={isDeleting}
                                  >
                                    Delete
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This action cannot be undone. This will permanently delete the campaign
                                      and all associated data.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteCampaign(campaign.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 px-4">
                    <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                      <CircleDollarSign className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No campaigns yet</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                      You haven&apos;t created any fundraising campaigns. Start your first campaign to begin collecting donations.
                    </p>
                    <Button 
                      onClick={() => router.push('/create')}
                      className="bg-[#b5f265] hover:bg-[#a5e354] text-gray-900 font-medium"
                    >
                      Create Your First Campaign
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="donations" className="space-y-4">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>My Donations</CardTitle>
                <CardDescription>Campaigns you&apos;ve supported</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <p>Loading your donations...</p>
                  </div>
                ) : userDonations.length > 0 ? (
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {userDonations.map((donation) => {
                      // Format dates
                      const donationDate = new Date(donation.createdAt);
                      
                      return (
                        <div key={donation.id} className="py-4 first:pt-0 last:pb-0">
                          <div className="flex flex-col gap-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <h3 className="font-medium text-lg">{donation.campaign.title}</h3>
                              <div className="flex items-center gap-2 self-start">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#b5f265]/20 text-[#5a7930]">
                                  {donation.amount} SOL
                                </span>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => router.push(`/campaigns/${donation.campaign.slug}`)}
                                  className="flex items-center gap-1 h-8 whitespace-nowrap"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                  View Campaign
                                </Button>
                              </div>
                            </div>
                            
                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                  <CircleDollarSign className="h-4 w-4 text-gray-500" />
                                  <span className="font-medium">{donation.amount} SOL donated</span>
                                </div>
                                <span className="inline-block h-1 w-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                                <span className="text-gray-600 dark:text-gray-300">
                                  {donationDate.toLocaleDateString()} at {donationDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              
                              {donation.transaction_signature && (
                                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                  <div className="flex flex-col">
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Transaction ID</span>
                                      <a 
                                        href={`https://explorer.solana.com/tx/${donation.transaction_signature}?cluster=devnet`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 dark:text-blue-400 hover:underline text-xs flex items-center gap-1"
                                      >
                                        View on Explorer <ExternalLink className="h-3 w-3" />
                                      </a>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <code className="bg-gray-100 dark:bg-gray-700 text-xs font-mono px-2 py-1 rounded truncate max-w-[250px] sm:max-w-[350px]">
                                        {donation.transaction_signature}
                                      </code>
                                      <Button
                                        variant="ghost"
                                        size="sm" 
                                        className="h-6 w-6 p-0"
                                        onClick={() => {
                                          navigator.clipboard.writeText(donation.transaction_signature);
                                          toast({
                                            title: "Success",
                                            description: "Transaction ID copied to clipboard",
                                          });
                                        }}
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                                          <path d="M8 4v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7.242a2 2 0 0 0-.602-1.43L16.083 2.57A2 2 0 0 0 14.685 2H10a2 2 0 0 0-2 2z" />
                                          <path d="M16 18v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2" />
                                        </svg>
                                        <span className="sr-only">Copy</span>
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 px-4">
                    <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                      <CircleDollarSign className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No donations yet</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                      You haven&apos;t made any donations yet. Explore campaigns and support causes you care about.
                    </p>
                    <Button 
                      onClick={() => router.push('/campaigns')}
                      className="bg-[#b5f265] hover:bg-[#a5e354] text-gray-900 font-medium"
                    >
                      Explore Campaigns
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Campaign Edit Modal */}
      {selectedCampaign && (
        <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Campaign</DialogTitle>
              <DialogDescription>
                Update your campaign details. Click save when you&apos;re done.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCampaignEditSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campaign Title</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    id="keepSlug"
                    checked={keepExistingSlug}
                    onChange={(e) => setKeepExistingSlug(e.target.checked)}
                    className="mr-1"
                  />
                  <label htmlFor="keepSlug">
                    Keep existing URL ({selectedCampaign.slug}) when title changes
                  </label>
                </div>
                
                <FormField
                  control={form.control}
                  name="summary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Summary</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Brief summary of your campaign"
                          className="resize-none h-20"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        A short description that appears in campaign listings (max 200 characters)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <div className="mt-2" data-color-mode="light">
                          <MDEditor
                            value={field.value}
                            onChange={(value) => field.onChange(value)}
                            preview="edit"
                            hideToolbar={false}
                            height={300}
                            enableScroll={true}
                            visibleDragbar={false}
                            previewOptions={{
                              skipHtml: true,
                              components: {
                                a: () => null, // Disable links
                              },
                            }}
                            className="[&_.w-md-editor]:border [&_.w-md-editor]:border-gray-200 [&_.w-md-editor]:rounded-md [&_.w-md-editor]:dark:border-gray-700 [&_.w-md-editor-toolbar]:border-b [&_.w-md-editor-toolbar]:border-gray-200 [&_.w-md-editor-toolbar]:dark:border-gray-700 [&_.w-md-editor-toolbar]:bg-gray-50 [&_.w-md-editor-toolbar]:dark:bg-gray-800 [&_.w-md-editor-toolbar]:rounded-t-md [&_.w-md-editor-preview]:p-4 [&_.w-md-editor-preview]:bg-white [&_.w-md-editor-preview]:dark:bg-gray-800 [&_.w-md-editor-text]:p-4 [&_.w-md-editor-text]:bg-white [&_.w-md-editor-text]:dark:bg-gray-800"
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        <div className="mt-2 text-sm text-muted-foreground">
                          <ul className="list-disc pl-4 space-y-1">
                            <li><code>**bold**</code> for bold text</li>
                            <li><code>*italic*</code> for italic text</li>
                            <li><code>-</code> or <code>*</code> for bullet points</li>
                            <li><code>#</code> for headings</li>
                          </ul>
                        </div>
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="goalAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Goal Amount (SOL)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="e.g., 10.0"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            min={getMinDate()}
                            max={getMaxDate()}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {campaignCategories.map((category) => (
                              <SelectItem key={category.value} value={category.value}>
                                {category.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Media URL</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Image or YouTube URL"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          URL to an image or YouTube video
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button 
                    type="submit"
                    className="bg-[#b5f265] hover:bg-[#a5e354] text-gray-900" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 