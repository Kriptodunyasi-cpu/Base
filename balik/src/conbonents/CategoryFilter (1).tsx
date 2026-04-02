import React from 'react';
import { Category } from '../types';
import { motion } from 'motion/react';

const categories: { id: Category | 'all'; label: string; icon: string }[] = [
  { id: 'all', label: 'All', icon: '🍽️' },
  { id: 'food', label: 'Main Dish', icon: '🥘' },
  { id: 'dessert', label: 'Desserts', icon: '🍰' },
  { id: 'drink', label: 'Drinks', icon: '🍹' },
  { id: 'salad', label: 'Salads', icon: '🥗' },
];

interface CategoryFilterProps {
  activeCategory: Category | 'all';
  onCategoryChange: (category: Category | 'all') => void;
}

export default function CategoryFilter({ activeCategory, onCategoryChange }: CategoryFilterProps) {
  return (
    <div className="flex items-center space-x-2 overflow-x-auto pb-4 no-scrollbar">
      {categories.map((cat) => (
        <motion.button
          key={cat.id}
          whileTap={{ scale: 0.95 }}
          onClick={() => onCategoryChange(cat.id)}
          className={`
            flex items-center space-x-2 px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all
            ${activeCategory === cat.id
              ? 'bg-orange-500 text-white shadow-lg shadow-orange-200'
              : 'bg-white text-stone-600 border border-stone-200 hover:border-orange-200 hover:bg-orange-50/30'
            }
          `}
        >
          <span>{cat.icon}</span>
          <span>{cat.label}</span>
        </motion.button>
      ))}
    </div>
  );
}
