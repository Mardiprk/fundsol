'use client';

import { useState, useEffect, useCallback } from 'react';
import { AlertCircle, WifiOff } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';

export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [apiStatus, setApiStatus] = useState<'loading' | 'available' | 'unavailable'>('loading');
  const [dbStatus, setDbStatus] = useState<'available' | 'unavailable' | 'unknown'>('unknown');

  // Check API and database status
  const checkApiStatus = useCallback(async () => {
    if (!isOnline) return;

    setApiStatus('loading');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('/api/health', {
        signal: controller.signal,
        cache: 'no-store',
      });
      
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        setApiStatus('available');
        setDbStatus(data.database?.connected ? 'available' : 'unavailable');
      } else {
        setApiStatus('unavailable');
        setDbStatus('unknown');
      }
    } catch (error) {
      console.error('API health check error:', error);
      setApiStatus('unavailable');
      setDbStatus('unknown');
    }
  }, [isOnline]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Connection restored');
      checkApiStatus();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error('Connection lost');
      setApiStatus('unavailable');
      setDbStatus('unknown');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    checkApiStatus();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkApiStatus]);

  // If everything is good, don't render anything
  if (isOnline && apiStatus === 'available' && dbStatus === 'available') {
    return null;
  }

  return (
    <Alert variant="destructive" className="fixed bottom-4 right-4 max-w-sm z-50 shadow-lg">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>
        {!isOnline ? (
          'Connection Lost'
        ) : apiStatus === 'unavailable' ? (
          'API Unavailable'
        ) : dbStatus === 'unavailable' ? (
          'Database Error'
        ) : (
          'Connection Issues'
        )}
      </AlertTitle>
      <AlertDescription>
        {!isOnline ? (
          <div className="flex items-center gap-2">
            <WifiOff className="h-4 w-4" />
            <span>Your device is offline. Please check your internet connection.</span>
          </div>
        ) : apiStatus === 'unavailable' ? (
          'Cannot connect to the server. Please try again later.'
        ) : dbStatus === 'unavailable' ? (
          'Database connection issue. Some features may not work properly.'
        ) : (
          'Checking connection status...'
        )}
      </AlertDescription>
      {isOnline && (
        <button 
          onClick={checkApiStatus} 
          className="mt-2 text-xs underline"
        >
          Retry connection
        </button>
      )}
    </Alert>
  );
} 