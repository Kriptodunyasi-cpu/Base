import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Upload, X, Plus, Minus, Globe, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { recipeService } from '../services/recipeService';
import { Category, MediaType, Recipe } from '../types';
import { motion, AnimatePresence } from 'motion/react';

export default function RecipeUpload() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!editId);
  const [media, setMedia] = useState<{ file?: File; preview: string; type: MediaType } | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('food');
  const [country, setCountry] = useState('');
  const [ingredients, setIngredients] = useState<string[]>(['']);
  const [steps, setSteps] = useState<string[]>(['']);

  useEffect(() => {
    if (editId) {
      const fetchRecipe = async () => {
        try {
          const recipe = await recipeService.getRecipeById(editId);
          if (recipe) {
            if (user && recipe.authorId !== user.uid) {
              navigate('/profile');
              return;
            }
            setTitle(recipe.title);
            setDescription(recipe.description);
            setCategory(recipe.category);
            setCountry(recipe.country || '');
            setIngredients(recipe.ingredients.length > 0 ? recipe.ingredients : ['']);
            setSteps(recipe.steps.length > 0 ? recipe.steps : ['']);
            setMedia({ preview: recipe.mediaUrl, type: recipe.mediaType });
          }
        } catch (error) {
          console.error('Error fetching recipe for edit:', error);
        } finally {
          setInitialLoading(false);
        }
      };
      fetchRecipe();
    }
  }, [editId, user, navigate]);

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const preview = URL.createObjectURL(file);
      const type: MediaType = file.type.startsWith('video/') ? 'video' : 'image';
      setMedia({ file, preview, type });
    }
  };

  const addIngredient = () => setIngredients([...ingredients, '']);
  const removeIngredient = (index: number) => setIngredients(ingredients.filter((_, i) => i !== index));
  const updateIngredient = (index: number, value: string) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = value;
    setIngredients(newIngredients);
  };

  const addStep = () => setSteps([...steps, '']);
  const removeStep = (index: number) => setSteps(steps.filter((_, i) => i !== index));
  const updateStep = (index: number, value: string) => {
    const newSteps = [...steps];
    newSteps[index] = value;
    setSteps(newSteps);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || !media) return;

    setLoading(true);
    try {
      let mediaUrl = media.preview;
      let mediaType = media.type;

      if (media.file) {
        const upload = await recipeService.uploadMedia(media.file, user.uid);
        mediaUrl = upload.url;
        mediaType = upload.type;
      }

      const recipeData = {
        authorId: user.uid,
        authorName: profile.displayName,
        title,
        description,
        category,
        country,
        ingredients: ingredients.filter(i => i.trim() !== ''),
        steps: steps.filter(s => s.trim() !== ''),
        mediaUrl,
        mediaType
      };

      if (editId) {
        await recipeService.updateRecipe(editId, recipeData);
      } else {
        await recipeService.createRecipe(recipeData);
      }
      
      navigate('/profile');
    } catch (error) {
      console.error('Operation failed:', error);
      alert('Failed to save recipe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-orange-500" size={40} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center text-orange-500 mb-6">
          <Upload size={40} />
        </div>
        <h2 className="text-2xl font-bold text-stone-900 mb-2">Sign in to share your recipes</h2>
        <p className="text-stone-500 max-w-md">Join the Bite Chain community and share your local food culture with the world.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[40px] shadow-2xl shadow-stone-200/50 border border-stone-100 overflow-hidden"
      >
        <div className="p-8 md:p-12">
          <h1 className="text-3xl font-bold text-stone-900 mb-8">
            {editId ? 'Edit Your Recipe' : 'Share Your Recipe'}
          </h1>
          
          <form onSubmit={handleSubmit} className="space-y-10">
            {/* Media Upload Section */}
            <div className="space-y-4">
              <label className="block text-sm font-bold text-stone-700 uppercase tracking-wider">
                Photo or Video
              </label>
              <div className="relative aspect-video rounded-3xl overflow-hidden bg-stone-50 border-2 border-dashed border-stone-200 hover:border-orange-300 transition-colors group">
                {media ? (
                  <div className="relative w-full h-full">
                    {media.type === 'video' ? (
                      <video src={media.preview} className="w-full h-full object-cover" controls />
                    ) : (
                      <img src={media.preview} className="w-full h-full object-cover" alt="Preview" />
                    )}
                    <button
                      type="button"
                      onClick={() => setMedia(null)}
                      className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                    <div className="p-4 bg-white rounded-2xl shadow-sm mb-4 group-hover:scale-110 transition-transform">
                      <Upload className="text-orange-500" size={32} />
                    </div>
                    <span className="text-sm font-medium text-stone-600">Click to upload image or video</span>
                    <span className="text-xs text-stone-400 mt-1">MP4, JPG, PNG up to 50MB</span>
                    <input type="file" className="hidden" accept="image/*,video/*" onChange={handleMediaChange} />
                  </label>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="block text-sm font-bold text-stone-700 uppercase tracking-wider">Title</label>
                <input
                  required
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Örn: Geleneksel Türk Tutmaç Çorbası"
                  className="w-full px-6 py-4 bg-stone-50 border-none focus:ring-2 focus:ring-orange-500 rounded-2xl text-stone-900 placeholder:text-stone-400"
                />
              </div>
              <div className="space-y-4">
                <label className="block text-sm font-bold text-stone-700 uppercase tracking-wider">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Category)}
                  className="w-full px-6 py-4 bg-stone-50 border-none focus:ring-2 focus:ring-orange-500 rounded-2xl text-stone-900"
                >
                  <option value="food">Main Dish</option>
                  <option value="dessert">Dessert</option>
                  <option value="drink">Drink</option>
                  <option value="salad">Salad</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-bold text-stone-700 uppercase tracking-wider">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Bu yemeğin hikayesini anlatın..."
                rows={4}
                className="w-full px-6 py-4 bg-stone-50 border-none focus:ring-2 focus:ring-orange-500 rounded-2xl text-stone-900 placeholder:text-stone-400 resize-none"
              />
            </div>

            <div className="space-y-4">
              <label className="flex items-center space-x-2 text-sm font-bold text-stone-700 uppercase tracking-wider">
                <Globe size={16} />
                <span>Country of Origin</span>
              </label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Örn: Türkiye"
                className="w-full px-6 py-4 bg-stone-50 border-none focus:ring-2 focus:ring-orange-500 rounded-2xl text-stone-900 placeholder:text-stone-400"
              />
            </div>

            {/* Ingredients Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-bold text-stone-700 uppercase tracking-wider">Ingredients</label>
                <button
                  type="button"
                  onClick={addIngredient}
                  className="p-2 bg-orange-50 text-orange-600 rounded-full hover:bg-orange-100 transition-colors"
                >
                  <Plus size={18} />
                </button>
              </div>
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {ingredients.map((ingredient, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-center space-x-3"
                    >
                      <input
                        type="text"
                        value={ingredient}
                        onChange={(e) => updateIngredient(index, e.target.value)}
                        placeholder={`Ingredient ${index + 1}`}
                        className="flex-1 px-6 py-3 bg-stone-50 border-none focus:ring-2 focus:ring-orange-500 rounded-xl text-stone-900 placeholder:text-stone-400"
                      />
                      {ingredients.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeIngredient(index)}
                          className="p-3 text-stone-400 hover:text-red-500 transition-colors"
                        >
                          <Minus size={18} />
                        </button>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Steps Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-bold text-stone-700 uppercase tracking-wider">Preparation Steps</label>
                <button
                  type="button"
                  onClick={addStep}
                  className="p-2 bg-orange-50 text-orange-600 rounded-full hover:bg-orange-100 transition-colors"
                >
                  <Plus size={18} />
                </button>
              </div>
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {steps.map((step, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-start space-x-4"
                    >
                      <div className="w-8 h-8 bg-stone-100 rounded-full flex items-center justify-center text-xs font-bold text-stone-500 mt-2 shrink-0">
                        {index + 1}
                      </div>
                      <textarea
                        value={step}
                        onChange={(e) => updateStep(index, e.target.value)}
                        placeholder={`Step ${index + 1}`}
                        rows={2}
                        className="flex-1 px-6 py-3 bg-stone-50 border-none focus:ring-2 focus:ring-orange-500 rounded-xl text-stone-900 placeholder:text-stone-400 resize-none"
                      />
                      {steps.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeStep(index)}
                          className="p-3 text-stone-400 hover:text-red-500 transition-colors mt-1"
                        >
                          <Minus size={18} />
                        </button>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            <button
              disabled={loading || !media || !title}
              className={`
                w-full py-5 rounded-3xl text-lg font-bold transition-all shadow-xl
                ${loading || !media || !title
                  ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                  : 'bg-orange-500 text-white hover:bg-orange-600 shadow-orange-200 active:scale-[0.98]'
                }
              `}
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="animate-spin" />
                  <span>{editId ? 'Updating...' : 'Sharing...'}</span>
                </div>
              ) : (
                editId ? 'Update Recipe' : 'Share with the World'
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
