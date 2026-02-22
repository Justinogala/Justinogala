
export const BACKGROUND_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'blur', label: 'Blur' },
  { id: 'office', label: 'Office' },
  { id: 'nature', label: 'Nature' },
  { id: 'solid', label: 'Colors' },
  { id: 'gradient', label: 'Gradient' },
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
    thumbnail: 'https://images.unsplash.com/photo-1496660424560-647d63a8a379?w=300&q=80&blur=20' // Placeholder thumb
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
    name: 'Modern Bright Office',
    category: 'office',
    type: 'image',
    src: 'https://images.unsplash.com/photo-1689830641394-9215be527e44?auto=format&fit=crop&w=1920&q=80',
    description: 'Professional bright office space'
  },
  {
    id: 'office-2',
    name: 'Executive Workspace',
    category: 'office',
    type: 'image',
    src: 'https://images.unsplash.com/photo-1555529941-66b8c99c4593?auto=format&fit=crop&w=1920&q=80',
    description: 'Dark wood executive desk setup'
  },

  // Nature
  {
    id: 'nature-1',
    name: 'Misty Mountains',
    category: 'nature',
    type: 'image',
    src: 'https://images.unsplash.com/photo-1613387643306-dfe512d10bd5?auto=format&fit=crop&w=1920&q=80',
    description: 'Calm misty mountain landscape'
  },
  {
    id: 'nature-2',
    name: 'Tropical Beach',
    category: 'nature',
    type: 'image',
    src: 'https://images.unsplash.com/photo-1507937913511-254318d16a16?auto=format&fit=crop&w=1920&q=80',
    description: 'Sunny tropical beach view'
  },

  // Gradients
  {
    id: 'gradient-1',
    name: 'Aurora Borealis',
    category: 'gradient',
    type: 'image',
    src: 'https://images.unsplash.com/photo-1653676934208-021a2b5e7ca3?auto=format&fit=crop&w=1920&q=80',
    description: 'Soft purple and blue gradient'
  },
  {
    id: 'gradient-2',
    name: 'Warm Sunset',
    category: 'gradient',
    type: 'image',
    src: 'https://images.unsplash.com/photo-1695922088629-09851d7f9529?auto=format&fit=crop&w=1920&q=80',
    description: 'Orange and pink sunset gradient'
  },

  // Solids & Abstract
  {
    id: 'solid-grey',
    name: 'Professional Grey',
    category: 'solid',
    type: 'image',
    src: 'https://images.unsplash.com/photo-1695173583133-c19731e2df44?auto=format&fit=crop&w=1920&q=80',
    description: 'Clean grey solid background'
  },
  {
    id: 'abstract-geo',
    name: 'Geometric Shapes',
    category: 'abstract',
    type: 'image',
    src: 'https://images.unsplash.com/photo-1692150487294-7be36e0939d1?auto=format&fit=crop&w=1920&q=80',
    description: 'Modern 3D geometric shapes'
  }
];

export const getPresetBackgrounds = () => PRESET_BACKGROUNDS;

export const getBackgroundsByCategory = (categoryId) => {
  if (categoryId === 'all') return PRESET_BACKGROUNDS;
  return PRESET_BACKGROUNDS.filter(bg => bg.category === categoryId);
};

export const getBackgroundById = (id) => PRESET_BACKGROUNDS.find(bg => bg.id === id);
