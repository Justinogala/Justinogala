import React, { createContext, useContext, useState } from 'react';

const HeroSlideContext = createContext({ slideIndex: 0, setSlideIndex: () => {} });

export const useHeroSlide = () => useContext(HeroSlideContext);

export const HeroSlideProvider = ({ children }) => {
  const [slideIndex, setSlideIndex] = useState(0);
  return (
    <HeroSlideContext.Provider value={{ slideIndex, setSlideIndex }}>
      {children}
    </HeroSlideContext.Provider>
  );
};
