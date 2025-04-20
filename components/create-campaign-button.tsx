'use client';

import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Button } from '@/components/ui/button';

interface CreateCampaignButtonProps {
  children: React.ReactNode;
  className?: string;
}

export function CreateCampaignButton({ children, className }: CreateCampaignButtonProps) {
  const router = useRouter();
  const wallet = useWallet();
  const { setVisible } = useWalletModal();

  const handleClick = () => {
    if (wallet.connected) {
      router.push('/create');
    } else {
      setVisible(true);
    }
  };

  return (
    <Button
      onClick={handleClick}
      className={cn("bg-[#20694c] hover:bg-[#185339] text-white font-medium", className)}
    >
      {children}
    </Button>
  );
} 