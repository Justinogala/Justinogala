import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Loader2, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

// Trending GIF categories and sample GIFs (using placeholder URLs for demo)
const TRENDING_GIFS = [
  { id: '1', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcHJxZ2w5aHZ0ZnBqaXR3cWFyd2QyaGJqZ2F0OWRpbWQzMWNrY2JtbiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l0MYt5jPR6QX5pnqM/giphy.gif', title: 'thumbs up' },
  { id: '2', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcHJxZ2w5aHZ0ZnBqaXR3cWFyd2QyaGJqZ2F0OWRpbWQzMWNrY2JtbiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/26u4cqiYI30juCOGY/giphy.gif', title: 'celebration' },
  { id: '3', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcHJxZ2w5aHZ0ZnBqaXR3cWFyd2QyaGJqZ2F0OWRpbWQzMWNrY2JtbiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3oriO0OEd9QIDdllqo/giphy.gif', title: 'thank you' },
  { id: '4', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcHJxZ2w5aHZ0ZnBqaXR3cWFyd2QyaGJqZ2F0OWRpbWQzMWNrY2JtbiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l4q8cJzGdR9J8w3hS/giphy.gif', title: 'clap' },
  { id: '5', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcHJxZ2w5aHZ0ZnBqaXR3cWFyd2QyaGJqZ2F0OWRpbWQzMWNrY2JtbiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7abldj0b3rxrZUxW/giphy.gif', title: 'high five' },
  { id: '6', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcHJxZ2w5aHZ0ZnBqaXR3cWFyd2QyaGJqZ2F0OWRpbWQzMWNrY2JtbiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/xT0xeJpnrWC4XWblEk/giphy.gif', title: 'mind blown' },
];

const CATEGORIES = ['Trending', 'Reactions', 'Celebrate', 'Thanks', 'Yes', 'No', 'Love', 'Sad'];

const GifPicker = ({ isOpen, onClose, onSelect }) => {
  const [search, setSearch] = useState('');
  const [gifs, setGifs] = useState(TRENDING_GIFS);
  const [isLoading, setIsLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Trending');

  // Simulate GIF search (in real app, use GIPHY API)
  const searchGifs = async (query) => {
    setIsLoading(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Filter mock GIFs based on query (in real app, call GIPHY API)
    const filtered = TRENDING_GIFS.filter(gif => 
      gif.title.toLowerCase().includes(query.toLowerCase())
    );
    setGifs(filtered.length > 0 ? filtered : TRENDING_GIFS);
    setIsLoading(false);
  };

  useEffect(() => {
    if (search) {
      const debounce = setTimeout(() => searchGifs(search), 300);
      return () => clearTimeout(debounce);
    } else {
      setGifs(TRENDING_GIFS);
    }
  }, [search]);

  const handleCategoryClick = (category) => {
    setActiveCategory(category);
    setSearch(category === 'Trending' ? '' : category.toLowerCase());
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
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-1 p-2 overflow-x-auto scrollbar-hide border-b border-gray-100 dark:border-slate-800">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => handleCategoryClick(cat)}
              className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                activeCategory === cat 
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-800 dark:text-gray-400 dark:hover:bg-slate-700'
              }`}
            >
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
                >
                  <img 
                    src={gif.url} 
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
          <span className="text-[10px] text-gray-400">Powered by GIPHY</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GifPicker;
