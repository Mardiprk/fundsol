'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { WalletConnect } from '@/components/wallet-connect';
import { campaignSchema, CampaignFormValues, campaignCategories } from '@/lib/validations';
import { AlertCircle, PenLine, CalendarIcon } from 'lucide-react';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import dynamic from 'next/dynamic';

// Dynamic import for MDEditor to fix client-side only component issue
const MDEditor = dynamic(
  () => import('@uiw/react-md-editor'),
  { ssr: false }
);

export default function CreateCampaignPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { publicKey, connected } = useWallet();

  // Define form
  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      title: '',
      description: '',
      summary: '',
      goalAmount: 0,
      endDate: '',
      category: '',
      imageUrl: '',
      hasMatching: false,
      matchingAmount: 0,
      matchingSponsor: '',
      slug: '', // Added slug to default values
    },
  });

  // Watch title changes and update slug automatically
  const title = form.watch('title');
  useEffect(() => {
    if (title) {
      const slug = title
        .toLowerCase()
        .replace(/[^\w\s]/gi, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
        .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
      form.setValue('slug', slug);
    }
  }, [title, form]);

  async function onSubmit(data: CampaignFormValues) {
    if (!connected || !publicKey) {
      toast.error('Please connect your wallet to create a campaign');
      return;
    }

    // Add additional validation for matching fields
    if (data.hasMatching && (!data.matchingAmount || data.matchingAmount <= 0)) {
      form.setError("matchingAmount", { 
        message: "Matching amount must be greater than 0 when matching is enabled" 
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Verify wallet is still connected before proceeding
      if (!connected || !publicKey) {
        throw new Error('Wallet connection lost. Please reconnect and try again.');
      }
      
      // Validate the data before submission
      const campaignData = {
        ...data,
        walletAddress: publicKey.toString(),
      };

      console.log('Submitting campaign data:', campaignData);

      // Add a timeout to the fetch to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(campaignData),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Server error (${response.status})`;
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch {
          // If not parseable as JSON, use the status text
          errorMessage = `${response.status}: ${response.statusText || 'Unknown error'}`;
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      toast.success('Campaign created successfully!');
      router.push(`/campaigns/${result.slug || data.slug}`);
    } catch (error) {
      console.error('Error creating campaign:', error);
      
      // More detailed error handling
      if (!connected || !publicKey) {
        toast.error('Wallet disconnected. Please reconnect your wallet and try again.');
      } else if (error instanceof TypeError && error.message.includes('fetch')) {
        toast.error('Network error: Could not connect to the server. Please check your internet connection.');
      } else if (error instanceof DOMException && error.name === 'AbortError') {
        toast.error('Request timed out. The server took too long to respond.');
      } else {
        toast.error(`Failed to create campaign: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  // If wallet disconnects, redirect to homepage
  useEffect(() => {
    if (!connected && !isSubmitting) {
      router.push('/');
    }
  }, [connected, router, isSubmitting]);

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
                Please connect your Solana wallet to create a campaign and start fundraising.
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
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-5 mb-4">
              <div className="w-12 h-12 bg-[#b5f265] flex items-center justify-center shrink-0 rounded-full">
                <PenLine className="h-6 w-6 text-gray-800" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Create Your Campaign</h1>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  Fill out the form below to start your fundraising journey
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <main className="flex-1 container max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white dark:bg-gray-800 p-6 md:p-8 border border-gray-100 dark:border-gray-700 rounded-xl shadow-md">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Campaign Title *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter a campaign title" 
                        {...field} 
                        className="h-11 focus-visible:ring-[#b5f265] focus-visible:ring-offset-0 rounded-md"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="summary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Campaign Summary *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Provide a brief summary of your campaign (max 200 characters)"
                        className="min-h-20 focus-visible:ring-[#b5f265] focus-visible:ring-offset-0 rounded-md"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      A concise overview that will appear in campaign listings
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
                    <FormLabel className="font-medium">Description *</FormLabel>
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-6 pb-4">
                <h3 className="text-lg font-semibold">Fundraising Details</h3>
                
                <FormField
                  control={form.control}
                  name="goalAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fundraising Goal</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            className="pr-12"
                            {...field}
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <span className="text-sm text-muted-foreground">SOL</span>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>End Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(new Date(field.value), "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) => {
                              if (date) {
                                field.onChange(date.toISOString().slice(0, 10));
                              }
                            }}
                            disabled={(date) => {
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              
                              const maxDate = new Date(today);
                              maxDate.setDate(today.getDate() + 60);
                              
                              return date < today || date > maxDate;
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        Campaign end date (maximum 60 days from today)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {campaignCategories.map((category) => (
                            <SelectItem 
                              key={category.value} 
                              value={category.value}
                            >
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Media URL *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter image URL (e.g., https://example.com/image.jpg) or YouTube video URL" 
                        {...field}
                        className="h-11 focus-visible:ring-[#b5f265] focus-visible:ring-offset-0 rounded-md"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="min-w-36 px-8 py-6 bg-[#b5f265] hover:bg-[#a5e354] text-gray-900 font-medium rounded-xl"
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <span className="mr-2">Creating...</span>
                      <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                    </div>
                  ) : 'Create Campaign'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </main>
    </div>
  );
} 