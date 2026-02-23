import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Loader2, Sparkles, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

// GIPHY API configuration - using public beta key for demo
// In production, use your own API key from https://developers.giphy.com/
const GIPHY_API_KEY = 'dc6zaTOxFJmzC'; // Public beta key
const GIPHY_API_BASE = 'https://api.giphy.com/v1/gifs';

const CATEGORIES = ['Trending', 'Reactions', 'Celebrate', 'Thanks', 'Yes', 'No', 'Love', 'Sad', 'Funny', 'OMG'];

const GifPicker = ({ isOpen, onClose, onSelect }) => {
  const [search, setSearch] = useState('');
  const [gifs, setGifs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Trending');
  const [error, setError] = useState(null);

  // Fetch trending GIFs
  const fetchTrending = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${GIPHY_API_BASE}/trending?api_key=${GIPHY_API_KEY}&limit=20&rating=g`
      );
      const data = await response.json();
      if (data.data) {
        setGifs(data.data.map(gif => ({
          id: gif.id,
          url: gif.images.fixed_height.url,
          preview: gif.images.fixed_height_small.url || gif.images.fixed_height.url,
          title: gif.title,
          width: gif.images.fixed_height.width,
          height: gif.images.fixed_height.height
        })));
      }
    } catch (err) {
      console.error('Error fetching trending GIFs:', err);
      setError('Failed to load GIFs');
    } finally {
      setIsLoading(false);
    }
  };

  // Search GIFs
  const searchGifs = async (query) => {
    if (!query.trim()) {
      fetchTrending();
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${GIPHY_API_BASE}/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=20&rating=g`
      );
      const data = await response.json();
      if (data.data) {
        setGifs(data.data.map(gif => ({
          id: gif.id,
          url: gif.images.fixed_height.url,
          preview: gif.images.fixed_height_small.url || gif.images.fixed_height.url,
          title: gif.title,
          width: gif.images.fixed_height.width,
          height: gif.images.fixed_height.height
        })));
      }
    } catch (err) {
      console.error('Error searching GIFs:', err);
      setError('Failed to search GIFs');
    } finally {
      setIsLoading(false);
    }
  };

  // Load trending on mount
  useEffect(() => {
    if (isOpen) {
      fetchTrending();
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!isOpen) return;
    
    const debounce = setTimeout(() => {
      if (search) {
        searchGifs(search);
      } else if (activeCategory === 'Trending') {
        fetchTrending();
      } else {
        searchGifs(activeCategory.toLowerCase());
      }
    }, 300);
    
    return () => clearTimeout(debounce);
  }, [search, isOpen]);

  const handleCategoryClick = (category) => {
    setActiveCategory(category);
    setSearch('');
    if (category === 'Trending') {
      fetchTrending();
    } else {
      searchGifs(category.toLowerCase());
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="absolute bottom-full mb-2 left-0 z-50 w-80 h-[420px] bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-3 border-b border-gray-100 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span className="font-semibold text-sm">GIFs</span>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
            <Input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search GIFs..." 
              className="pl-9 h-9 text-sm bg-gray-50 dark:bg-slate-800"
              data-testid="gif-search-input"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-1 p-2 overflow-x-auto scrollbar-hide border-b border-gray-100 dark:border-slate-800">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => handleCategoryClick(cat)}
              className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap transition-colors flex items-center gap-1 ${
                activeCategory === cat 
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-800 dark:text-gray-400 dark:hover:bg-slate-700'
              }`}
            >
              {cat === 'Trending' && <TrendingUp className="w-3 h-3" />}
              {cat}
            </button>
          ))}
        </div>

        {/* GIF Grid */}
        <ScrollArea className="flex-1 p-2">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-48 text-center px-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">{error}</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={fetchTrending}>
                Try Again
              </Button>
            </div>
          ) : gifs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center px-4">
              <Sparkles className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No GIFs found</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Try a different search term</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {gifs.map((gif) => (
                <motion.button
                  key={gif.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    onSelect(gif);
                    onClose();
                  }}
                  className="aspect-video bg-gray-100 dark:bg-slate-800 rounded-lg overflow-hidden relative group"
                  data-testid={`gif-item-${gif.id}`}
                >
                  <img 
                    src={gif.preview || gif.url} 
                    alt={gif.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                    <span className="text-[10px] text-white font-medium truncate">{gif.title}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="p-2 border-t border-gray-100 dark:border-slate-800 text-center">
          <a 
            href="https://giphy.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[10px] text-gray-400 hover:text-purple-500 transition-colors"
          >
            Powered by GIPHY
          </a>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GifPicker;
