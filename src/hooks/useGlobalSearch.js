
import { useState, useEffect, useCallback, useRef } from 'react';
import { GlobalSearchService } from '@/services/GlobalSearchService';
import { useAuth } from '@/context/AuthContext';

export const useGlobalSearch = () => {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ pages: [], workspaces: [], users: [], forms: [], messages: [] });
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const debounceRef = useRef(null);

  useEffect(() => {
    setRecentSearches(GlobalSearchService.getRecentSearches());
  }, []);

  const performSearch = useCallback(async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults({ pages: [], workspaces: [], users: [], forms: [], messages: [] });
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await GlobalSearchService.search(searchQuery, user?.id);
      setResults(data);
    } catch (error) {
      console.error('Search failed:', error);
      setResults({ pages: [], workspaces: [], users: [], forms: [], messages: [] });
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleSearchChange = (e) => {
    const value = typeof e === 'string' ? e : e.target.value;
    setQuery(value);
    setIsOpen(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length > 0) {
      setLoading(true);
      debounceRef.current = setTimeout(() => {
        performSearch(value);
      }, 250);
    } else {
      setLoading(false);
      setResults({ pages: [], workspaces: [], users: [], forms: [], messages: [] });
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults({ pages: [], workspaces: [], users: [], forms: [], messages: [] });
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
