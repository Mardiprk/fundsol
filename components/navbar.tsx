'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { WalletConnect } from '@/components/wallet-connect';

export function Navbar() {
  const pathname = usePathname();
  const { connected } = useWallet();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Close mobile menu when changing routes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-all duration-200",
        isScrolled 
          ? "bg-white/90 dark:bg-black/90 border-b border-gray-200 dark:border-gray-800 backdrop-blur-sm" 
          : "bg-transparent"
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between py-4">
        <div className="flex items-center">
          <Link href="/" className="flex items-center mr-6">
            <div className="w-10 h-10 rounded-[10px] overflow-hidden mr-2">
              <Image 
                src="/fundsol.png" 
                alt="FundSol Logo" 
                width={40} 
                height={40}
                className="w-full h-full object-cover"
              />
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              href="/campaigns" 
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname === "/campaigns" ? "text-foreground" : "text-muted-foreground"
              )}
            >
              Explore
            </Link>
            <Link 
              href="/create" 
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname === "/create" ? "text-foreground" : "text-muted-foreground"
              )}
            >
              Create
            </Link>
            {connected && (
              <>
                <Link 
                  href="/profile" 
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    pathname === "/profile" ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  Profile
                </Link>
              </>
            )}
          </nav>
        </div>
        
        <div className="flex items-center gap-2">
          <WalletConnect className="ml-auto" />
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            onClick={toggleMobileMenu}
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-lg z-50">
          <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex flex-col gap-2">
            <Link 
              href="/campaigns" 
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                pathname === "/campaigns" 
                  ? "bg-gray-100 dark:bg-gray-800 text-foreground" 
                  : "hover:bg-gray-100 dark:hover:bg-gray-800 text-muted-foreground"
              )}
            >
              Explore Campaigns
            </Link>
            <Link 
              href="/create" 
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                pathname === "/create" 
                  ? "bg-gray-100 dark:bg-gray-800 text-foreground" 
                  : "hover:bg-gray-100 dark:hover:bg-gray-800 text-muted-foreground"
              )}
            >
              Create Campaign
            </Link>
            {connected && (
              <>
                <Link 
                  href="/profile" 
                  className={cn(
                    "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                    pathname === "/profile" 
                      ? "bg-gray-100 dark:bg-gray-800 text-foreground" 
                      : "hover:bg-gray-100 dark:hover:bg-gray-800 text-muted-foreground"
                  )}
                >
                  My Profile
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
} 