'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { ProfileNameForm } from '@/components/profile-name-form';

interface UserProfile {
  id?: string;
  name?: string;
  walletAddress?: string;
  profileCompleted: boolean;
  isLoading: boolean;
}

interface UserProfileContextType {
  userProfile: UserProfile;
  refreshUserProfile: () => Promise<void>;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export function useUserProfile() {
  const context = useContext(UserProfileContext);
  if (context === undefined) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return context;
}

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const { publicKey, connected } = useWallet();
  const [showNameForm, setShowNameForm] = useState(false);
  
  const [userProfile, setUserProfile] = useState<UserProfile>({
    profileCompleted: false,
    isLoading: false,
  });

  const fetchUserProfile = async (walletAddress: string) => {
    setUserProfile(prev => ({ ...prev, isLoading: true }));
    try {
      const response = await fetch(`/api/users/profile?walletAddress=${walletAddress}`);
      const data = await response.json();
      
      if (data.success && data.user) {
        setUserProfile({
          id: data.user.id,
          name: data.user.name,
          walletAddress: data.user.walletAddress,
          profileCompleted: data.user.profileCompleted,
          isLoading: false,
        });
        
        // If profile not completed, show name form
        if (!data.user.profileCompleted) {
          setShowNameForm(true);
        }
      } else {
        // No user profile found, need to create one
        setUserProfile({
          walletAddress,
          profileCompleted: false,
          isLoading: false,
        });
        setShowNameForm(true);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUserProfile({
        walletAddress,
        profileCompleted: false,
        isLoading: false,
      });
    }
  };

  const refreshUserProfile = async () => {
    if (connected && publicKey) {
      await fetchUserProfile(publicKey.toString());
    }
  };

  useEffect(() => {
    if (connected && publicKey) {
      fetchUserProfile(publicKey.toString());
    } else {
      // Reset when disconnected
      setUserProfile({
        profileCompleted: false,
        isLoading: false,
      });
      setShowNameForm(false);
    }
  }, [connected, publicKey]);

  const handleProfileComplete = (name: string) => {
    setUserProfile(prev => ({
      ...prev,
      name,
      profileCompleted: true,
    }));
    setShowNameForm(false);
  };

  return (
    <UserProfileContext.Provider value={{ userProfile, refreshUserProfile }}>
      {children}
      
      {/* Show name form dialog when needed */}
      {showNameForm && connected && publicKey && (
        <ProfileNameForm
          open={showNameForm}
          walletAddress={publicKey.toString()}
          onComplete={handleProfileComplete}
        />
      )}
    </UserProfileContext.Provider>
  );
} 