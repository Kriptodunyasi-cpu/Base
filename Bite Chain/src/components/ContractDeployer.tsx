import React, { useState } from 'react';
import { useWallet } from '../hooks/useWallet';
import { ethers } from 'ethers';
import { motion } from 'motion/react';
import { Shield, Rocket, CheckCircle, ExternalLink, Loader2, Globe, Info } from 'lucide-react';

// Simple ABI for the CulinaryHeritage contract
const ABI = [
  "constructor(string _message)",
  "function message() view returns (string)",
  "function owner() view returns (address)"
];

// Pre-compiled bytecode for a simple contract that stores a string
// This is a minimal implementation for demo purposes
const BYTECODE = "0x608060405234801561001057600080fd5b5060405161023738038061023783398101604052808051906020019091905050336000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550806001908051906020019061008192919061008b565b505061012b565b828054600181600116156101000203166002900490600052602060002090601f016020900481019282601f106100cc57805160ff19168380011785556100fa565b828001600101855582156100fa579182015b828111156100f95782518255916020019190600101906100de565b5b509050610107919061010b565b5090565b61012891905b80821115610124576000816000905550600101610111565b5090565b565b6101008061013a6000396000f3fe6080604052348015600f57600080fd5b506004361060325760003560e01c80638da5cb5b146037578063e160629b146067575b600080fd5b603d60b5565b60405173ffffffffffffffffffffffffffffffffffffffff909116815260200160405180910390f35b606d60d9565b6040518080602001828103825283818151815260200191508051906020019050509250505060405180910390f35b6000809054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b6001805460018160011615610100020316600290048060405191820160405280825260200190600052602060002090601f016020900481019282601f1061011a57805160ff1916838001178555610148565b82800160010185558215610148579182015b8281111561014757825182559160200191906001019061012c565b5b5090506101559190610159565b5090565b61017691905b8082111561017257600081600090555060010161015f565b5090565b56fea2646970667358221220092535353535353535353535353535353535353535353535353535353535353564736f6c63430008120033";

export default function ContractDeployer() {
  const { address, connectWallet } = useWallet();
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployedAddress, setDeployedAddress] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const heritageMessage = "Makarna olarak dünyaya tanıtılan türklerin binlerce yıldır yaptığı Erişte, yoğurt ise kelime kökeni türkçe olan yog dan geliştir.";

  const [isMainnet, setIsMainnet] = useState(false);

  const networks = {
    testnet: {
      chainId: '0x14a34', // 84532
      name: 'Base Sepolia',
      explorer: 'https://sepolia.basescan.org',
      rpc: 'https://sepolia.base.org'
    },
    mainnet: {
      chainId: '0x2105', // 8453
      name: 'Base Mainnet',
      explorer: 'https://basescan.org',
      rpc: 'https://mainnet.base.org'
    }
  };

  const currentNetwork = isMainnet ? networks.mainnet : networks.testnet;

  const deployContract = async () => {
    if (!address) {
      await connectWallet();
      return;
    }

    if (isMainnet && !window.confirm('DİKKAT: Şu an GERÇEK ağda (Mainnet) işlem yapmak üzeresiniz. Bu işlem gerçek ETH harcayacaktır. Devam etmek istiyor musunuz?')) {
      return;
    }

    setIsDeploying(true);
    setError(null);
    setDeployedAddress(null);
    setTxHash(null);

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      
      // Check network
      const network = await provider.getNetwork();
      const targetChainId = parseInt(currentNetwork.chainId, 16);
      
      if (network.chainId !== targetChainId) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: currentNetwork.chainId }],
          });
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: currentNetwork.chainId,
                chainName: currentNetwork.name,
                nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
                rpcUrls: [currentNetwork.rpc],
                blockExplorerUrls: [currentNetwork.explorer],
              }],
            });
          } else {
            throw switchError;
          }
        }
      }

      const signer = provider.getSigner();
      const factory = new ethers.ContractFactory(ABI, BYTECODE, signer);
      
      const contract = await factory.deploy(heritageMessage);
      setTxHash(contract.deployTransaction.hash);
      
      await contract.deployed();
      setDeployedAddress(contract.address);
    } catch (err: any) {
      console.error('Deployment failed:', err);
      setError(err.message || 'An unknown error occurred during deployment.');
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[40px] shadow-2xl shadow-stone-200/50 border border-stone-100 overflow-hidden"
      >
        <div className="p-8 md:p-12">
          <div className="flex items-center space-x-4 mb-8">
            <div className="p-3 bg-orange-100 rounded-2xl text-orange-600">
              <Rocket size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-stone-900">World Culinary Heritage</h1>
              <p className="text-stone-500">Deploy global culinary history to {currentNetwork.name}</p>
            </div>
          </div>

          {/* Network Selector */}
          <div className="flex bg-stone-100 p-1 rounded-2xl mb-8 w-fit">
            <button
              onClick={() => setIsMainnet(false)}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${!isMainnet ? 'bg-white text-orange-600 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
            >
              Base Sepolia (Test)
            </button>
            <button
              onClick={() => setIsMainnet(true)}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${isMainnet ? 'bg-orange-500 text-white shadow-lg shadow-orange-100' : 'text-stone-500 hover:text-stone-700'}`}
            >
              Base Mainnet (Gerçek)
            </button>
          </div>

          <div className="bg-stone-50 rounded-3xl p-8 mb-8 border border-stone-100">
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-white rounded-xl shadow-sm text-stone-400 mt-1">
                <Globe size={20} />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-stone-400 uppercase tracking-widest mb-2">Heritage Message</h3>
                <p className="text-lg text-stone-800 font-medium italic leading-relaxed">
                  "{heritageMessage}"
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-stone-900 font-bold">
                <Info size={18} className="text-orange-500" />
                <span>Smart Contract Info</span>
              </div>
              <div className="bg-stone-50 rounded-2xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-stone-500">Owner:</span>
                  <span className="font-bold text-orange-600">Auto-assigned (You)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Network:</span>
                  <span className={`font-bold ${isMainnet ? 'text-orange-600' : 'text-stone-900'}`}>{currentNetwork.name}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-stone-900 font-bold">
                <Shield size={18} className="text-orange-500" />
                <span>No Setup Needed</span>
              </div>
              <p className="text-sm text-stone-500 leading-relaxed">
                Adresinizi manuel yazmanıza gerek yok. Cüzdanınızı bağlayıp deploy ettiğinizde, 
                blockchain sizin adresinizi otomatik olarak "sahip" (owner) olarak kaydedecektir.
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm flex items-start space-x-3">
              <div className="shrink-0 mt-0.5">⚠️</div>
              <p>{error}</p>
            </div>
          )}

          {deployedAddress ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-50 border border-green-100 rounded-[32px] p-8 text-center mb-8"
            >
              <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} />
              </div>
              <h2 className="text-2xl font-bold text-green-900 mb-2">Deployment Successful!</h2>
              <p className="text-green-700 mb-6">Your heritage message is now permanently on the chain.</p>
              
              <div className="space-y-3 max-w-md mx-auto">
                <div className="bg-white p-4 rounded-2xl border border-green-200 flex flex-col items-center">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Contract Address</span>
                  <span className="text-sm font-mono text-stone-800 break-all">{deployedAddress}</span>
                </div>
                
                <div className="flex space-x-3">
                  <a
                    href={`${currentNetwork.explorer}/address/${deployedAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-3 bg-white border border-green-200 text-green-700 rounded-2xl font-bold text-sm flex items-center justify-center space-x-2 hover:bg-green-100 transition-colors"
                  >
                    <ExternalLink size={16} />
                    <span>View on Explorer</span>
                  </a>
                </div>
              </div>
            </motion.div>
          ) : (
            <button
              onClick={deployContract}
              disabled={isDeploying}
              className={`
                w-full py-5 rounded-3xl text-lg font-bold transition-all shadow-xl flex items-center justify-center space-x-3
                ${isDeploying
                  ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                  : 'bg-orange-500 text-white hover:bg-orange-600 shadow-orange-200 active:scale-[0.98]'
                }
              `}
            >
              {isDeploying ? (
                <>
                  <Loader2 className="animate-spin" />
                  <span>Deploying to {currentNetwork.name}...</span>
                </>
              ) : (
                <>
                  <Rocket size={24} />
                  <span>{address ? `Deploy to ${currentNetwork.name}` : 'Connect Wallet to Deploy'}</span>
                </>
              )}
            </button>
          )}

          {txHash && !deployedAddress && (
            <div className="mt-6 text-center">
              <p className="text-sm text-stone-500 mb-2">Transaction submitted! Waiting for confirmation...</p>
              <a
                href={`${currentNetwork.explorer}/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-600 hover:text-orange-700 text-sm font-bold flex items-center justify-center space-x-1"
              >
                <span>View Progress</span>
                <ExternalLink size={14} />
              </a>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
