import { v4 as uuidv4 } from 'uuid';

export interface ImageValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedDataUrl?: string;
}

/**
 * Maximum file size in bytes (5MB)
 */
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Allowed image MIME types
 */
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
];

/**
 * Validate an image file for security concerns
 * 
 * @param file The file to validate
 * @returns A promise that resolves to the validation result
 */
export async function validateImageFile(file: File): Promise<ImageValidationResult> {
  // Check if file exists
  if (!file) {
    return {
      isValid: false,
      error: 'No file provided'
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`
    };
  }

  // Check MIME type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: `File type ${file.type} is not allowed. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`
    };
  }

  // For SVG files, additional security checks are needed
  if (file.type === 'image/svg+xml') {
    try {
      const svgText = await file.text();
      
      // Check for script tags or event handlers (very basic XSS protection)
      const hasPotentialXSS = /<script|javascript:|on\w+=/i.test(svgText);
      if (hasPotentialXSS) {
        return {
          isValid: false,
          error: 'SVG contains potentially malicious content'
        };
      }
    } catch (error) {
      console.error('Error processing SVG file:', error);
      return {
        isValid: false,
        error: 'Could not process SVG file'
      };
    }
  }

  // Read the file and create a sanitized data URL
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      
      // For extra security, we could perform additional processing here
      // Like re-encoding the image to strip metadata
      
      resolve({
        isValid: true,
        sanitizedDataUrl: dataUrl
      });
    };
    reader.onerror = () => {
      resolve({
        isValid: false,
        error: 'Failed to read file'
      });
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Generate a unique filename for an uploaded image
 * 
 * @param originalFilename The original filename
 * @returns A unique filename
 */
export function generateUniqueImageFilename(originalFilename: string): string {
  const fileExtension = originalFilename.split('.').pop() || 'jpg';
  return `${uuidv4()}.${fileExtension}`;
}

/**
 * In a production environment, this would upload to S3 or similar
 * This is a placeholder for the actual implementation
 * 
 * @param dataUrl The data URL of the image
 * @param filename The filename to use
 * @returns The URL where the image is now stored
 */
export async function uploadImageToStorage(dataUrl: string, filename: string): Promise<string> {
  // In a real application, this would upload to a storage service like AWS S3
  // For the demo, we'll just return the data URL
  console.log(`[MOCK] Uploading image ${filename}`);
  return dataUrl;
} 