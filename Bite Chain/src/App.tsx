import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import RecipeCard from './components/RecipeCard';
import CategoryFilter from './components/CategoryFilter';
import RecipeUpload from './components/RecipeUpload';
import RecipeDetail from './components/RecipeDetail';
import Profile from './components/Profile';
import ContractDeployer from './components/ContractDeployer';
import { recipeService } from './services/recipeService';
import { Recipe, Category } from './types';
import { useAuth } from './hooks/useAuth';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, TrendingUp, Award, Sparkles, PlusCircle, ArrowRight, Rocket } from 'lucide-react';

function Home() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all');
  const { user } = useAuth();
  const recipesRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = recipeService.subscribeToRecipes((data) => {
      setRecipes(data);
    }, activeCategory === 'all' ? undefined : activeCategory);
    return () => unsubscribe();
  }, [activeCategory]);

  const handleLike = async (recipeId: string) => {
    if (!user) {
      alert('Please sign in to like recipes!');
      return;
    }
    await recipeService.likeRecipe(recipeId, user.uid);
  };

  const scrollToRecipes = () => {
    recipesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToAbout = () => {
    aboutRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <section className="mb-16 relative overflow-hidden rounded-[48px] bg-stone-900 text-white p-12 md:p-20">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-orange-500/20 to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-400 text-xs font-bold uppercase tracking-widest mb-8"
          >
            <Sparkles size={14} />
            <span>The Future of Food Culture</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black leading-tight mb-8"
          >
            Taste the <span className="text-orange-500">World</span> on the Chain.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-stone-400 leading-relaxed mb-10"
          >
            Bite Chain is a global social responsibility project where food meets crypto. 
            Share your national recipes, earn rewards, and support creators worldwide.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-4"
          >
            <button 
              onClick={scrollToRecipes}
              className="px-8 py-4 bg-orange-500 text-white rounded-2xl font-bold hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/20"
            >
              Explore Recipes
            </button>
            <button 
              onClick={() => navigate('/upload')}
              className="px-8 py-4 bg-white text-stone-900 rounded-2xl font-bold hover:bg-stone-100 transition-all flex items-center space-x-2"
            >
              <PlusCircle size={20} />
              <span>Share Recipe</span>
            </button>
            <button 
              onClick={scrollToAbout}
              className="px-8 py-4 bg-white/10 backdrop-blur-md text-white border border-white/10 rounded-2xl font-bold hover:bg-white/20 transition-all"
            >
              Learn More
            </button>
          </motion.div>
        </div>
      </section>

      {/* Stats/Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
        {[
          { icon: Globe, label: 'Global Community', value: '190+ Countries', color: 'text-blue-500' },
          { icon: TrendingUp, label: 'Creator Earnings', value: '500k+ Tokens', color: 'text-green-500' },
          { icon: Award, label: 'Verified Chefs', value: '12k+ Experts', color: 'text-orange-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-[32px] border border-stone-100 shadow-sm flex items-center space-x-6">
            <div className={`p-4 bg-stone-50 rounded-2xl ${stat.color}`}>
              <stat.icon size={32} />
            </div>
            <div>
              <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl font-black text-stone-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Feed */}
      <div ref={recipesRef} className="space-y-10 mb-24">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <h2 className="text-3xl font-black text-stone-900">Discover Flavors</h2>
          <CategoryFilter activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
        </div>

        {recipes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            <AnimatePresence mode="popLayout">
              {recipes.map((recipe) => (
                <RecipeCard 
                  key={recipe.id} 
                  recipe={recipe} 
                  onLike={() => handleLike(recipe.id)} 
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="py-32 text-center bg-stone-50 rounded-[48px] border-2 border-dashed border-stone-200">
            <p className="text-stone-400 font-medium text-lg">No recipes found. Be the first to share one!</p>
          </div>
        )}
      </div>

      {/* About Section */}
      <section ref={aboutRef} className="py-20 border-t border-stone-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl font-black text-stone-900 mb-6">What is Bite Chain?</h2>
            <div className="space-y-6 text-stone-600 leading-relaxed">
              <p>
                Bite Chain is more than just a recipe sharing platform. It's a decentralized ecosystem designed to preserve and celebrate global culinary heritage while empowering creators.
              </p>
              <p>
                Every time you share a recipe, you contribute to a global database of food culture. Our integrated crypto-tipping system allows users to directly support chefs and home cooks who share their secrets.
              </p>
              <div className="flex items-center space-x-4 pt-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map(i => (
                    <img key={i} src={`https://picsum.photos/seed/user${i}/100/100`} className="w-10 h-10 rounded-full border-2 border-white" referrerPolicy="no-referrer" />
                  ))}
                </div>
                <span className="text-sm font-bold text-stone-900">Join 12,000+ creators</span>
              </div>
            </div>
          </div>
          <div className="bg-orange-50 rounded-[40px] p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            <h3 className="text-2xl font-bold text-stone-900 mb-8">How it works</h3>
            <div className="space-y-8">
              {[
                { title: 'Share', desc: 'Upload your recipe with photos or videos.' },
                { title: 'Connect', desc: 'Link your crypto wallet to receive tips.' },
                { title: 'Earn', desc: 'Get rewarded for your culinary contributions.' }
              ].map((step, i) => (
                <div key={i} className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold shrink-0">
                    {i + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-900">{step.title}</h4>
                    <p className="text-sm text-stone-500">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => navigate('/upload')} className="mt-10 w-full py-4 bg-stone-900 text-white rounded-2xl font-bold hover:bg-stone-800 transition-all flex items-center justify-center space-x-2">
              <span>Start Sharing Now</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#FDFCFB]">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/upload" element={<RecipeUpload />} />
            <Route path="/recipe/:id" element={<RecipeDetail />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/deploy" element={<ContractDeployer />} />
          </Routes>
        </main>
        
        {/* Footer */}
        <footer className="bg-stone-900 text-white py-20 mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
              <div className="col-span-1 md:col-span-2">
                <div className="flex items-center space-x-2 mb-6">
                  <div className="p-2 bg-orange-500 rounded-xl text-white">
                    <Globe size={24} />
                  </div>
                  <span className="text-2xl font-black tracking-tight">Bite Chain</span>
                </div>
                <p className="text-stone-400 max-w-sm leading-relaxed">
                  Empowering global food cultures through blockchain technology. 
                  Share, earn, and support social responsibility projects worldwide.
                </p>
              </div>
              <div>
                <h4 className="font-bold mb-6">Platform</h4>
                <ul className="space-y-4 text-stone-400 text-sm">
                  <li><Link to="/" className="hover:text-white transition-colors">Explore</Link></li>
                  <li><Link to="/upload" className="hover:text-white transition-colors">Share Recipe</Link></li>
                  <li><Link to="/profile" className="hover:text-white transition-colors">Profile</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-6">Community</h4>
                <ul className="space-y-4 text-stone-400 text-sm">
                  <li><a href="#" className="hover:text-white transition-colors">Tokenomics</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Governance</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
                </ul>
              </div>
            </div>
            <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-stone-500 text-xs">
              <p>© 2026 Bite Chain. All rights reserved.</p>
              <div className="flex items-center space-x-6">
                <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}
