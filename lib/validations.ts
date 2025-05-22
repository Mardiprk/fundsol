import { z } from 'zod';
import { isYouTubeUrl } from './utils';

// Explicitly define the CampaignFormValues type first
export type CampaignFormValues = {
  title: string;
  description: string;
  goalAmount: number;
  endDate: string;
  category: string;
  imageUrl: string;
  hasMatching: boolean;
  matchingAmount: number;
  matchingSponsor: string;
  summary?: string;
  slug?: string;
};

// Then create the campaign schema using this type as a base
export const campaignSchema = z.object({
  title: z.string().min(5, {
    message: 'Title must be at least 5 characters.',
  }).max(100, {
    message: 'Title must not exceed 100 characters.'
  }),
  summary: z.string().min(10, {
    message: 'Summary must be at least 10 characters.',
  }).max(200, {
    message: 'Summary must not exceed 200 characters.'
  }).optional(),
  description: z.string().min(20, {
    message: 'Description must be at least 20 characters.'
  }).max(5000, {
    message: 'Description must not exceed 5000 characters.'
  }),
  goalAmount: z.coerce.number().positive({
    message: 'Goal amount must be positive.'
  }),
  slug: z.string().min(3, {
    message: 'URL slug must be at least 3 characters.'
  }).max(50, {
    message: 'URL slug must not exceed 50 characters.'
  }).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'URL slug can only contain lowercase letters, numbers, and hyphens.'
  }).optional(),
  endDate: z.string({
    required_error: "End date is required",
  }).refine((date) => {
    const selectedDate = new Date(date);
    const today = new Date();
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + 60);
    return selectedDate <= maxDate;
  }, {
    message: "End date cannot be more than 60 days from today"
  }),
  category: z.string({
    required_error: "Please select a category"
  }),
  imageUrl: z.string().refine((url) => {
    // Check if it's a valid URL and if it's an image URL or YouTube URL
    const isValidUrl = /^https?:\/\//.test(url);
    const isImageUrl = /\.(jpg|jpeg|png|gif|webp)($|\?)/.test(url.toLowerCase());
    
    return isValidUrl && (isImageUrl || isYouTubeUrl(url));
  }, {
    message: 'Please enter a valid image URL or YouTube video URL.'
  }),
  hasMatching: z.boolean(),
  matchingAmount: z.coerce.number().min(0),
  matchingSponsor: z.string().max(100),
});

// Add user schema for profile management
export const userSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.'
  }).max(50, {
    message: 'Name must not exceed 50 characters.'
  }).optional(),
});

export type UserFormValues = z.infer<typeof userSchema>;

// Schema for creating a new user - primarily for validating wallet address
export const userCreationSchema = z.object({
  wallet_address: z.string().regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/, {
    message: "Invalid Solana wallet address format. It should be a Base58 encoded string between 32 and 44 characters."
  }),
});

export type UserCreationFormValues = z.infer<typeof userCreationSchema>;

// Schema for creating a new donation
export const donationSchema = z.object({
  id: z.string().uuid({ message: "Invalid donation ID format. Must be a UUID." }),
  campaign_id: z.string().uuid({ message: "Invalid campaign ID format. Must be a UUID." }),
  wallet_address: z.string().regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/, {
    message: "Invalid Solana wallet address format. It should be a Base58 encoded string between 32 and 44 characters."
  }),
  amount: z.coerce.number().positive({ message: "Donation amount must be a positive number." }),
  transaction_signature: z.string().min(1, { message: "Transaction signature is required." })
    .regex(/^[1-9A-HJ-NP-Za-km-z]{64,88}$/, { // Common length for Solana signatures, might need adjustment
      message: "Invalid transaction signature format. It should be a Base58 encoded string, typically 64-88 characters."
    }),
});

export type DonationFormValues = z.infer<typeof donationSchema>;

export const campaignCategories = [
  { label: 'Medical', value: 'medical' },
  { label: 'Emergency', value: 'emergency' },
  { label: 'Education', value: 'education' },
  { label: 'Community', value: 'community' },
  { label: 'Business', value: 'business' },
  { label: 'Creative', value: 'creative' },
  { label: 'Other', value: 'other' },
]; 