import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import DOMPurify from 'isomorphic-dompurify';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely sanitizes HTML content to prevent XSS attacks.
 * 
 * @param html The HTML content to sanitize
 * @returns Sanitized HTML
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input', 'button'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target'],
    SANITIZE_DOM: true
  });
}

/**
 * Checks if a URL is a YouTube URL and extracts the video ID
 * Supports various YouTube URL formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://youtube.com/shorts/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * 
 * Enhanced with stricter validation
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  
  // Validate that the URL is from a trusted domain
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();
    
    // Only allow YouTube domains
    if (!['youtube.com', 'www.youtube.com', 'youtu.be'].includes(hostname)) {
      return null;
    }
    
    // Regular expression to match YouTube URLs and extract video ID
    const regexps = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/
    ];
    
    for (const regex of regexps) {
      const match = url.match(regex);
      if (match && match[1]) {
        const videoId = match[1];
        // Extra validation - YouTube IDs are 11 characters
        if (videoId.length === 11) {
          return videoId;
        }
      }
    }
  } catch (error) {
    // URL parsing failed - not a valid URL
    console.error('Invalid URL in extractYouTubeVideoId:', error);
    return null;
  }
  
  return null;
}

/**
 * Checks if a URL is a valid YouTube URL
 */
export function isYouTubeUrl(url: string): boolean {
  return !!extractYouTubeVideoId(url);
}

/**
 * Validates that a URL is safe to use (not a javascript: URL, etc.)
 */
export function isSafeUrl(url: string): boolean {
  if (!url) return false;
  
  try {
    const parsedUrl = new URL(url);
    
    // Only allow http and https protocols
    return ['http:', 'https:'].includes(parsedUrl.protocol);
  } catch (error) {
    console.error('Invalid URL in isSafeUrl:', error);
    return false;
  }
}

/**
 * Generates a URL-friendly slug from a title string
 * Converts to lowercase, removes special characters, and replaces spaces with hyphens
 * Also handles duplicate slugs by adding a unique suffix if needed
 */
export function generateSlug(title: string, existingSlugs: string[] = []): string {
  if (!title) return '';
  
  // Convert to lowercase, remove special characters, and replace spaces with hyphens
  let slug = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/[\s_-]+/g, '-')  // Replace spaces, underscores and multiple hyphens with a single hyphen
    .replace(/^-+|-+$/g, '');  // Remove leading and trailing hyphens
  
  // Make sure the slug is at least 3 characters long (validation requirement)
  if (slug.length < 3) {
    slug = slug.padEnd(3, slug.charAt(0) || 'a');
  }
  
  // If the slug already exists in the list of existing slugs, add a unique suffix
  if (existingSlugs.includes(slug)) {
    let counter = 1;
    let newSlug = `${slug}-${counter}`;
    
    // Keep incrementing the counter until we find a unique slug
    while (existingSlugs.includes(newSlug)) {
      counter++;
      newSlug = `${slug}-${counter}`;
    }
    
    return newSlug;
  }
  
  return slug;
}
