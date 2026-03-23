import React, { useState, useEffect, useMemo } from 'react';
import { auth, db, signInWithGoogle, logout, signInAsGuest } from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, onSnapshot, addDoc, orderBy, limit, where, serverTimestamp } from 'firebase/firestore';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Users, 
  MessageSquare, 
  Star, 
  Search,
  LayoutDashboard,
  LogOut,
  ChevronRight,
  Send,
  X,
  CreditCard,
  Code,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchTopCoins, CoinData, getTopGainers, getTopLosers } from './services/cryptoService';
import { connectEVM, connectSolana, analyzePortfolio, Portfolio, PortfolioDetails, TokenAsset, calculateSimilarity } from './services/walletService';
import { PROJECT_CONFIG } from './contants/project';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

// --- Components ---

const Navbar = ({ user, profile, onLogout, activeTab, setActiveTab, onOpenWalletModal }: any) => (
  <nav className="fixed top-0 left-0 right-0 h-16 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between px-6 z-50">
    <div className="flex items-center gap-6">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
          <span className="text-black font-bold text-xl">C</span>
        </div>
        <span className="text-white font-bold text-xl tracking-tight">CoinmarketBase</span>
      </div>

      <div className="hidden lg:flex items-center gap-6">
        {[
          { id: 'market', label: 'Market', icon: LayoutDashboard },
          { id: 'watchlist', label: 'Watchlist', icon: Star },
          { id: 'portfolio', label: 'Portfolio', icon: Wallet },
          { id: 'social', label: 'Social', icon: Users },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 text-sm font-medium transition-colors ${
              activeTab === tab.id ? 'text-emerald-400' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>
    </div>

    <div className="flex items-center gap-4">
      {/* Wallet Info in Navbar */}
      <div className="hidden sm:flex items-center gap-3">
        {profile?.evmAddress && (
          <div className="bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-xl flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-mono text-zinc-400">
              {profile.evmAddress.slice(0, 6)}...{profile.evmAddress.slice(-4)}
            </span>
          </div>
        )}
        {profile?.solanaAddress && (
          <div className="bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-xl flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-mono text-zinc-400">
              {profile.solanaAddress.slice(0, 4)}...{profile.solanaAddress.slice(-4)}
            </span>
          </div>
        )}
        {!profile?.evmAddress && !profile?.solanaAddress && (
          <button 
            onClick={onOpenWalletModal}
            className="bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
          >
            <Wallet size={14} />
            Connect Wallet
          </button>
        )}
      </div>

      {user && (
        <div className="flex items-center gap-3 pl-4 border-l border-zinc-800">
          <div className="text-right hidden xl:block">
            <p className="text-[10px] text-zinc-500">Welcome,</p>
            <p className="text-xs font-medium text-white">{user.displayName}</p>
          </div>
          <button onClick={onLogout} className="p-2 text-zinc-400 hover:text-white transition-colors">
            <LogOut size={18} />
          </button>
        </div>
      )}
    </div>
  </nav>
);

const ConnectWalletModal = ({ isOpen, onClose, onConnect }: any) => {
  const [connecting, setConnecting] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConnect = async (type: string, walletType?: string) => {
    setConnecting(walletType || type);
    try {
      await onConnect(type, walletType);
    } catch (err) {
      console.error("Connection failed", err);
    } finally {
      setConnecting(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">Connect Wallet</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button 
            disabled={!!connecting}
            onClick={() => handleConnect('evm', 'metamask')}
            className="flex flex-col items-center justify-center p-6 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 rounded-2xl transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500 mb-3">
              <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Logo.svg" alt="MetaMask" className="w-8 h-8" />
            </div>
            <span className="font-bold text-white text-sm">
              {connecting === 'metamask' ? 'Connecting...' : 'MetaMask'}
            </span>
          </button>

          <button 
            disabled={!!connecting}
            onClick={() => handleConnect('solana')}
            className="flex flex-col items-center justify-center p-6 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 rounded-2xl transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400 mb-3">
              <img src="https://phantom.app/img/logo.png" alt="Phantom" className="w-8 h-8" />
            </div>
            <span className="font-bold text-white text-sm">
              {connecting === 'solana' ? 'Connecting...' : 'Phantom'}
            </span>
          </button>
        </div>
        <div className="p-6 bg-zinc-950/50 text-center space-y-2">
          <p className="text-xs text-zinc-500">Make sure your wallet extension is unlocked.</p>
          <p className="text-[10px] text-zinc-600">Note: If connection fails, try opening the app in a new tab.</p>
        </div>
      </motion.div>
    </div>
  );
};

const CoinRow = ({ coin, isWatchlisted, onToggleWatchlist }: { coin: CoinData, isWatchlisted: boolean, onToggleWatchlist: (id: string) => void, key?: any }) => (
  <div className="grid grid-cols-4 md:grid-cols-7 items-center p-4 border-b border-zinc-800/50 hover:bg-zinc-900/30 transition-colors group">
    <div className="flex items-center gap-4 col-span-2">
      <button 
        onClick={() => onToggleWatchlist(coin.id)}
        className={`transition-colors ${isWatchlisted ? 'text-yellow-500' : 'text-zinc-600 group-hover:text-zinc-400'}`}
      >
        <Star size={18} fill={isWatchlisted ? 'currentColor' : 'none'} />
      </button>
      <span className="text-zinc-500 text-sm font-mono w-6">{coin.market_cap_rank}</span>
      <img src={coin.image} alt={coin.name} className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
      <div className="flex flex-col">
        <span className="text-white font-medium">{coin.name}</span>
        <span className="text-zinc-500 text-xs uppercase">{coin.symbol}</span>
      </div>
    </div>
    <div className="text-right font-mono text-white">
      ${coin.current_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
    </div>
    <div className={`text-right font-mono hidden md:block ${(coin.price_change_percentage_24h ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
      {(coin.price_change_percentage_24h ?? 0) >= 0 ? '+' : ''}{(coin.price_change_percentage_24h ?? 0).toFixed(2)}%
    </div>
    <div className="text-right font-mono text-zinc-400 hidden md:block">
      ${((coin.market_cap ?? 0) / 1e9).toFixed(2)}B
    </div>
    <div className="text-right font-mono text-zinc-500 hidden md:block text-xs">
      ${((coin.total_volume ?? 0) / 1e6).toFixed(1)}M
    </div>
    <div className="flex justify-end">
      <div className="w-24 h-10">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={coin.sparkline_in_7d?.price.map((p, i) => ({ p, i })) || []}>
            <YAxis hide domain={['auto', 'auto']} />
            <Line 
              type="monotone" 
              dataKey="p" 
              stroke={coin.price_change_percentage_24h >= 0 ? '#10b981' : '#fb7185'} 
              strokeWidth={2} 
              dot={false} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
);

const ChatWindow = ({ currentUser, targetUser, onClose }: any) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const chatId = [currentUser.uid, targetUser.uid].sort().join('_');

  useEffect(() => {
    const q = query(
      collection(db, 'messages'),
      where('chatId', '==', chatId),
      orderBy('timestamp', 'asc'),
      limit(50)
    );
    return onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, [chatId]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    await addDoc(collection(db, 'messages'), {
      senderId: currentUser.uid,
      receiverId: targetUser.uid,
      text: inputText,
      timestamp: serverTimestamp(),
      chatId
    });
    setInputText('');
  };

  return (
    <div className="fixed bottom-4 right-4 w-80 h-96 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl flex flex-col z-[100]">
      <div className="p-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-950 rounded-t-xl">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-white">{targetUser.displayName}</span>
        </div>
        <button onClick={onClose} className="text-zinc-500 hover:text-white">×</button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.senderId === currentUser.uid ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-2 rounded-lg text-sm ${
              msg.senderId === currentUser.uid ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-200'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={sendMessage} className="p-3 border-t border-zinc-800 flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-zinc-800 border-none rounded-lg px-3 py-1.5 text-sm text-white focus:ring-1 focus:ring-emerald-500"
        />
        <button type="submit" className="text-emerald-500 hover:text-emerald-400">
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('market');
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [otherUsers, setOtherUsers] = useState<any[]>([]);
  const [activeChatUser, setActiveChatUser] = useState<any>(null);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [marketFilter, setMarketFilter] = useState<'all' | 'top100' | 'gainers' | 'losers'>('all');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const docRef = doc(db, 'users', u.uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setProfile(snap.data());
        } else {
          const newProfile = { uid: u.uid, displayName: u.displayName, photoURL: u.photoURL, lastActive: new Date().toISOString() };
          await setDoc(docRef, newProfile);
          setProfile(newProfile);
        }

        // Fetch watchlist
        const watchRef = doc(db, 'watchlists', u.uid);
        const watchSnap = await getDoc(watchRef);
        if (watchSnap.exists()) {
          setWatchlist(watchSnap.data().coinIds);
        }

        // Fetch other users for matching
        const q = query(collection(db, 'users'), limit(50));
        onSnapshot(q, (snapshot) => {
          setOtherUsers(snapshot.docs.map(d => d.data()).filter(d => d.uid !== u.uid));
        });
      } else {
        setProfile(null);
        setWatchlist([]);
        // Automatically sign in as guest if not logged in
        signInAsGuest().catch(err => console.error("Guest login failed", err));
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const loadData = async () => {
      const data = await fetchTopCoins();
      setCoins(data);
      setLastUpdated(new Date());
    };
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const toggleWatchlist = async (coinId: string) => {
    if (!user && !profile?.evmAddress && !profile?.solanaAddress) {
      return alert('İzleme listesi oluşturmak için cüzdan bağlamalı veya giriş yapmalısın.');
    }
    
    const newWatchlist = watchlist.includes(coinId) 
      ? watchlist.filter(id => id !== coinId) 
      : [...watchlist, coinId];
    setWatchlist(newWatchlist);
    
    // Save to Firestore if we have a real user ID, otherwise it stays in local state for the session
    if (user && !user.isAnonymous) {
      await setDoc(doc(db, 'watchlists', user.uid), { userId: user.uid, coinIds: newWatchlist });
    }
  };

  const handleConnectWallet = async (type: 'evm' | 'solana', walletType?: 'metamask' | 'coinbase') => {
    console.log(`handleConnectWallet called with type: ${type}, walletType: ${walletType}`);
    
    let address: string | null = null;
    
    try {
      if (type === 'evm') {
        address = await connectEVM(walletType);
      } else if (type === 'solana') {
        address = await connectSolana();
      }

      console.log(`Connection result address: ${address}`);

      if (address) {
        const { summary, details } = await analyzePortfolio(address, type);
        const updatedProfile = { 
          ...profile, 
          [type === 'evm' ? 'evmAddress' : 'solanaAddress']: address,
          portfolioSummary: summary,
          portfolioDetails: details,
          uid: user?.uid || 'guest'
        };

        // Try to save to Firestore if user is logged in, otherwise just update local state
        if (user && !user.isAnonymous) {
          console.log("Updating profile in Firestore...");
          try {
            await setDoc(doc(db, 'users', user.uid), updatedProfile);
          } catch (fsErr) {
            console.error("Firestore update failed, continuing with local state:", fsErr);
          }
        } else {
          console.log("User is guest or not logged in, updating local state only");
        }

        setProfile(updatedProfile);
        setIsWalletModalOpen(false);
        console.log("Wallet connected successfully");
      }
    } catch (err: any) {
      console.error("Error in handleConnectWallet:", err);
      alert(`Bağlantı hatası: ${err.message || 'Bilinmeyen hata'}`);
    }
  };

  const filteredCoins = useMemo(() => {
    let result = coins.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (marketFilter === 'top100') {
      result = result.filter(c => c.market_cap_rank <= 100);
    } else if (marketFilter === 'gainers') {
      result = result.sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h);
    } else if (marketFilter === 'losers') {
      result = result.sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h);
    } else {
      result = result.sort((a, b) => (a.market_cap_rank || 999) - (b.market_cap_rank || 999));
    }

    return result;
  }, [coins, searchQuery, marketFilter]);

  const matchedUsers = useMemo(() => {
    if (!profile?.portfolioSummary) return [];
    return otherUsers
      .map(u => ({
        ...u,
        similarity: u.portfolioSummary ? calculateSimilarity(profile.portfolioSummary, u.portfolioSummary) : 0
      }))
      .filter(u => u.similarity > 0.1)
      .sort((a, b) => b.similarity - a.similarity);
  }, [profile, otherUsers]);

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        console.log('Sign-in popup closed by user or cancelled.');
        return;
      }
      console.error('Login error:', error);
      alert('Login failed: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-emerald-500/30">
      <Navbar 
        user={user} 
        profile={profile}
        onLogout={logout} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenWalletModal={() => setIsWalletModalOpen(true)}
      />

      <main className="pt-24 pb-12 px-6 max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'market' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-4 text-emerald-400">
                    <TrendingUp size={20} />
                    <h3 className="font-bold">Top Gainers</h3>
                  </div>
                  <div className="space-y-4">
                    {getTopGainers(coins).slice(0, 5).map(c => (
                      <div key={c.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img src={c.image} alt="" className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />
                          <span className="text-sm font-medium">{c.name}</span>
                        </div>
                        <span className="text-emerald-400 font-mono">+{(c.price_change_percentage_24h ?? 0).toFixed(2)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-4 text-rose-400">
                    <TrendingDown size={20} />
                    <h3 className="font-bold">Top Losers</h3>
                  </div>
                  <div className="space-y-4">
                    {getTopLosers(coins).slice(0, 5).map(c => (
                      <div key={c.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img src={c.image} alt="" className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />
                          <span className="text-sm font-medium">{c.name}</span>
                        </div>
                        <span className="text-rose-400 font-mono">{(c.price_change_percentage_24h ?? 0).toFixed(2)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Market Table */}
              <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-zinc-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex flex-col gap-1">
                    <h2 className="text-xl font-bold">Cryptocurrency Market</h2>
                    <p className="text-xs text-zinc-500">Last updated: {lastUpdated.toLocaleTimeString()}</p>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex bg-zinc-800 p-1 rounded-xl">
                      {['all', 'top100', 'gainers', 'losers'].map((f) => (
                        <button
                          key={f}
                          onClick={() => setMarketFilter(f as any)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                            marketFilter === f ? 'bg-emerald-500 text-white shadow-lg' : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          {f === 'all' ? 'All' : f === 'top100' ? 'Top 100' : f === 'gainers' ? 'Gainers' : 'Losers'}
                        </button>
                      ))}
                    </div>

                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                      <input 
                        type="text" 
                        placeholder="Search coins..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-zinc-800 border-none rounded-xl pl-10 pr-4 py-2 text-sm w-full sm:w-64 focus:ring-2 focus:ring-emerald-500/50 transition-all"
                      />
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <div className="min-w-[1000px]">
                    <div className="grid grid-cols-4 md:grid-cols-7 p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-800">
                      <div className="col-span-2 pl-12">Name</div>
                      <div className="text-right">Price</div>
                      <div className="text-right hidden md:block">24h %</div>
                      <div className="text-right hidden md:block">Market Cap</div>
                      <div className="text-right hidden md:block">Volume (24h)</div>
                      <div className="text-right">Last 7 Days</div>
                    </div>
                    {filteredCoins.map(coin => (
                      <CoinRow 
                        key={coin.id} 
                        coin={coin} 
                        isWatchlisted={watchlist.includes(coin.id)}
                        onToggleWatchlist={toggleWatchlist}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'watchlist' && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold">Your Watchlist</h2>
              {!user ? (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-12 text-center">
                  <Star size={48} className="mx-auto text-zinc-700 mb-4" />
                  <p className="text-zinc-400">Please sign in to create and view your watchlist.</p>
                </div>
              ) : watchlist.length === 0 ? (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-12 text-center">
                  <Star size={48} className="mx-auto text-zinc-700 mb-4" />
                  <p className="text-zinc-400">Your watchlist is empty. Start tracking coins from the market!</p>
                  <button 
                    onClick={() => setActiveTab('market')}
                    className="mt-6 text-emerald-400 hover:text-emerald-300 font-medium"
                  >
                    Go to Market
                  </button>
                </div>
              ) : (
                <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl overflow-hidden">
                  {coins.filter(c => watchlist.includes(c.id)).map(coin => (
                    <CoinRow 
                      key={coin.id} 
                      coin={coin} 
                      isWatchlisted={true}
                      onToggleWatchlist={toggleWatchlist}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'portfolio' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Portfolio Analysis</h2>
                {!profile?.evmAddress && !profile?.solanaAddress && (
                  <button 
                    onClick={() => setIsWalletModalOpen(true)}
                    className="bg-emerald-500 hover:bg-emerald-400 text-black px-6 py-2 rounded-xl font-bold transition-all flex items-center gap-2"
                  >
                    <Wallet size={18} />
                    Connect Wallet
                  </button>
                )}
              </div>

              {/* Project Genesis Info */}
              <div className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 rounded-3xl p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400">
                    <Code size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Project Genesis</h3>
                    <p className="text-xs text-zinc-400">This project was started by this wallet address with the first contract.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Genesis Contract</p>
                    <div className="flex items-center justify-between gap-2">
                      <code className="text-xs text-emerald-400 truncate">{PROJECT_CONFIG.genesisContract}</code>
                      <a 
                        href={`${PROJECT_CONFIG.network.explorer}${PROJECT_CONFIG.genesisContract}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-500 hover:text-white"
                      >
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>
                  <div className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Genesis Wallet</p>
                    <div className="flex items-center justify-between gap-2">
                      <code className="text-xs text-blue-400 truncate">{PROJECT_CONFIG.genesisWallet}</code>
                      <a 
                        href={`${PROJECT_CONFIG.network.explorer}${PROJECT_CONFIG.genesisWallet}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-500 hover:text-white"
                      >
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {!profile?.evmAddress && !profile?.solanaAddress ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 mb-6">
                      <Wallet size={32} />
                    </div>
                    <h3 className="text-xl font-bold mb-2">EVM Wallet</h3>
                    <p className="text-zinc-400 text-sm mb-6 max-w-xs">Ethereum, Base, Polygon, and other EVM compatible networks.</p>
                    <button 
                      onClick={() => setIsWalletModalOpen(true)}
                      className="text-emerald-400 hover:text-emerald-300 text-sm font-bold"
                    >
                      Connect EVM Wallet
                    </button>
                  </div>

                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400 mb-6">
                      <Wallet size={32} />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Solana Wallet</h3>
                    <p className="text-zinc-400 text-sm mb-6 max-w-xs">Connect your Phantom wallet to analyze your Solana-based assets.</p>
                    <button 
                      onClick={() => setIsWalletModalOpen(true)}
                      className="text-emerald-400 hover:text-emerald-300 text-sm font-bold"
                    >
                      Connect Solana Wallet
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                  <div className="lg:col-span-1 space-y-6">
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6">
                      <h3 className="text-sm font-bold text-zinc-500 uppercase mb-4">Total Balance</h3>
                      <p className="text-3xl font-mono font-bold text-white mb-1">
                        ${profile.portfolioDetails?.totalValueUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-emerald-400 font-medium">+2.4% last 24h</p>
                    </div>

                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6">
                      <h3 className="text-sm font-bold text-zinc-500 uppercase mb-4">Networks</h3>
                      <div className="space-y-4">
                        {Object.entries(profile.portfolioDetails?.networkDistribution || {}).map(([network, percentage]: [string, any]) => (
                          <div key={network}>
                            <div className="flex justify-between text-xs mb-1.5">
                              <span className="text-zinc-400">{network}</span>
                              <span className="text-white font-bold">{percentage}%</span>
                            </div>
                            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-emerald-500/50"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6">
                      <h3 className="text-sm font-bold text-zinc-500 uppercase mb-4">Diversity</h3>
                      <div className="space-y-4">
                        {Object.entries(profile.portfolioDetails?.diversity || {}).map(([category, percentage]: [string, any]) => (
                          <div key={category}>
                            <div className="flex justify-between text-xs mb-1.5">
                              <span className="text-zinc-400 capitalize">{category}</span>
                              <span className="text-white font-bold">{percentage}%</span>
                            </div>
                            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${
                                  category === 'wallet' ? 'bg-emerald-500' :
                                  category === 'staking' ? 'bg-blue-500' : 'bg-purple-500'
                                }`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6">
                      <h3 className="text-sm font-bold text-zinc-500 uppercase mb-4">Connected Wallets</h3>
                      <div className="space-y-3">
                        {profile?.evmAddress && (
                          <div className="p-3 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
                            <p className="text-[10px] font-bold text-zinc-500 uppercase mb-1">EVM</p>
                            <p className="text-[10px] font-mono text-zinc-300 truncate">{profile.evmAddress}</p>
                          </div>
                        )}
                        {profile?.solanaAddress && (
                          <div className="p-3 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
                            <p className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Solana</p>
                            <p className="text-[10px] font-mono text-zinc-300 truncate">{profile.solanaAddress}</p>
                          </div>
                        )}
                        <button 
                          onClick={() => setIsWalletModalOpen(true)}
                          className="w-full py-2 border border-dashed border-zinc-700 rounded-xl text-[10px] text-zinc-500 hover:border-emerald-500 hover:text-emerald-500 transition-all"
                        >
                          + Add Wallet
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-3 space-y-8">
                    {/* Assets Table */}
                    <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl overflow-hidden">
                      <div className="p-6 border-b border-zinc-800">
                        <h3 className="text-lg font-bold">Assets by Network</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="text-[10px] font-bold text-zinc-500 uppercase border-b border-zinc-800/50">
                              <th className="px-6 py-4">Asset</th>
                              <th className="px-6 py-4">Network</th>
                              <th className="px-6 py-4">Category</th>
                              <th className="px-6 py-4 text-right">Balance</th>
                              <th className="px-6 py-4 text-right">Value</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-800/50">
                            {profile.portfolioDetails?.assets.map((asset: TokenAsset, idx: number) => (
                              <tr key={idx} className="hover:bg-zinc-800/30 transition-colors group">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center font-bold text-xs text-white">
                                      {asset.symbol[0]}
                                    </div>
                                    <div>
                                      <p className="text-sm font-bold text-white">{asset.name}</p>
                                      <p className="text-[10px] text-zinc-500 uppercase">{asset.symbol}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                                    asset.network === 'Ethereum' ? 'bg-blue-500/10 text-blue-400' :
                                    asset.network === 'Solana' ? 'bg-purple-500/10 text-purple-400' :
                                    'bg-emerald-500/10 text-emerald-400'
                                  }`}>
                                    {asset.network}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="text-[10px] text-zinc-400 capitalize">{asset.category}</span>
                                </td>
                                <td className="px-6 py-4 text-right font-mono text-sm text-zinc-300">
                                  {asset.balance.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                                </td>
                                <td className="px-6 py-4 text-right font-mono text-sm text-white font-bold">
                                  ${asset.valueUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Staking & LP Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl p-6">
                        <h3 className="text-sm font-bold text-zinc-500 uppercase mb-4 flex items-center gap-2">
                          <TrendingUp size={16} className="text-blue-400" />
                          Staking Positions
                        </h3>
                        <div className="space-y-4">
                          {profile.portfolioDetails?.assets.filter(a => a.category === 'staking').map((asset: TokenAsset, idx: number) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-zinc-800/20 rounded-xl border border-zinc-800/50">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400 font-bold text-[10px]">
                                  S
                                </div>
                                <div>
                                  <p className="text-xs font-bold">{asset.name}</p>
                                  <p className="text-[10px] text-zinc-500">{asset.network}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-xs font-bold">${asset.valueUsd.toLocaleString()}</p>
                                <p className="text-[10px] text-emerald-400">~4.2% APR</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl p-6">
                        <h3 className="text-sm font-bold text-zinc-500 uppercase mb-4 flex items-center gap-2">
                          <Users size={16} className="text-purple-400" />
                          Liquidity Pools
                        </h3>
                        <div className="space-y-4">
                          {profile.portfolioDetails?.assets.filter(a => a.category === 'lp').map((asset: TokenAsset, idx: number) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-zinc-800/20 rounded-xl border border-zinc-800/50">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-400 font-bold text-[10px]">
                                  LP
                                </div>
                                <div>
                                  <p className="text-xs font-bold">{asset.name}</p>
                                  <p className="text-[10px] text-zinc-500">{asset.network}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-xs font-bold">${asset.valueUsd.toLocaleString()}</p>
                                <p className="text-[10px] text-emerald-400">Yielding</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'social' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Portfolio Matching</h2>
                <div className="text-xs text-zinc-500 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
                  {matchedUsers.length} matches found
                </div>
              </div>

              {!profile?.portfolioSummary ? (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-12 text-center">
                  <Users size={48} className="mx-auto text-zinc-700 mb-4" />
                  <p className="text-zinc-400">Connect your wallet to find users with similar portfolios!</p>
                  <button 
                    onClick={() => setActiveTab('portfolio')}
                    className="mt-6 bg-emerald-500 text-black px-6 py-2 rounded-xl font-bold"
                  >
                    Connect Wallet
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {matchedUsers.map((u) => (
                    <div key={u.uid} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 hover:border-emerald-500/50 transition-all group">
                      <div className="flex items-center gap-4 mb-6">
                        <img src={u.photoURL} alt="" className="w-12 h-12 rounded-full border-2 border-zinc-800" referrerPolicy="no-referrer" />
                        <div>
                          <h4 className="font-bold text-white">{u.displayName}</h4>
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full" />
                            <span className="text-xs text-zinc-500">Online</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-zinc-500">Portfolio Similarity</span>
                          <span className="text-emerald-400 font-bold">{((u.similarity ?? 0) * 100).toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-emerald-500 h-full transition-all duration-1000" 
                            style={{ width: `${u.similarity * 100}%` }}
                          />
                        </div>
                        
                        <div className="flex flex-wrap gap-2 pt-2">
                          {Object.keys(u.portfolioSummary || {}).slice(0, 3).map(sym => (
                            <span key={sym} className="text-[10px] font-bold bg-zinc-800 text-zinc-400 px-2 py-1 rounded-md uppercase">
                              {sym}
                            </span>
                          ))}
                        </div>

                        <button 
                          onClick={() => setActiveChatUser(u)}
                          className="w-full mt-4 flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white py-2 rounded-xl text-sm font-bold transition-colors"
                        >
                          <MessageSquare size={16} />
                          Message
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {activeChatUser && (
        <ChatWindow 
          currentUser={user} 
          targetUser={activeChatUser} 
          onClose={() => setActiveChatUser(null)} 
        />
      )}

      <ConnectWalletModal 
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        onConnect={handleConnectWallet}
      />
    </div>
  );
}

