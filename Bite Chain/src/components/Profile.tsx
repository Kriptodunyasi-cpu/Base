import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { recipeService } from '../services/recipeService';
import { Recipe } from '../types';
import RecipeCard from './RecipeCard';
import { User, Globe, DollarSign, Settings, Grid, Heart, Award, Wallet } from 'lucide-react';
import { motion } from 'motion/react';

export default function Profile() {
  const { user, profile, logout } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [activeTab, setActiveTab] = useState<'my' | 'liked'>('my');

  useEffect(() => {
    if (!user) return;
    const unsubscribe = recipeService.subscribeToRecipes((allRecipes) => {
      if (activeTab === 'my') {
        setRecipes(allRecipes.filter(r => r.authorId === user.uid));
      } else {
        // For demo, just showing some recipes as "liked"
        setRecipes(allRecipes.slice(0, 3));
      }
    });
    return () => unsubscribe();
  }, [user, activeTab]);

  const handleDelete = async (id: string) => {
    try {
      await recipeService.deleteRecipe(id);
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete recipe.');
    }
  };

  if (!user || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h2 className="text-2xl font-bold text-stone-900 mb-2">Please sign in to view your profile</h2>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Header Section */}
      <div className="bg-white rounded-[40px] shadow-xl shadow-stone-200/50 border border-stone-100 overflow-hidden mb-12">
        <div className="h-48 bg-gradient-to-r from-orange-400 to-orange-600 relative">
          <div className="absolute inset-0 bg-black/10" />
        </div>
        <div className="px-8 pb-8 relative">
          <div className="flex flex-col md:flex-row md:items-end -mt-16 md:space-x-8 mb-8">
            <img
              src={profile.photoURL || 'https://picsum.photos/seed/user/200/200'}
              alt={profile.displayName}
              className="w-32 h-32 rounded-[32px] border-4 border-white shadow-xl object-cover bg-white"
              referrerPolicy="no-referrer"
            />
            <div className="flex-1 pt-20 md:pt-0">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-black text-stone-900">{profile.displayName}</h1>
                  <div className="flex items-center space-x-4 mt-2 text-stone-500 font-medium">
                    <div className="flex items-center space-x-1">
                      <Globe size={16} />
                      <span>{profile.country || 'Global Citizen'}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-orange-600">
                      <Award size={16} />
                      <span>Master Chef</span>
                    </div>
                  </div>
                  {profile.walletAddress && (
                    <div className="mt-2 flex items-center space-x-2 bg-stone-100 px-3 py-1 rounded-full w-fit">
                      <Wallet size={14} className="text-stone-500" />
                      <span className="text-xs font-mono text-stone-600">{profile.walletAddress}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  <button className="px-6 py-2.5 bg-stone-900 text-white rounded-2xl font-bold text-sm hover:bg-stone-800 transition-all">
                    Edit Profile
                  </button>
                  <button onClick={logout} className="p-2.5 bg-stone-100 text-stone-600 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all">
                    <Settings size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-stone-50 rounded-3xl p-6 border border-stone-100">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-widest block mb-1">Recipes</span>
              <span className="text-2xl font-black text-stone-900">{recipes.length}</span>
            </div>
            <div className="bg-stone-50 rounded-3xl p-6 border border-stone-100">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-widest block mb-1">Total Likes</span>
              <span className="text-2xl font-black text-stone-900">
                {recipes.reduce((acc, r) => acc + r.likesCount, 0)}
              </span>
            </div>
            <div className="bg-stone-50 rounded-3xl p-6 border border-stone-100">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-widest block mb-1">Followers</span>
              <span className="text-2xl font-black text-stone-900">1.2k</span>
            </div>
            <div className="bg-orange-50 rounded-3xl p-6 border border-orange-100">
              <span className="text-xs font-bold text-orange-400 uppercase tracking-widest block mb-1">Earnings</span>
              <div className="flex items-center space-x-1">
                <DollarSign size={20} className="text-orange-600" />
                <span className="text-2xl font-black text-orange-600">{profile.totalEarnings || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="space-y-8">
        <div className="flex items-center space-x-8 border-b border-stone-200">
          <button
            onClick={() => setActiveTab('my')}
            className={`pb-4 text-sm font-bold transition-all relative ${activeTab === 'my' ? 'text-orange-500' : 'text-stone-400 hover:text-stone-600'}`}
          >
            <div className="flex items-center space-x-2">
              <Grid size={18} />
              <span>My Recipes</span>
            </div>
            {activeTab === 'my' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-orange-500 rounded-full" />}
          </button>
          <button
            onClick={() => setActiveTab('liked')}
            className={`pb-4 text-sm font-bold transition-all relative ${activeTab === 'liked' ? 'text-orange-500' : 'text-stone-400 hover:text-stone-600'}`}
          >
            <div className="flex items-center space-x-2">
              <Heart size={18} />
              <span>Liked Recipes</span>
            </div>
            {activeTab === 'liked' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-orange-500 rounded-full" />}
          </button>
        </div>

        {recipes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {recipes.map(recipe => (
              <RecipeCard 
                key={recipe.id} 
                recipe={recipe} 
                isOwner={recipe.authorId === user.uid}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center bg-stone-50 rounded-[40px] border border-dashed border-stone-200">
            <p className="text-stone-400 font-medium">No recipes found in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
}
