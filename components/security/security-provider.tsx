'use client';

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { usePathname } from 'next/navigation';

interface SecurityContextType {
  /**
   * Get the CSRF token from cookies
   */
  getCsrfToken: () => string | null;
  
  /**
   * Add CSRF token to fetch headers
   */
  addCsrfToHeaders: (headers: HeadersInit) => HeadersInit;
  
  /**
   * Enhanced fetch wrapper that adds CSRF tokens and handles errors
   */
  secureFetch: (url: string, options?: RequestInit) => Promise<Response>;
  
  /**
   * Force refresh CSRF token
   */
  refreshCsrfToken: () => void;
  
  /**
   * Utility function to sanitize user inputs
   */
  sanitizeInput: (input: string) => string;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (context === undefined) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};

interface SecurityProviderProps {
  children: ReactNode;
}

export function SecurityProvider({ children }: SecurityProviderProps) {
  const pathname = usePathname();
  
  // Extract CSRF token from cookies
  const getCsrfToken = (): string | null => {
    if (typeof document === 'undefined') return null;
    
    const match = document.cookie.match(new RegExp('(^| )csrf-token=([^;]+)'));
    return match ? match[2] : null;
  };
  
  // Add CSRF token to headers
  const addCsrfToHeaders = (headers: HeadersInit = {}): HeadersInit => {
    const token = getCsrfToken();
    const headersObj = headers instanceof Headers 
      ? Object.fromEntries(headers.entries()) 
      : { ...headers };
    
    if (token) {
      return {
        ...headersObj,
        'X-CSRF-Token': token,
      };
    }
    
    return headersObj;
  };
  
  // Secure fetch wrapper
  const secureFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const secureOptions = { 
      ...options,
      headers: addCsrfToHeaders(options.headers || {})
    };
    
    const response = await fetch(url, secureOptions);
    
    // Handle specific status codes
    if (response.status === 403 && response.headers.get('X-CSRF-Invalid')) {
      // CSRF token invalid or expired, refresh it and retry
      refreshCsrfToken();
      secureOptions.headers = addCsrfToHeaders(secureOptions.headers || {});
      return fetch(url, secureOptions);
    }
    
    return response;
  };
  
  // Force refresh CSRF token
  const refreshCsrfToken = () => {
    // In a real implementation, this would call an API endpoint to refresh the token
    // For this implementation, we'll rely on the middleware to set a new token
    fetch('/api/health', { credentials: 'include' })
      .catch(error => {
        console.error('Failed to refresh CSRF token:', error);
      });
  };
  
  // Basic sanitization for user inputs
  const sanitizeInput = (input: string): string => {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };
  
  // Load CSRF token on initial render and when pathname changes
  useEffect(() => {
    // We don't need to store the token in state since we always get it from cookies
    getCsrfToken();
  }, [pathname]);
  
  const value = {
    getCsrfToken,
    addCsrfToHeaders,
    secureFetch,
    refreshCsrfToken,
    sanitizeInput,
  };
  
  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
} 