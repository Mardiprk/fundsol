"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { WalletIcon } from "lucide-react";

// Dynamically import WalletMultiButton with ssr disabled
const WalletMultiButton = dynamic(
  async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

interface WalletConnectProps {
  className?: string;
}

export function WalletConnect({ className }: WalletConnectProps) {
  const [mounted, setMounted] = useState(false);
  
  // Wait until component is mounted to render wallet button
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // If not mounted yet, show a placeholder button with similar styling
  if (!mounted) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        className={className}
        disabled
      >
        <WalletIcon className="mr-2 h-4 w-4" />
        Loading...
      </Button>
    );
  }

  return (
    <WalletMultiButton className={`${className || ""}`} />
  );
} 