'use client';

import { ReactNode } from 'react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { UserProfileProvider } from '@/lib/user-profile';
import { SolanaProvider } from '@/lib/solana-provider';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light">
      <SolanaProvider>
        <UserProfileProvider>
          {children}
          <Toaster />
        </UserProfileProvider>
      </SolanaProvider>
    </ThemeProvider>
  );
} 