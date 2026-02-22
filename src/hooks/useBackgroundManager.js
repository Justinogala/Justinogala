
import { useState, useEffect, useCallback } from 'react';
import { PRESET_BACKGROUNDS } from '@/data/BackgroundPresetLibrary';

export const useBackgroundManager = () => {
  const [activeBackground, setActiveBackground] = useState(() => {
    try {
      const saved = localStorage.getItem('echonote_bg_preference');
      return saved ? JSON.parse(saved) : { type: 'none', id: 'none' };
    } catch (e) {
      return { type: 'none', id: 'none' };
    }
  });

  const [customBackgrounds, setCustomBackgrounds] = useState(() => {
    try {
      const saved = localStorage.getItem('echonote_custom_bgs');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [recentBackgrounds, setRecentBackgrounds] = useState([]);

  // Persist active background changes
  useEffect(() => {
    localStorage.setItem('echonote_bg_preference', JSON.stringify(activeBackground));
  }, [activeBackground]);

  // Persist custom backgrounds
  useEffect(() => {
    localStorage.setItem('echonote_custom_bgs', JSON.stringify(customBackgrounds));
  }, [customBackgrounds]);

  const addToRecent = useCallback((bg) => {
    setRecentBackgrounds(prev => {
      const filtered = prev.filter(item => item.id !== bg.id);
      return [bg, ...filtered].slice(0, 5);
    });
  }, []);

  const selectBackground = useCallback((bgId) => {
    let selected = null;

    if (bgId === 'none') {
      selected = { type: 'none', id: 'none' };
    } else {
      // Check presets
      selected = PRESET_BACKGROUNDS.find(bg => bg.id === bgId);
      
      // Check custom
      if (!selected) {
        selected = customBackgrounds.find(bg => bg.id === bgId);
      }
    }

    if (selected) {
      setActiveBackground(selected);
      // Add to recent if not 'none' 
      if (selected.type !== 'none') {
        addToRecent(selected);
      }
    }
  }, [customBackgrounds, addToRecent]);

  const saveBackgroundSelection = useCallback(() => {
    // Explicit save method as requested, though useEffect handles persistence automatically.
    // This can be used to trigger any additional "save" logic if needed in future (e.g. API sync)
    localStorage.setItem('echonote_bg_preference', JSON.stringify(activeBackground));
    return activeBackground;
  }, [activeBackground]);

  const getSelectedBackground = useCallback(() => {
    return activeBackground;
  }, [activeBackground]);

  const uploadCustomBackground = useCallback((file) => {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject('No file provided');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        reject('File too large (max 5MB)');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const newBg = {
          id: `custom-${Date.now()}`,
          name: file.name.split('.')[0],
          category: 'custom',
          type: 'image',
          src: e.target.result,
          description: 'Custom uploaded background'
        };
        setCustomBackgrounds(prev => [newBg, ...prev]);
        selectBackground(newBg.id); // Auto-select uploaded background
        resolve(newBg);
      };
      reader.onerror = () => reject('Failed to read file');
      reader.readAsDataURL(file);
    });
  }, [selectBackground]);

  const removeCustomBackground = useCallback((id) => {
    setCustomBackgrounds(prev => prev.filter(bg => bg.id !== id));
    if (activeBackground.id === id) {
      selectBackground('none');
    }
  }, [activeBackground.id, selectBackground]);

  return {
    activeBackground,
    customBackgrounds,
    recentBackgrounds,
    selectBackground,
    saveBackgroundSelection,
    getSelectedBackground,
    uploadCustomBackground,
    removeCustomBackground
  };
};
