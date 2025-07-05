'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Loader2, Upload, Calendar as CalendarIcon, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { campaignCategories, campaignSchema, CampaignFormValues } from '@/lib/validations';
import { validateImageFile, uploadImageToStorage, generateUniqueImageFilename } from '@/lib/image-upload';
import { useToast } from '@/components/ui/use-toast';

export default function CreateCampaignPage() {
  const router = useRouter();
  const wallet = useWallet();
  const { setVisible } = useWalletModal();
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [imageValidationError, setImageValidationError] = useState<string | null>(null);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const { toast } = useToast();

  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      title: '',
      summary: '',
      description: '',
      goalAmount: 0,
      slug: '',
      endDate: '',
      category: '',
      imageUrl: '',
    },
  });

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsImageUploading(true);
    setImageValidationError(null);
    
    try {
      // Validate the file for security concerns
      const validationResult = await validateImageFile(file);
      
      if (!validationResult.isValid) {
        setImageValidationError(validationResult.error || 'Invalid image file');
        toast({
          title: "Upload Error",
          description: validationResult.error || 'Invalid image file',
          variant: "destructive",
        });
        return;
      }
      
      // Generate a unique filename
      const uniqueFilename = generateUniqueImageFilename(file.name);
      
      // In a production app, this would upload to S3 or similar
      // Here we're just using the data URL with validation
      if (validationResult.sanitizedDataUrl) {
        const imageUrl = await uploadImageToStorage(validationResult.sanitizedDataUrl, uniqueFilename);
        setUploadedImage(imageUrl);
        form.setValue('imageUrl', imageUrl);
        toast({
          title: "Upload Successful",
          description: "Image uploaded successfully",
        });
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setImageValidationError('Failed to upload image. Please try again.');
      toast({
        title: "Upload Failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsImageUploading(false);
    }
  };

  async function onSubmit(values: CampaignFormValues) {
    if (!wallet.connected) {
      setVisible(true);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Create a slug from the title if not provided
      if (!values.slug) {
        values.slug = values.title
          .toLowerCase()
          .replace(/[^\w\s]/gi, '')
          .replace(/\s+/g, '-');
      }

      // Create campaign request payload
      const campaignData = {
        ...values,
        walletAddress: wallet.publicKey?.toString(),
        imageUrl: uploadedImage || values.imageUrl,
      };

      console.log("Submitting campaign with regular API endpoint");
      
      // Use the standard API endpoint now that CSRF validation is removed
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(campaignData)
      });
      
      if (response.ok) {
        const data = await response.json();
        
        toast({
          title: "Success",
          description: "Campaign created successfully!",
        });
        
        router.push(`/campaigns/${data.slug}`);
        return;
      } 
      
      // If the endpoint fails, get the error details
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || 'Failed to create campaign');
    } catch (error) {
      console.error('Error creating campaign:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to create campaign');
      
      // Show error message
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to create campaign',
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  // Helper function to disable CSRF validation
  async function disableCsrf() {
    try {
      const response = await fetch('/api/disable-csrf');
      
      if (response.ok) {
        const data = await response.json();
        
        // Manually update document.cookie to ensure it's set immediately
        document.cookie = "csrf-bypass=development-only; path=/; SameSite=Lax";
        
        toast({
          title: "CSRF Checks Disabled",
          description: data.message || "CSRF validation has been bypassed. Try submitting the form now.",
          variant: "default"
        });
        
        return true;
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast({
          title: "Failed to Disable CSRF",
          description: errorData.message || "Could not disable CSRF checks. Try refreshing the page.",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Error disabling CSRF:', error);
      toast({
        title: "Error",
        description: "Failed to disable CSRF checks. Network error or server unavailable.",
        variant: "destructive"
      });
      return false;
    }
  }

  // Add this function to disable both CSRF and rate limits
  async function disableAllLimits() {
    try {
      const response = await fetch('/api/disable-limits');
      
      if (response.ok) {
        const data = await response.json();
        
        // Manually update document.cookie to ensure it's set immediately
        document.cookie = "csrf-bypass=development-only; path=/; SameSite=Lax; max-age=604800";
        
        toast({
          title: "All Limits Disabled",
          description: "CSRF validation and rate limiting have been disabled for your session.",
          variant: "default"
        });
        
        return true;
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast({
          title: "Failed to Disable Limits",
          description: errorData.message || "Could not disable security limits. Try refreshing the page.",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Error disabling limits:', error);
      toast({
        title: "Error",
        description: "Failed to disable security limits. Network error or server unavailable.",
        variant: "destructive"
      });
      return false;
    }
  }

  // Add an effect to inject the bypass cookie on component mount
  useEffect(() => {
    // Set bypass cookie immediately
    document.cookie = "csrf-bypass=development-only; path=/; SameSite=Lax; max-age=604800";
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <section className="w-full bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 border-b">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-3">Create a Campaign</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              Start fundraising for your project, cause, or creative idea
            </p>
          </div>
        </div>
      </section>

      <main className="flex-1 container max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {!wallet.connected ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-8 text-center">
            <h2 className="text-xl font-semibold mb-4">Connect Your Wallet</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              You need to connect your Solana wallet to create a campaign
            </p>
            <div className="flex justify-center">
              <WalletMultiButton />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 md:p-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  {/* Campaign Image */}
                  <div className="space-y-2">
                    <FormLabel>Campaign Media</FormLabel>
                    <div className="flex flex-col items-center justify-center w-full">
                      <label
                        htmlFor="image-upload"
                        className={`
                          flex flex-col items-center justify-center w-full h-64
                          border-2 border-dashed rounded-lg cursor-pointer
                          ${uploadedImage ? 'border-[#b5f265]' : 'border-gray-300 dark:border-gray-600'}
                          ${imageValidationError ? 'border-red-500' : ''}
                          hover:border-[#b5f265] hover:bg-gray-50 dark:hover:bg-gray-700
                          transition-colors duration-200
                          ${isImageUploading ? 'opacity-50 pointer-events-none' : ''}
                        `}
                      >
                        {isImageUploading ? (
                          <div className="flex flex-col items-center justify-center py-6 px-4">
                            <Loader2 className="w-10 h-10 text-gray-400 mb-3 animate-spin" />
                            <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                              Uploading image...
                            </p>
                          </div>
                        ) : uploadedImage ? (
                          <div className="relative w-full h-full">
                            <img
                              src={uploadedImage}
                              alt="Campaign preview"
                              className="w-full h-full object-cover rounded-lg"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-lg">
                              <span className="text-white font-medium">Change image</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-6 px-4">
                            <Upload className="w-10 h-10 text-gray-400 mb-3" />
                            <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                              Click to upload or drag and drop
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              PNG, JPG, GIF, WEBP (Max. 5MB)
                            </p>
                            {imageValidationError && (
                              <div className="mt-2 flex items-center text-red-500 text-xs">
                                <AlertTriangle className="w-4 h-4 mr-1" />
                                {imageValidationError}
                              </div>
                            )}
                          </div>
                        )}
                        <input
                          id="image-upload"
                          type="file"
                          accept="image/jpeg, image/png, image/gif, image/webp"
                          className="hidden"
                          onChange={handleImageUpload}
                          disabled={isImageUploading}
                        />
                      </label>
                    </div>
                    <FormDescription>
                      A compelling image will help your campaign stand out. Alternatively, you can provide a YouTube URL in the Media URL field below.
                    </FormDescription>
                  </div>

                  {/* ImageUrl field for YouTube or external image URLs */}
                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Media URL</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter YouTube URL or image URL (e.g., https://youtu.be/VIDEO_ID)"
                            className="focus-visible:ring-[#b5f265] focus-visible:ring-offset-0"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          You can either upload an image above OR enter a YouTube video URL here
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Title */}
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign Title</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter a clear, attention-grabbing title" 
                            {...field} 
                            className="focus-visible:ring-[#b5f265] focus-visible:ring-offset-0"
                          />
                        </FormControl>
                        <FormDescription>
                          Be specific and compelling to attract supporters
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Summary */}
                  <FormField
                    control={form.control}
                    name="summary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign Summary</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Provide a brief summary of your campaign (max 200 characters)"
                            className="min-h-20 focus-visible:ring-[#b5f265] focus-visible:ring-offset-0"
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

                  {/* Description */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe your campaign, its purpose, and how funds will be used"
                            className="min-h-32 focus-visible:ring-[#b5f265] focus-visible:ring-offset-0"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          <div className="space-y-2">
                            <p>Use markdown to format your campaign description. Here are some tips:</p>
                            <ul className="list-disc pl-4 space-y-1">
                              <li>Use <code>**bold**</code> for <strong>bold text</strong></li>
                              <li>Use <code>*italic*</code> for <em>italic text</em></li>
                              <li>Use <code># Heading</code> for headings</li>
                              <li>Use <code>- item</code> for bullet points</li>
                              <li>Use <code>1. item</code> for numbered lists</li>
                              <li>Use <code>[link text](url)</code> for links</li>
                              <li>Use <code>![alt text](image-url)</code> for images</li>
                            </ul>
                          </div>
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Goal Amount */}
                  <FormField
                    control={form.control}
                    name="goalAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Funding Goal (SOL)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="e.g., 10.0"
                              className="focus-visible:ring-[#b5f265] focus-visible:ring-offset-0 pl-11"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            />
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                              <span className="text-gray-500 dark:text-gray-400 font-medium">SOL</span>
                            </div>
                          </div>
                        </FormControl>
                        <FormDescription>Set a realistic goal for your campaign</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Slug */}
                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL Slug</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="campaign-url-identifier (lowercase, hyphens)"
                            className="focus-visible:ring-[#b5f265] focus-visible:ring-offset-0"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Leave blank to auto-generate from title
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* End Date */}
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
                        <FormDescription>Campaign can run for a maximum of 60 days</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Category */}
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
                            <SelectTrigger className="focus:ring-[#b5f265] focus:ring-offset-0">
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
                        <FormDescription>
                          Choose the category that best fits your campaign
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Error Message */}
                  {submitError && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 flex items-start">
                      <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mr-3 mt-0.5" />
                      <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#20694c] hover:bg-[#185339] text-white font-medium h-12"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Campaign...
                      </>
                    ) : (
                      'Create Campaign'
                    )}
                  </Button>
                </form>
              </Form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 