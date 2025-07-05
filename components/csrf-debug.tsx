'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useSecurity } from '@/components/security/security-provider';
import { AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';

export function CsrfDebug() {
  const [csrfInfo, setCsrfInfo] = useState<any>(null);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshResponse, setRefreshResponse] = useState<any>(null);
  const [bypassEnabled, setBypassEnabled] = useState(false);
  const { getCsrfToken, refreshCsrfToken } = useSecurity();

  useEffect(() => {
    // Get CSRF token from cookies
    const token = getCsrfToken();
    
    // Check if bypass cookie is set
    const bypassCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrf-bypass='));
    
    const hasBypass = !!bypassCookie;
    setBypassEnabled(hasBypass);
    
    setCsrfInfo({
      exists: !!token,
      token: token ? `${token.substring(0, 4)}...` : null,
      bypassEnabled: hasBypass
    });
  }, [getCsrfToken]);

  const testCsrfEndpoint = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/csrf', {
        method: 'GET',
        credentials: 'include',
      });
      const data = await response.json();
      setApiResponse(data);
    } catch (error) {
      console.error('Error testing CSRF endpoint:', error);
      setApiResponse({ error: 'Failed to test CSRF endpoint' });
    } finally {
      setIsLoading(false);
    }
  };

  const testCsrfPost = async () => {
    setIsLoading(true);
    try {
      const token = getCsrfToken();
      const response = await fetch('/api/csrf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': token || '',
        },
        credentials: 'include',
      });
      const data = await response.json();
      setApiResponse(data);
    } catch (error) {
      console.error('Error testing CSRF POST:', error);
      setApiResponse({ error: 'Failed to test CSRF POST' });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshToken = async () => {
    setIsLoading(true);
    try {
      // First try the API endpoint directly
      const response = await fetch('/api/csrf?refresh=true', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store'
      });
      const data = await response.json();
      setRefreshResponse(data);
      
      // Then update our local context
      await refreshCsrfToken();
      
      // Update the displayed token info
      const newToken = getCsrfToken();
      setCsrfInfo({
        exists: !!newToken,
        token: newToken ? `${newToken.substring(0, 4)}...` : null,
        bypassEnabled
      });
    } catch (error) {
      console.error('Error refreshing CSRF token:', error);
      setRefreshResponse({ error: 'Failed to refresh CSRF token' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 my-4 border rounded-md bg-gray-50 text-sm">
      <h3 className="font-medium mb-2">CSRF Debug Panel</h3>
      
      <div className="mb-4">
        <div className="font-medium">Current CSRF Status:</div>
        <div className="ml-2 text-gray-600">
          {csrfInfo ? (
            <>
              <div className="flex items-center gap-1">
                <span>Token exists:</span>
                {csrfInfo.exists ? 
                  <span className="text-green-600 font-medium">Yes</span> : 
                  <span className="text-red-600 font-medium">No</span>
                }
              </div>
              {csrfInfo.token && <div>Token preview: {csrfInfo.token}</div>}
              <div className="flex items-center gap-1 mt-1">
                <span>CSRF Bypass:</span>
                {csrfInfo.bypassEnabled ? (
                  <span className="flex items-center text-green-600 font-medium">
                    <ShieldCheck className="h-4 w-4 mr-1" />
                    Enabled (validation disabled)
                  </span>
                ) : (
                  <span className="flex items-center text-yellow-600 font-medium">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    Disabled (validation active)
                  </span>
                )}
              </div>
            </>
          ) : (
            'Loading...'
          )}
        </div>
      </div>
      
      <div className="mb-4">
        <Button
          size="lg"
          variant="default"
          onClick={refreshToken}
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh CSRF Token
        </Button>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-4">
        <Button
          size="sm"
          variant="outline"
          onClick={testCsrfEndpoint}
          disabled={isLoading}
        >
          Test CSRF Endpoint
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          onClick={testCsrfPost}
          disabled={isLoading}
        >
          Test CSRF POST
        </Button>
      </div>
      
      {refreshResponse && (
        <div className="mb-4">
          <div className="font-medium">Refresh Response:</div>
          <pre className="ml-2 bg-gray-100 p-2 rounded text-xs overflow-x-auto">
            {JSON.stringify(refreshResponse, null, 2)}
          </pre>
        </div>
      )}
      
      {apiResponse && (
        <div>
          <div className="font-medium">API Response:</div>
          <pre className="ml-2 bg-gray-100 p-2 rounded text-xs overflow-x-auto">
            {JSON.stringify(apiResponse, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 