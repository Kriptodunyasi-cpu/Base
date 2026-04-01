import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './useAuth';

export function useWallet() {
  const { user, profile } = useAuth();
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.walletAddress) {
      setAddress(profile.walletAddress);
    }
  }, [profile]);

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError('Please install MetaMask or another crypto wallet.');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      const connectedAddress = accounts[0];
      
      setAddress(connectedAddress);

      // Update user profile in Firestore if logged in
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        await updateDoc(docRef, {
          walletAddress: connectedAddress
        });
      }
    } catch (err: any) {
      console.error('Wallet connection error:', err);
      setError(err.message || 'Failed to connect wallet.');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAddress(null);
  };

  return { address, isConnecting, error, connectWallet, disconnectWallet };
}

// Add types for window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}
