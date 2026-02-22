
import { useState, useEffect, useCallback, useRef } from 'react';
import { GlobalSearchService } from '@/services/GlobalSearchService';
import { useAuth } from '@/context/AuthContext';

export const useGlobalSearch = () => {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ meetings: [], transcriptions: [] });
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const debounceRef = useRef(null);

  // Load history on mount
  useEffect(() => {
    setRecentSearches(GlobalSearchService.getRecentSearches());
  }, []);

  const performSearch = useCallback(async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults({ meetings: [], transcriptions: [] });
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await GlobalSearchService.search(searchQuery, user?.id);
      setResults(data);
    } catch (error) {
      console.error('Search failed:', error);
      setResults({ meetings: [], transcriptions: [] });
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(true);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (value.trim().length > 0) {
      setLoading(true); // Set loading immediately for better UX
      debounceRef.current = setTimeout(() => {
        performSearch(value);
      }, 300);
    } else {
      setLoading(false);
      setResults({ meetings: [], transcriptions: [] });
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults({ meetings: [], transcriptions: [] });
    setIsOpen(false);
  };

  const addToHistory = (term) => {
    const updated = GlobalSearchService.addRecentSearch(term);
    if (updated) setRecentSearches(updated);
  };

  const clearHistory = () => {
    GlobalSearchService.clearHistory();
    setRecentSearches([]);
  };

  return {
    query,
    results,
    loading,
    isOpen,
    setIsOpen,
    handleSearchChange,
    clearSearch,
    recentSearches,
    addToHistory,
    clearHistory,
    setQuery
  };
};
