import React from 'react';
import { Link } from 'react-router-dom';
import { Utensils, User, LogIn, LogOut, PlusCircle, Search, Wallet, Globe, Rocket } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useWallet } from '../hooks/useWallet';
import { motion } from 'motion/react';

export default function Navbar() {
  const { user, profile, login, logout } = useAuth();
  const { address, isConnecting, connectWallet } = useWallet();

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <motion.div
              whileHover={{ rotate: 15 }}
              className="p-2 bg-orange-500 rounded-xl text-white"
            >
              <Utensils size={24} />
            </motion.div>
            <span className="text-xl font-bold tracking-tight text-stone-900">Bite Chain</span>
          </Link>

          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
              <input
                type="text"
                placeholder="Search recipes, cultures..."
                className="w-full pl-10 pr-4 py-2 bg-stone-100 border-transparent focus:bg-white focus:ring-2 focus:ring-orange-500 rounded-full text-sm transition-all"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Wallet Button */}
            <button
              onClick={connectWallet}
              disabled={isConnecting}
              className={`
                flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all
                ${address 
                  ? 'bg-orange-50 text-orange-600 border border-orange-100' 
                  : 'bg-stone-900 text-white hover:bg-stone-800'
                }
              `}
            >
              <Wallet size={18} />
              <span>{address ? truncateAddress(address) : (isConnecting ? 'Connecting...' : 'Connect Wallet')}</span>
            </button>

            <Link
              to="/deploy"
              className="flex items-center space-x-1 text-stone-600 hover:text-orange-500 transition-colors"
            >
              <Rocket size={20} />
              <span className="hidden sm:inline text-sm font-medium">Heritage</span>
            </Link>

            <Link
              to="/upload"
              className="flex items-center space-x-1 text-stone-600 hover:text-orange-500 transition-colors"
            >
              <PlusCircle size={20} />
              <span className="hidden sm:inline text-sm font-medium">Share</span>
            </Link>

            <Link
              to="/profile"
              className="flex items-center space-x-1 text-stone-600 hover:text-orange-500 transition-colors"
            >
              <User size={20} />
              <span className="hidden sm:inline text-sm font-medium">Profile</span>
            </Link>

            {user ? (
              <div className="flex items-center space-x-4 border-l border-stone-200 pl-4">
                <Link
                  to="/profile"
                  className="flex items-center space-x-2 p-1 pr-3 rounded-full hover:bg-stone-100 transition-colors"
                >
                  <img
                    src={profile?.photoURL || 'https://picsum.photos/seed/user/100/100'}
                    alt="Profile"
                    className="w-8 h-8 rounded-full object-cover border border-stone-200"
                    referrerPolicy="no-referrer"
                  />
                  <span className="hidden sm:inline text-sm font-medium text-stone-700">
                    {profile?.displayName?.split(' ')[0]}
                  </span>
                </Link>
                <button
                  onClick={logout}
                  className="p-2 text-stone-400 hover:text-red-500 transition-colors"
                  title="Logout"
                >
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <button
                onClick={login}
                className="flex items-center space-x-2 px-4 py-2 bg-stone-900 text-white rounded-full hover:bg-stone-800 transition-colors text-sm font-medium"
              >
                <LogIn size={18} />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
