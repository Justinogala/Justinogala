import React, { useEffect, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';
import SearchResultsDropdown from '@/components/search/SearchResultsDropdown';

const MobileSearchOverlay = () => {
  const [open, setOpen] = React.useState(false);
  const inputRef = useRef(null);
  const { query, results, loading, isOpen, setIsOpen, handleSearchChange, clearSearch, recentSearches, addToHistory, clearHistory } = useGlobalSearch();

  // Listen for 'open-search' event from sidebar
  useEffect(() => {
    const handler = () => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 100); };
    window.addEventListener('open-search', handler);
    // Also listen for Ctrl/Cmd+K on mobile
    const kbHandler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        handler();
      }
      if (e.key === 'Escape' && open) {
        setOpen(false);
        clearSearch();
      }
    };
    document.addEventListener('keydown', kbHandler);
    return () => {
      window.removeEventListener('open-search', handler);
      document.removeEventListener('keydown', kbHandler);
    };
  }, [open, clearSearch]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm md:hidden" onClick={() => { setOpen(false); clearSearch(); }}>
      <div className="bg-white dark:bg-slate-900 w-full max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-top-4 duration-200" onClick={e => e.stopPropagation()}>
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleSearchChange}
            onFocus={() => setIsOpen(true)}
            placeholder="Search everything..."
            className="flex-1 bg-transparent text-base outline-none text-gray-900 dark:text-white placeholder:text-gray-400"
            data-testid="mobile-search-input"
            autoFocus
          />
          {loading ? (
            <Loader2 className="w-5 h-5 text-violet-500 animate-spin flex-shrink-0" />
          ) : (
            <button onClick={() => { setOpen(false); clearSearch(); }} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          )}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto relative">
          {(query || recentSearches.length > 0) && (
            <SearchResultsDropdown
              results={results}
              recentSearches={recentSearches}
              query={query}
              onClose={() => { setOpen(false); clearSearch(); }}
              onSelectHistory={(term) => handleSearchChange(term)}
              onClearHistory={clearHistory}
              onAddToHistory={addToHistory}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileSearchOverlay;
