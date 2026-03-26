import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, DollarSign, Globe, Play, Trash2, Edit3 } from 'lucide-react';
import { Recipe } from '../types';
import { motion } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';

interface RecipeCardProps {
  recipe: Recipe;
  onLike?: () => void;
  onDelete?: (id: string) => void;
  isOwner?: boolean;
}

export default function RecipeCard({ recipe, onLike, onDelete, isOwner }: RecipeCardProps) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="group bg-white rounded-3xl overflow-hidden border border-stone-100 shadow-sm hover:shadow-xl transition-all duration-300"
    >
      <Link to={`/recipe/${recipe.id}`} className="block relative aspect-[4/5] overflow-hidden">
        {recipe.mediaType === 'video' ? (
          <div className="relative w-full h-full">
            <video
              src={recipe.mediaUrl}
              className="w-full h-full object-cover"
              muted
              loop
              playsInline
              onMouseOver={(e) => e.currentTarget.play()}
              onMouseOut={(e) => {
                e.currentTarget.pause();
                e.currentTarget.currentTime = 0;
              }}
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
              <div className="w-12 h-12 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <Play fill="currentColor" size={24} />
              </div>
            </div>
          </div>
        ) : (
          <img
            src={recipe.mediaUrl}
            alt={recipe.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            referrerPolicy="no-referrer"
          />
        )}
        <div className="absolute top-4 left-4 flex flex-col space-y-2">
          <span className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-wider text-stone-900 shadow-sm">
            {recipe.category}
          </span>
          {isOwner && (
            <div className="flex space-x-1">
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  navigate(`/upload?edit=${recipe.id}`);
                }}
                className="p-1.5 bg-white/90 backdrop-blur-md rounded-full text-stone-600 hover:text-orange-500 shadow-sm transition-colors"
                title="Edit"
              >
                <Edit3 size={12} />
              </button>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  if (confirm('Are you sure you want to delete this recipe?')) {
                    onDelete?.(recipe.id);
                  }
                }}
                className="p-1.5 bg-white/90 backdrop-blur-md rounded-full text-stone-600 hover:text-red-500 shadow-sm transition-colors"
                title="Delete"
              >
                <Trash2 size={12} />
              </button>
            </div>
          )}
        </div>
        {recipe.country && (
          <div className="absolute top-4 right-4">
            <div className="flex items-center space-x-1 px-2 py-1 bg-black/40 backdrop-blur-md rounded-full text-white text-[10px] font-medium">
              <Globe size={10} />
              <span>{recipe.country}</span>
            </div>
          </div>
        )}
      </Link>

      <div className="p-5">
        <div className="flex items-center space-x-2 mb-3">
          <img
            src={`https://picsum.photos/seed/${recipe.authorId}/100/100`}
            alt={recipe.authorName}
            className="w-6 h-6 rounded-full object-cover border border-stone-100"
            referrerPolicy="no-referrer"
          />
          <span className="text-xs font-medium text-stone-500">{recipe.authorName}</span>
          <span className="text-[10px] text-stone-300">•</span>
          <span className="text-[10px] text-stone-400">
            {formatDistanceToNow(recipe.createdAt.toDate(), { addSuffix: true })}
          </span>
        </div>

        <Link to={`/recipe/${recipe.id}`}>
          <h3 className="text-lg font-bold text-stone-900 leading-tight mb-2 group-hover:text-orange-600 transition-colors">
            {recipe.title}
          </h3>
        </Link>
        <p className="text-sm text-stone-500 line-clamp-2 mb-4 h-10">
          {recipe.description}
        </p>

        <div className="flex items-center justify-between pt-4 border-t border-stone-50">
          <div className="flex items-center space-x-4">
            <button
              onClick={(e) => {
                e.preventDefault();
                onLike?.();
              }}
              className="flex items-center space-x-1 text-stone-400 hover:text-red-500 transition-colors"
            >
              <Heart size={18} className={recipe.likesCount > 0 ? 'fill-red-500 text-red-500' : ''} />
              <span className="text-xs font-bold">{recipe.likesCount}</span>
            </button>
            <div className="flex items-center space-x-1 text-stone-400">
              <MessageCircle size={18} />
              <span className="text-xs font-bold">{recipe.commentsCount}</span>
            </div>
          </div>
          <button className="p-2 bg-orange-50 text-orange-600 rounded-full hover:bg-orange-600 hover:text-white transition-all duration-300">
            <DollarSign size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
