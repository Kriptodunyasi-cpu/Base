import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Heart, MessageCircle, DollarSign, Globe, Share2, ArrowLeft, Send, Clock, User, Wallet, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useWallet } from '../hooks/useWallet';
import { recipeService } from '../services/recipeService';
import { Recipe, Comment } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import { ethers } from 'ethers';

export default function RecipeDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const { address, connectWallet } = useWallet();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [isDonating, setIsDonating] = useState(false);
  const [donationAmount, setDonationAmount] = useState(0.001); // ETH amount for demo

  useEffect(() => {
    if (!id) return;

    const fetchRecipe = async () => {
      const data = await recipeService.getRecipeById(id);
      setRecipe(data);
      setLoading(false);
    };

    fetchRecipe();
    const unsubscribe = recipeService.subscribeToComments(id, setComments);
    return () => unsubscribe();
  }, [id]);

  const handleLike = async () => {
    if (!user || !id) return;
    await recipeService.likeRecipe(id, user.uid);
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || !id || !newComment.trim()) return;
    await recipeService.addComment(id, user.uid, profile.displayName, newComment);
    setNewComment('');
  };

  const handleDonation = async () => {
    if (!address) {
      await connectWallet();
      return;
    }
    if (!user || !recipe || !id) return;

    setIsDonating(true);
    try {
      // For demo, we simulate a transaction or use a real one if on a testnet
      // In a real app, you'd use ethers to send a transaction
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      
      // This is a real transaction call (will prompt MetaMask)
      // We use a small amount of ETH for the demo
      const tx = await signer.sendTransaction({
        to: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e", // Demo address or recipe author's address
        value: ethers.utils.parseEther(donationAmount.toString())
      });

      await recipeService.sendDonation(id, user.uid, recipe.authorId, donationAmount * 1000); // Scale for internal tokens
      alert(`Successfully sent ${donationAmount} ETH! Transaction: ${tx.hash}`);
    } catch (error: any) {
      console.error('Donation failed:', error);
      alert('Donation failed: ' + (error.message || 'Unknown error'));
    } finally {
      setIsDonating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-stone-900">Recipe not found</h2>
        <Link to="/" className="text-orange-500 mt-4 inline-block hover:underline">Back to home</Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <Link to="/" className="inline-flex items-center space-x-2 text-stone-500 hover:text-stone-900 mb-8 transition-colors group">
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        <span className="font-medium">Back to explore</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: Media and Info */}
        <div className="lg:col-span-7 space-y-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-[40px] overflow-hidden shadow-2xl shadow-stone-200/50 border border-stone-100 bg-white"
          >
            {recipe.mediaType === 'video' ? (
              <video src={recipe.mediaUrl} className="w-full aspect-video object-cover" controls autoPlay loop />
            ) : (
              <img src={recipe.mediaUrl} className="w-full aspect-video object-cover" alt={recipe.title} referrerPolicy="no-referrer" />
            )}
          </motion.div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <img
                  src={`https://picsum.photos/seed/${recipe.authorId}/100/100`}
                  alt={recipe.authorName}
                  className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h3 className="font-bold text-stone-900">{recipe.authorName}</h3>
                  <p className="text-xs text-stone-500">
                    Shared {formatDistanceToNow(recipe.createdAt.toDate(), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button onClick={handleLike} className="flex items-center space-x-2 px-4 py-2 bg-stone-100 rounded-full text-stone-600 hover:bg-red-50 hover:text-red-500 transition-all">
                  <Heart size={20} className={recipe.likesCount > 0 ? 'fill-red-500 text-red-500' : ''} />
                  <span className="font-bold">{recipe.likesCount}</span>
                </button>
                <button className="p-2 bg-stone-100 rounded-full text-stone-600 hover:bg-stone-200 transition-colors">
                  <Share2 size={20} />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <span className="px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-xs font-bold uppercase tracking-wider">
                  {recipe.category}
                </span>
                {recipe.country && (
                  <div className="flex items-center space-x-1 text-stone-500 text-sm font-medium">
                    <Globe size={16} />
                    <span>{recipe.country}</span>
                  </div>
                )}
              </div>
              <h1 className="text-4xl font-black text-stone-900 leading-tight">{recipe.title}</h1>
              <p className="text-lg text-stone-600 leading-relaxed">{recipe.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
              <div className="bg-stone-50 rounded-3xl p-8">
                <h4 className="text-sm font-bold text-stone-400 uppercase tracking-widest mb-6">Ingredients</h4>
                <ul className="space-y-4">
                  {recipe.ingredients.map((ing, i) => (
                    <li key={i} className="flex items-center space-x-3 text-stone-700">
                      <div className="w-2 h-2 bg-orange-500 rounded-full" />
                      <span className="font-medium">{ing}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-orange-50 rounded-3xl p-8">
                <h4 className="text-sm font-bold text-orange-400 uppercase tracking-widest mb-6">Instructions</h4>
                <div className="space-y-6">
                  {recipe.steps.map((step, i) => (
                    <div key={i} className="flex space-x-4">
                      <span className="text-2xl font-black text-orange-200 leading-none">{i + 1}</span>
                      <p className="text-stone-700 font-medium leading-relaxed">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interaction and Comments */}
        <div className="lg:col-span-5 space-y-8">
          {/* Donation Card */}
          <div className="bg-stone-900 rounded-[40px] p-8 text-white shadow-2xl shadow-stone-900/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            <h3 className="text-xl font-bold mb-2">Support the Creator</h3>
            <p className="text-stone-400 text-sm mb-6">If you loved this recipe, send a small tip to help the author share more!</p>
            
            <div className="flex items-center space-x-3 mb-6">
              {[0.001, 0.005, 0.01, 0.05].map(amount => (
                <button
                  key={amount}
                  onClick={() => setDonationAmount(amount)}
                  className={`flex-1 py-3 rounded-2xl font-bold transition-all ${donationAmount === amount ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/50' : 'bg-stone-800 text-stone-400 hover:bg-stone-700'}`}
                >
                  {amount}
                </button>
              ))}
            </div>

            <button
              onClick={handleDonation}
              disabled={isDonating}
              className="w-full py-4 bg-white text-stone-900 rounded-2xl font-bold hover:bg-orange-500 hover:text-white transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isDonating ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Wallet size={20} />
                  <span>{address ? `Send ${donationAmount} ETH` : 'Connect Wallet to Tip'}</span>
                </>
              )}
            </button>
          </div>

          {/* Comments Section */}
          <div className="bg-white rounded-[40px] border border-stone-100 shadow-xl shadow-stone-200/50 flex flex-col h-[600px]">
            <div className="p-8 border-b border-stone-50">
              <h3 className="text-xl font-bold text-stone-900 flex items-center space-x-2">
                <MessageCircle size={24} className="text-orange-500" />
                <span>Comments</span>
                <span className="text-stone-300 text-sm font-medium">({recipe.commentsCount})</span>
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar">
              <AnimatePresence mode="popLayout">
                {comments.map((comment) => (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex space-x-3"
                  >
                    <img
                      src={`https://picsum.photos/seed/${comment.userId}/100/100`}
                      alt={comment.userName}
                      className="w-8 h-8 rounded-full object-cover shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 bg-stone-50 rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold text-stone-900">{comment.userName}</span>
                        <span className="text-[10px] text-stone-400">
                          {formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-stone-600 leading-relaxed">{comment.text}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className="p-6 border-t border-stone-50">
              {user ? (
                <form onSubmit={handleComment} className="relative">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="w-full pl-6 pr-14 py-4 bg-stone-100 border-transparent focus:bg-white focus:ring-2 focus:ring-orange-500 rounded-2xl text-sm transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!newComment.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-orange-500 text-white rounded-xl disabled:opacity-50 disabled:bg-stone-300 transition-all"
                  >
                    <Send size={18} />
                  </button>
                </form>
              ) : (
                <p className="text-center text-sm text-stone-400 py-2">Sign in to join the conversation</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
