'use client';

import { useState } from 'react';
import { 
  FacebookShareButton, FacebookIcon,
  TwitterShareButton, TwitterIcon,
  LinkedinShareButton, LinkedinIcon,
  WhatsappShareButton, WhatsappIcon,
  EmailShareButton, EmailIcon
} from 'react-share';
import { Copy, Check, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

interface ShareButtonsProps {
  url: string;
  title: string;
  description?: string;
  className?: string;
}

export function ShareButtons({ 
  url, 
  title, 
  description = '',
  className = ''
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}${url}` : url;
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            <span>Share</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="p-2">
          <div className="grid grid-cols-2 gap-2 p-2">
            <FacebookShareButton url={fullUrl} className="flex justify-center">
              <FacebookIcon size={32} round />
            </FacebookShareButton>
            
            <TwitterShareButton url={fullUrl} title={title} className="flex justify-center">
              <TwitterIcon size={32} round />
            </TwitterShareButton>
            
            <LinkedinShareButton url={fullUrl} title={title} className="flex justify-center">
              <LinkedinIcon size={32} round />
            </LinkedinShareButton>
            
            <WhatsappShareButton url={fullUrl} title={title} className="flex justify-center">
              <WhatsappIcon size={32} round />
            </WhatsappShareButton>
            
            <EmailShareButton url={fullUrl} subject={title} body={description} className="flex justify-center">
              <EmailIcon size={32} round />
            </EmailShareButton>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleCopyLink} 
              className="flex items-center justify-center gap-1 h-8 w-8 p-0 rounded-full"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
} 