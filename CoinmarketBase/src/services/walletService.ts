import { ethers } from 'ethers';
import { Connection, PublicKey } from '@solana/web3.js';
import { PROJECT_CONFIG } from '../constants/project';

export interface TokenAsset {
  symbol: string;
  name: string;
  balance: number;
  valueUsd: number;
  network: string;
  category: 'wallet' | 'staking' | 'lp';
  icon?: string;
}

export interface Portfolio {
  [symbol: string]: number; // Keep for similarity calculation
}

export interface PortfolioDetails {
  totalValueUsd: number;
  assets: TokenAsset[];
  diversity: { [category: string]: number };
  networkDistribution: { [network: string]: number };
}

// EIP-6963 types
interface EIP6963ProviderDetail {
  info: {
    uuid: string;
    name: string;
    icon: string;
    rdns: string;
  };
  provider: any;
}

const discoveredProviders: EIP6963ProviderDetail[] = [];

// Listen for EIP-6963 providers
if (typeof window !== 'undefined') {
  window.addEventListener("eip6963:announceProvider", (event: any) => {
    const detail = event.detail as EIP6963ProviderDetail;
    if (!discoveredProviders.find(p => p.info.uuid === detail.info.uuid)) {
      discoveredProviders.push(detail);
      console.log("Discovered EIP-6963 provider:", detail.info.name);
    }
  });
  window.dispatchEvent(new Event("eip6963:requestProvider"));
}

const BASE_SEPOLIA_CHAIN_ID = '0x14a34'; // 84532

const switchToBaseSepolia = async (provider: any) => {
  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: BASE_SEPOLIA_CHAIN_ID }],
    });
  } catch (switchError: any) {
    // This error code indicates that the chain has not been added to MetaMask.
    if (switchError.code === 4902) {
      try {
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: BASE_SEPOLIA_CHAIN_ID,
              chainName: 'Base Sepolia',
              nativeCurrency: {
                name: 'Ether',
                symbol: 'ETH',
                decimals: 18,
              },
              rpcUrls: ['https://sepolia.base.org'],
              blockExplorerUrls: ['https://sepolia.basescan.org'],
            },
          ],
        });
      } catch (addError) {
        console.error('Error adding Base Sepolia:', addError);
      }
    }
    console.error('Error switching to Base Sepolia:', switchError);
  }
};

export const connectEVM = async (walletType: 'metamask' | 'coinbase' = 'metamask'): Promise<string | null> => {
  let provider: any;
  
  try {
    console.log(`Attempting to connect to ${walletType}...`);
    const win = window as any;
    
    // Try EIP-6963 first
    const eipProvider = discoveredProviders.find(p => 
      walletType === 'metamask' ? p.info.rdns === 'io.metamask' : p.info.rdns === 'com.coinbase.wallet'
    );

    if (eipProvider) {
      console.log(`Found ${walletType} via EIP-6963`);
      provider = eipProvider.provider;
    } else {
      // Fallback to legacy detection
      if (walletType === 'metamask') {
        provider = win.ethereum?.isMetaMask ? win.ethereum : 
                   win.ethereum?.providers?.find((p: any) => p.isMetaMask) || 
                   (win.ethereum && !win.ethereum.isCoinbaseWallet ? win.ethereum : null);
      } else if (walletType === 'coinbase') {
        provider = win.coinbaseWalletExtension || 
                   (win.ethereum?.isCoinbaseWallet ? win.ethereum : null) ||
                   win.ethereum?.providers?.find((p: any) => p.isCoinbaseWallet);
      }
    }

    if (!provider) {
      console.error(`No provider found for ${walletType}`);
      alert(`Please install ${walletType === 'metamask' ? 'MetaMask' : 'Coinbase Wallet'} extension. If it is already installed, try opening this app in a new tab.`);
      return null;
    }

    // Switch to Base Sepolia
    await switchToBaseSepolia(provider);

    console.log(`${walletType} provider found, requesting accounts...`);
    
    // Direct request first to bypass some ethers abstraction issues in iframes
    const accounts = await Promise.race([
      provider.request({ method: 'eth_requestAccounts' }),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Request timed out")), 20000))
    ]) as string[];

    if (accounts && accounts.length > 0) {
      console.log(`Connected to ${walletType}: ${accounts[0]}`);
      return accounts[0];
    }
  } catch (error: any) {
    console.error(`${walletType} connection error:`, error);
    if (error.code === 4001) {
      alert("Connection rejected by user.");
    } else if (error.message === "Request timed out") {
      alert("Connection request timed out. This usually happens in iframes. Please open the app in a new tab using the button in the top right.");
    } else {
      alert(`Failed to connect to ${walletType}: ${error.message || 'Unknown error'}`);
    }
    return null;
  }
  
  return null;
};

export const connectSolana = async (): Promise<string | null> => {
  try {
    console.log("Attempting to connect to Phantom...");
    const win = window as any;
    
    // Check multiple possible injection points for Phantom
    const solana = win.phantom?.solana || win.solana;
    
    if (!solana || !solana.isPhantom) {
      console.error("Phantom provider not found");
      alert("Please install Phantom wallet extension. If it is already installed, try opening this app in a new tab.");
      return null;
    }

    console.log("Phantom provider found, connecting...");
    const response = await solana.connect();
    console.log("Connected to Phantom:", response.publicKey.toString());
    return response.publicKey.toString();
  } catch (error: any) {
    console.error("Solana connection error:", error);
    if (error.code === 4001) {
      alert("Connection rejected by user.");
    } else {
      alert(`Failed to connect to Phantom: ${error.message || 'Unknown error'}. Try opening the app in a new tab.`);
    }
    return null;
  }
};

// Mock portfolio analyzer for DeBank-style detailed view
export const analyzePortfolio = async (address: string, type: 'evm' | 'solana'): Promise<{ summary: Portfolio, details: PortfolioDetails }> => {
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = ((hash << 5) - hash) + address.charCodeAt(i);
    hash |= 0;
  }
  hash = Math.abs(hash);

  const assets: TokenAsset[] = [];
  
  if (type === 'evm') {
    // Mock Ethereum Assets
    assets.push({ symbol: 'ETH', name: 'Ethereum', balance: (hash % 5) + 0.5, valueUsd: ((hash % 5) + 0.5) * 3500, network: 'Ethereum', category: 'wallet' });
    assets.push({ symbol: 'USDC', name: 'USD Coin', balance: (hash % 1000) + 500, valueUsd: (hash % 1000) + 500, network: 'Ethereum', category: 'wallet' });
    
    // Mock Base Assets
    assets.push({ symbol: 'WETH', name: 'Wrapped Ether', balance: (hash % 2) + 0.1, valueUsd: ((hash % 2) + 0.1) * 3500, network: 'Base', category: 'wallet' });
    assets.push({ symbol: 'AERO', name: 'Aerodrome', balance: (hash % 500) + 100, valueUsd: ((hash % 500) + 100) * 0.8, network: 'Base', category: 'lp' });
    
    // Mock Base Sepolia (Requested for testing)
    assets.push({ symbol: 'ETH', name: 'Base Sepolia ETH', balance: (hash % 1) + 0.05, valueUsd: ((hash % 1) + 0.05) * 3500, network: 'Base Sepolia', category: 'wallet' });
    assets.push({ symbol: 'TEST', name: 'Test Token', balance: (hash % 1000) + 100, valueUsd: ((hash % 1000) + 100) * 0.1, network: 'Base Sepolia', category: 'wallet' });
    assets.push({ symbol: PROJECT_CONFIG.symbol, name: PROJECT_CONFIG.name, balance: 1000000, valueUsd: 1000, network: 'Base Sepolia', category: 'wallet' });
    
    // Mock Arbitrum
    assets.push({ symbol: 'ARB', name: 'Arbitrum', balance: (hash % 1000) + 200, valueUsd: ((hash % 1000) + 200) * 1.1, network: 'Arbitrum', category: 'wallet' });
    
    // Mock Optimism
    assets.push({ symbol: 'OP', name: 'Optimism', balance: (hash % 800) + 150, valueUsd: ((hash % 800) + 150) * 2.5, network: 'Optimism', category: 'wallet' });

    // Mock Linea & ZRO (Requested)
    assets.push({ symbol: 'ZRO', name: 'LayerZero', balance: (hash % 300) + 50, valueUsd: ((hash % 300) + 50) * 4.2, network: 'Arbitrum', category: 'wallet' });
    assets.push({ symbol: 'LINEA', name: 'Linea ETH', balance: (hash % 1.5) + 0.2, valueUsd: ((hash % 1.5) + 0.2) * 3500, network: 'Linea', category: 'wallet' });
    
    // Mock Staking
    assets.push({ symbol: 'stETH', name: 'Lido Staked ETH', balance: (hash % 3) + 1, valueUsd: ((hash % 3) + 1) * 3600, network: 'Ethereum', category: 'staking' });
  } else {
    // Mock Solana Assets
    assets.push({ symbol: 'SOL', name: 'Solana', balance: (hash % 50) + 10, valueUsd: ((hash % 50) + 10) * 140, network: 'Solana', category: 'wallet' });
    assets.push({ symbol: 'JUP', name: 'Jupiter', balance: (hash % 500) + 200, valueUsd: ((hash % 500) + 200) * 1.2, network: 'Solana', category: 'wallet' });
    
    // Mock LP/Staking
    assets.push({ symbol: 'mSOL', name: 'Marinade Staked SOL', balance: (hash % 20) + 5, valueUsd: ((hash % 20) + 5) * 160, network: 'Solana', category: 'staking' });
    assets.push({ symbol: 'ORCA-LP', name: 'Orca SOL-USDC LP', balance: (hash % 10) + 1, valueUsd: ((hash % 10) + 1) * 500, network: 'Solana', category: 'lp' });
  }

  const totalValueUsd = assets.reduce((sum, a) => sum + a.valueUsd, 0);
  
  const summary: Portfolio = {};
  assets.forEach(a => {
    // CRITICAL: We store the USD value weight for similarity calculation, not raw balance
    summary[a.symbol] = (summary[a.symbol] || 0) + a.valueUsd;
  });

  const diversity = {
    wallet: Math.round((assets.filter(a => a.category === 'wallet').reduce((sum, a) => sum + a.valueUsd, 0) / totalValueUsd) * 100),
    staking: Math.round((assets.filter(a => a.category === 'staking').reduce((sum, a) => sum + a.valueUsd, 0) / totalValueUsd) * 100),
    lp: Math.round((assets.filter(a => a.category === 'lp').reduce((sum, a) => sum + a.valueUsd, 0) / totalValueUsd) * 100),
  };

  const networkDistribution: { [network: string]: number } = {};
  const networks = [...new Set(assets.map(a => a.network))];
  networks.forEach(net => {
    const netValue = assets.filter(a => a.network === net).reduce((sum, a) => sum + a.valueUsd, 0);
    networkDistribution[net] = Math.round((netValue / totalValueUsd) * 100);
  });

  return {
    summary,
    details: {
      totalValueUsd,
      assets,
      diversity,
      networkDistribution
    }
  };
};

export const calculateSimilarity = (p1: Portfolio, p2: Portfolio): number => {
  const allSymbols = new Set([...Object.keys(p1), ...Object.keys(p2)]);
  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;

  allSymbols.forEach(symbol => {
    const v1 = p1[symbol] || 0;
    const v2 = p2[symbol] || 0;
    dotProduct += v1 * v2;
    mag1 += v1 * v1;
    mag2 += v2 * v2;
  });

  if (mag1 === 0 || mag2 === 0) return 0;
  return dotProduct / (Math.sqrt(mag1) * Math.sqrt(mag2));
};
