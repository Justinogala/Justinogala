
export const BACKGROUND_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'blur', label: 'Blur' },
  { id: 'office', label: 'Office' },
  { id: 'nature', label: 'Nature' },
  { id: 'cityscape', label: 'Cityscape' },
  { id: 'solid', label: 'Colors' },
  { id: 'abstract', label: 'Abstract' }
];

export const PRESET_BACKGROUNDS = [
  // Blur Options
  {
    id: 'blur-light',
    name: 'Light Blur',
    category: 'blur',
    type: 'blur',
    intensity: 'light',
    description: 'Slightly blur your surroundings',
    thumbnail: 'https://images.unsplash.com/photo-1496660424560-647d63a8a379?w=300&q=80&blur=20'
  },
  {
    id: 'blur-heavy',
    name: 'Heavy Blur',
    category: 'blur',
    type: 'blur',
    intensity: 'heavy',
    description: 'Completely hide your background',
    thumbnail: 'https://images.unsplash.com/photo-1496660424560-647d63a8a379?w=300&q=80&blur=80'
  },

  // Office
  {
    id: 'office-1',
    name: 'Sunlit Office',
    category: 'office',
    type: 'image',
    src: 'https://images.pexels.com/photos/19165510/pexels-photo-19165510.jpeg?auto=compress&cs=tinysrgb&w=1920&q=80',
    description: 'Empty wooden cubicles in a sunlit office'
  },
  {
    id: 'office-2',
    name: 'Creative Workspace',
    category: 'office',
    type: 'image',
    src: 'https://images.pexels.com/photos/8297846/pexels-photo-8297846.jpeg?auto=compress&cs=tinysrgb&w=1920&q=80',
    description: 'Spacious open office with cityscape view'
  },

  // Nature
  {
    id: 'nature-1',
    name: 'Mountain Valley',
    category: 'nature',
    type: 'image',
    src: 'https://images.unsplash.com/photo-1600257729950-13a634d32697?auto=format&fit=crop&w=1920&q=80',
    description: 'Green mountains under blue sky'
  },
  {
    id: 'nature-2',
    name: 'Alpine Meadow',
    category: 'nature',
    type: 'image',
    src: 'https://images.unsplash.com/photo-1598439473183-42c9301db5dc?auto=format&fit=crop&w=1920&q=80',
    description: 'Green grass field and trees under blue sky'
  },

  // Cityscape
  {
    id: 'city-1',
    name: 'City Night Skyline',
    category: 'cityscape',
    type: 'image',
    src: 'https://images.pexels.com/photos/9410009/pexels-photo-9410009.jpeg?auto=compress&cs=tinysrgb&w=1920&q=80',
    description: 'Illuminated skyscrapers against the night sky'
  },
  {
    id: 'city-2',
    name: 'Taipei Skyline',
    category: 'cityscape',
    type: 'image',
    src: 'https://images.pexels.com/photos/23106806/pexels-photo-23106806.jpeg?auto=compress&cs=tinysrgb&w=1920&q=80',
    description: 'Night view of Taipei skyline with Taipei 101'
  },

  // Solids & Abstract
  {
    id: 'solid-grey',
    name: 'Professional Grey',
    category: 'solid',
    type: 'solid',
    color: '#374151',
    description: 'Clean grey solid background'
  },
  {
    id: 'solid-navy',
    name: 'Navy Blue',
    category: 'solid',
    type: 'solid',
    color: '#1e3a5f',
    description: 'Professional navy blue background'
  },
  {
    id: 'abstract-gradient',
    name: 'Purple Gradient',
    category: 'abstract',
    type: 'solid',
    color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    description: 'Soft purple and blue gradient'
  }
];

export const getPresetBackgrounds = () => PRESET_BACKGROUNDS;

export const getBackgroundsByCategory = (categoryId) => {
  if (categoryId === 'all') return PRESET_BACKGROUNDS;
  return PRESET_BACKGROUNDS.filter(bg => bg.category === categoryId);
};

export const getBackgroundById = (id) => PRESET_BACKGROUNDS.find(bg => bg.id === id);
