'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useConnection } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/components/ui/use-toast';
import { useSecurity } from '@/components/security/security-provider';

interface DonateButtonProps {
  campaignId: string;
  campaignTitle: string;
  isEnded?: boolean;
  hasMatching?: boolean;
  matchingAmount?: number;
  remainingMatchingAmount?: number;
  onDonationComplete?: (amount: number) => void;
}

export function DonateButton({ 
  campaignId, 
  campaignTitle, 
  isEnded,
  hasMatching = false,
  remainingMatchingAmount = 0,
  onDonationComplete 
}: DonateButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);
  const [insufficientFunds, setInsufficientFunds] = useState(false);
  
  const { connection } = useConnection();
  const wallet = useWallet();
  const { setVisible } = useWalletModal();
  const { publicKey, connected, sendTransaction } = wallet;
  const { toast } = useToast();
  const { secureFetch } = useSecurity();

  // Calculate a potential matching amount if the campaign has matching funds
  const calculateMatchingAmount = (donationAmount: number): number => {
    if (!hasMatching || remainingMatchingAmount <= 0) {
      return 0;
    }
    // Match donation 1:1 up to the remaining matching amount
    return Math.min(donationAmount, remainingMatchingAmount);
  };

  // Parse the donation amount with proper validation
  const donationAmount = parseFloat(amount) || 0;
  const calculatedMatchingAmount = calculateMatchingAmount(donationAmount);
  const totalImpact = donationAmount + calculatedMatchingAmount;

  // Check wallet balance when connected
  useEffect(() => {
    async function checkBalance() {
      if (connected && publicKey) {
        setIsBalanceLoading(true);
        try {
          const balance = await connection.getBalance(publicKey);
          setWalletBalance(balance / LAMPORTS_PER_SOL);
        } catch (error) {
          console.error('Error fetching wallet balance:', error);
        } finally {
          setIsBalanceLoading(false);
        }
      } else {
        setWalletBalance(null);
      }
    }
    
    checkBalance();
  }, [connected, publicKey, connection]);

  // Check if the amount exceeds wallet balance
  useEffect(() => {
    if (walletBalance !== null && parseFloat(amount) > walletBalance) {
      setInsufficientFunds(true);
    } else {
      setInsufficientFunds(false);
    }
  }, [amount, walletBalance]);

  const handleDonate = useCallback(async () => {
    if (!connected || !publicKey) {
      setVisible(true);
      return;
    }

    // Validate donation amount
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid donation amount.",
        variant: "destructive",
      });
      return;
    }

    // Check for sufficient balance
    if (insufficientFunds) {
      toast({
        title: "Insufficient Funds",
        description: "Your wallet doesn't have enough SOL for this donation.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get campaign wallet address from the campaignId
      const campaignResponse = await secureFetch(`/api/campaigns?slug=${campaignId}`);
      if (!campaignResponse.ok) {
        throw new Error('Failed to fetch campaign details');
      }
      
      const campaignData = await campaignResponse.json();
      if (!campaignData.success || !campaignData.campaigns || campaignData.campaigns.length === 0) {
        throw new Error('Campaign not found');
      }
      
      const campaignWalletAddress = campaignData.campaigns[0].wallet_address;
      if (!campaignWalletAddress) {
        throw new Error('Campaign wallet address not found');
      }
      
      // Create a Solana transaction
      const lamports = donationAmount * LAMPORTS_PER_SOL;
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(campaignWalletAddress),
          lamports: Math.floor(lamports),
        })
      );
      
      // Get the latest blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;
      
      // Send the transaction
      const signature = await sendTransaction(transaction, connection);
      
      // Wait for confirmation
      const confirmation = await connection.confirmTransaction(signature, 'confirmed');
      
      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${confirmation.value.err.toString()}`);
      }
      
      // Record the donation in the database
      const donationId = uuidv4();
      
      const donationResponse = await secureFetch('/api/donations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: donationId,
          campaign_id: campaignId,
          wallet_address: publicKey.toString(),
          amount: donationAmount,
          transaction_signature: signature,
        }),
      });

      if (!donationResponse.ok) {
        throw new Error('Failed to record donation');
      }
      
      // Refresh wallet balance after successful donation
      const newBalance = await connection.getBalance(publicKey);
      setWalletBalance(newBalance / LAMPORTS_PER_SOL);
      
      toast({
        title: "Donation Successful",
        description: `Successfully donated ${amount} SOL to ${campaignTitle}`,
      });
      setIsOpen(false);
      setAmount('');
      
      // Call the donation complete callback to update UI
      if (onDonationComplete) {
        onDonationComplete(donationAmount);
      }
    } catch (error) {
      console.error('Error processing donation:', error);
      toast({
        title: "Donation Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [connected, publicKey, amount, campaignId, campaignTitle, onDonationComplete, connection, sendTransaction, insufficientFunds, secureFetch, toast]);

  // Clean up function when component unmounts
  useEffect(() => {
    return () => {
      // Clean up any pending state
      setIsSubmitting(false);
      setIsBalanceLoading(false);
    };
  }, []);

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)} 
        size="lg"
        className="bg-[#b5f265] hover:bg-[#a5e354] text-black font-medium px-6 h-12"
        disabled={isEnded}
      >
        {isEnded ? 'Campaign Ended' : 'Donate SOL'}
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Donate to {campaignTitle}</DialogTitle>
            <DialogDescription>
              Support this campaign with Solana. Your donation will make a difference.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label htmlFor="amount" className="text-sm font-medium leading-none">
                Amount (in SOL)
              </label>
              
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={insufficientFunds ? 'border-red-500 pr-16' : 'pr-16'}
                  disabled={isSubmitting}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                  SOL
                </div>
              </div>
              
              {insufficientFunds && (
                <p className="text-sm text-red-500">
                  Insufficient balance. Your wallet has {walletBalance?.toFixed(4)} SOL
                </p>
              )}
              
              {isBalanceLoading && (
                <div className="flex items-center text-sm text-gray-500">
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Loading wallet balance...
                </div>
              )}
            </div>
            
            {hasMatching && remainingMatchingAmount > 0 && donationAmount > 0 && (
              <div className="p-3 bg-[#f0fbdc] rounded-md border border-[#c5f078] text-sm">
                <p className="font-medium text-green-800">Matching Impact: +{calculatedMatchingAmount.toFixed(2)} SOL</p>
                <p className="text-green-700 mt-1">
                  Your donation of {donationAmount.toFixed(2)} SOL will be matched with {calculatedMatchingAmount.toFixed(2)} SOL from the sponsor!
                </p>
                <p className="text-green-700 mt-1 font-medium">
                  Total impact: {totalImpact.toFixed(2)} SOL
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button 
              onClick={handleDonate} 
              disabled={isSubmitting || !amount || parseFloat(amount) <= 0 || insufficientFunds}
              className="bg-[#b5f265] hover:bg-[#a5e354] text-black font-medium"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Donate Now'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 