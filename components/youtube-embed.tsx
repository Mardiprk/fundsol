'use client';

import { useState, useEffect } from 'react';
import { extractYouTubeVideoId } from '@/lib/utils';

interface YouTubeEmbedProps {
  url: string;
  title?: string;
  className?: string;
}

export function YouTubeEmbed({ url, title = 'YouTube video', className = '' }: YouTubeEmbedProps) {
  const [videoId, setVideoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Only run extractYouTubeVideoId on the client-side to prevent hydration issues
    // And to validate the video ID in a consistent environment
    const id = extractYouTubeVideoId(url);
    
    if (!id) {
      setError('Invalid YouTube URL');
      setVideoId(null);
      return;
    }
    
    // Additional validation - YouTube IDs are typically 11 characters
    if (!/^[a-zA-Z0-9_-]{11}$/.test(id)) {
      setError('Invalid YouTube video ID format');
      setVideoId(null);
      return;
    }
    
    setVideoId(id);
    setError(null);
  }, [url]);
  
  if (error) {
    return (
      <div className={`bg-gray-100 dark:bg-gray-800 p-4 text-center ${className}`}>
        <p className="text-gray-500 dark:text-gray-400">{error}</p>
      </div>
    );
  }
  
  if (!videoId) {
    return (
      <div className={`bg-gray-100 dark:bg-gray-800 p-4 animate-pulse ${className}`}>
        <div className="h-full w-full"></div>
      </div>
    );
  }
  
  // Using a strict allow list for embed parameters
  // Enhanced security with sandbox attribute to restrict functionality
  return (
    <div className={`aspect-video relative overflow-hidden ${className}`}>
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?rel=0`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        sandbox="allow-same-origin allow-scripts allow-popups allow-presentation"
        allowFullScreen
        className="absolute top-0 left-0 w-full h-full"
        loading="lazy"
      />
    </div>
  );
} 