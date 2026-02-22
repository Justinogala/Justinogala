
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Trash2, Ban } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { PRESET_BACKGROUNDS, BACKGROUND_CATEGORIES } from '@/data/BackgroundPresetLibrary';
import CustomBackgroundUpload from './CustomBackgroundUpload';

const BackgroundThumbnail = ({ background, isSelected, onClick, onDelete }) => (
  <motion.div
    whileHover={{ scale: 1.03 }}
    whileTap={{ scale: 0.97 }}
    className={cn(
      "relative group aspect-video rounded-lg overflow-hidden cursor-pointer border-2 transition-all duration-300",
      isSelected 
        ? "border-indigo-500 ring-2 ring-indigo-500/30 shadow-xl" 
        : "border-transparent hover:border-gray-300 dark:hover:border-gray-600"
    )}
    onClick={onClick}
  >
    {background.id === 'none' ? (
      <div className="w-full h-full bg-gray-100 dark:bg-slate-800 flex flex-col items-center justify-center text-gray-500 transition-colors group-hover:bg-gray-200 dark:group-hover:bg-slate-700">
        <Ban className="w-8 h-8 mb-2" />
        <span className="text-xs font-medium">None</span>
      </div>
    ) : (
      <>
        <div className="relative w-full h-full">
           <img 
             src={background.thumbnail || background.src} 
             alt={background.name}
             className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
           />
        </div>
        
        {/* Selection Indicator Overlay */}
        <div className={cn(
          "absolute inset-0 bg-indigo-900/20 flex items-center justify-center transition-all duration-300",
          isSelected ? "opacity-100 backdrop-blur-[1px]" : "opacity-0 group-hover:opacity-100"
        )}>
          {isSelected && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-indigo-600 rounded-full p-2 shadow-lg"
            >
              <Check className="w-5 h-5 text-white" />
            </motion.div>
          )}
        </div>
        
        {/* Name Badge */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <p className="text-[10px] text-white font-medium truncate">{background.name}</p>
        </div>

        {/* Delete Button (Custom Only) */}
        {onDelete && (
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(background.id); }}
            className="absolute top-1 right-1 p-1.5 bg-red-500/90 rounded-full text-white opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all shadow-sm"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </>
    )}
  </motion.div>
);

const BackgroundSelector = ({ 
  activeBackgroundId, 
  onSelect, 
  customBackgrounds, 
  onUploadCustom, 
  onDeleteCustom 
}) => {
  const [activeTab, setActiveTab] = useState('all');

  const filteredPresets = activeTab === 'all' 
    ? PRESET_BACKGROUNDS 
    : PRESET_BACKGROUNDS.filter(bg => bg.category === activeTab);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="px-6 pt-4 pb-2 border-b border-gray-200 dark:border-gray-800">
          <TabsList className="w-full justify-start overflow-x-auto bg-transparent p-0 gap-2 h-auto pb-2 no-scrollbar">
            {BACKGROUND_CATEGORIES.map(cat => (
              <TabsTrigger 
                key={cat.id} 
                value={cat.id}
                className="rounded-full px-4 py-1.5 border border-gray-200 dark:border-gray-700 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:border-indigo-600 transition-all text-xs font-medium"
              >
                {cat.label}
              </TabsTrigger>
            ))}
            <TabsTrigger 
              value="custom"
              className="rounded-full px-4 py-1.5 border border-gray-200 dark:border-gray-700 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:border-indigo-600 transition-all text-xs font-medium"
            >
              Custom
            </TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1 px-6 py-4">
          <div className="space-y-6 pb-6">
            {/* None Option */}
            {activeTab === 'all' && (
               <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  <BackgroundThumbnail 
                    background={{ id: 'none' }}
                    isSelected={activeBackgroundId === 'none'}
                    onClick={() => onSelect('none')}
                  />
               </div>
            )}

            {activeTab === 'custom' ? (
              <div className="space-y-4">
                <CustomBackgroundUpload onUpload={onUploadCustom} />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {customBackgrounds.map(bg => (
                    <BackgroundThumbnail 
                      key={bg.id}
                      background={bg}
                      isSelected={activeBackgroundId === bg.id}
                      onClick={() => onSelect(bg.id)}
                      onDelete={onDeleteCustom}
                    />
                  ))}
                  {customBackgrounds.length === 0 && (
                    <p className="col-span-full text-center text-sm text-gray-500 py-8 italic">
                      No custom backgrounds yet. Upload one above!
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {filteredPresets.map(bg => (
                  <BackgroundThumbnail 
                    key={bg.id}
                    background={bg}
                    isSelected={activeBackgroundId === bg.id}
                    onClick={() => onSelect(bg.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </Tabs>
    </div>
  );
};

export default BackgroundSelector;
