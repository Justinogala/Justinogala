import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Image, Sparkles, X, Check, Upload, Loader2, 
  Eye, EyeOff, Palette, MonitorPlay
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { BACKGROUND_EFFECTS, VIRTUAL_BACKGROUNDS } from '@/hooks/useVirtualBackground';

// Blur level options
const BLUR_OPTIONS = [
  { id: BACKGROUND_EFFECTS.BLUR_LIGHT, label: 'Light', icon: '○' },
  { id: BACKGROUND_EFFECTS.BLUR_MEDIUM, label: 'Medium', icon: '◐' },
  { id: BACKGROUND_EFFECTS.BLUR_HEAVY, label: 'Heavy', icon: '●' }
];

// Background thumbnail component
const BackgroundThumbnail = ({ bg, isSelected, onClick, disabled }) => {
  const isColor = bg.color && !bg.url;
  const isGradient = bg.color?.includes('gradient');
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative w-16 h-12 sm:w-20 sm:h-14 rounded-lg overflow-hidden border-2 transition-all",
        isSelected 
          ? "border-indigo-500 ring-2 ring-indigo-500/30" 
          : "border-transparent hover:border-slate-500",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      title={bg.name}
    >
      {bg.url ? (
        <img 
          src={bg.url} 
          alt={bg.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="56"><rect fill="%23374151" width="80" height="56"/><text x="50%" y="50%" fill="%239ca3af" text-anchor="middle" dy=".3em" font-size="10">No Image</text></svg>';
          }}
        />
      ) : isGradient ? (
        <div 
          className="w-full h-full"
          style={{ background: bg.color }}
        />
      ) : (
        <div 
          className="w-full h-full"
          style={{ backgroundColor: bg.color }}
        />
      )}
      
      {isSelected && (
        <div className="absolute inset-0 bg-indigo-500/30 flex items-center justify-center">
          <Check className="w-5 h-5 text-white" />
        </div>
      )}
    </button>
  );
};

/**
 * Virtual Background Selector Component
 * Provides UI for selecting blur effects or virtual backgrounds
 */
const VirtualBackgroundSelector = ({
  isOpen,
  onClose,
  currentEffect,
  currentBackground,
  onEffectChange,
  onBackgroundChange,
  onCustomUpload,
  isLoading = false,
  isProcessing = false,
  fps = 0,
  modelReady = false,
  disabled = false
}) => {
  const [activeTab, setActiveTab] = useState('blur'); // 'blur' or 'backgrounds'
  const [customBackgrounds, setCustomBackgrounds] = useState([]);
  
  // Handle custom background upload
  const handleFileUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const newBg = {
        id: `custom-${Date.now()}`,
        name: file.name,
        url: event.target.result,
        isCustom: true
      };
      setCustomBackgrounds(prev => [...prev, newBg]);
      if (onCustomUpload) onCustomUpload(newBg);
    };
    reader.readAsDataURL(file);
  }, [onCustomUpload]);
  
  // Handle blur selection
  const handleBlurSelect = useCallback((blurId) => {
    onEffectChange(blurId);
    onBackgroundChange(null);
  }, [onEffectChange, onBackgroundChange]);
  
  // Handle background selection
  const handleBackgroundSelect = useCallback((bg) => {
    onEffectChange(BACKGROUND_EFFECTS.VIRTUAL);
    onBackgroundChange(bg);
  }, [onEffectChange, onBackgroundChange]);
  
  // Handle turning off effects
  const handleTurnOff = useCallback(() => {
    onEffectChange(BACKGROUND_EFFECTS.NONE);
    onBackgroundChange(null);
  }, [onEffectChange, onBackgroundChange]);
  
  if (!isOpen) return null;
  
  const allBackgrounds = [...VIRTUAL_BACKGROUNDS, ...customBackgrounds];
  const isEffectActive = currentEffect !== BACKGROUND_EFFECTS.NONE;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-md bg-slate-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/20 rounded-lg">
                <Sparkles className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Background Effects</h3>
                <p className="text-xs text-gray-400">
                  {isLoading ? 'Loading AI model...' : modelReady ? 'AI ready' : 'Initializing...'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isProcessing && (
                <Badge variant="secondary" className="bg-green-500/20 text-green-400 text-xs">
                  {fps} FPS
                </Badge>
              )}
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5 text-gray-400" />
              </Button>
            </div>
          </div>
          
          {/* Loading State */}
          {isLoading && (
            <div className="p-8 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
              <div className="text-center">
                <p className="text-white font-medium">Loading AI Model</p>
                <p className="text-gray-400 text-sm">This may take a few seconds...</p>
              </div>
            </div>
          )}
          
          {/* Main Content */}
          {!isLoading && (
            <>
              {/* Tabs */}
              <div className="flex border-b border-white/10">
                <button
                  onClick={() => setActiveTab('blur')}
                  className={cn(
                    "flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2",
                    activeTab === 'blur' 
                      ? "text-white border-b-2 border-indigo-500" 
                      : "text-gray-400 hover:text-white"
                  )}
                >
                  <Eye className="w-4 h-4" />
                  Blur
                </button>
                <button
                  onClick={() => setActiveTab('backgrounds')}
                  className={cn(
                    "flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2",
                    activeTab === 'backgrounds' 
                      ? "text-white border-b-2 border-indigo-500" 
                      : "text-gray-400 hover:text-white"
                  )}
                >
                  <Image className="w-4 h-4" />
                  Backgrounds
                </button>
              </div>
              
              <div className="p-4 space-y-4">
                {/* Turn Off Button */}
                <button
                  onClick={handleTurnOff}
                  disabled={disabled}
                  className={cn(
                    "w-full p-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2",
                    !isEffectActive
                      ? "border-indigo-500 bg-indigo-500/10 text-white"
                      : "border-slate-700 hover:border-slate-600 text-gray-300",
                    disabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <EyeOff className="w-4 h-4" />
                  <span>No Effect</span>
                  {!isEffectActive && <Check className="w-4 h-4 ml-auto" />}
                </button>
                
                {/* Blur Tab */}
                {activeTab === 'blur' && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-400">Blur your background while keeping you in focus</p>
                    <div className="grid grid-cols-3 gap-2">
                      {BLUR_OPTIONS.map(option => {
                        const isSelected = currentEffect === option.id;
                        return (
                          <button
                            key={option.id}
                            onClick={() => handleBlurSelect(option.id)}
                            disabled={disabled}
                            className={cn(
                              "p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2",
                              isSelected
                                ? "border-indigo-500 bg-indigo-500/10 text-white"
                                : "border-slate-700 hover:border-slate-600 text-gray-300",
                              disabled && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            <span className="text-2xl">{option.icon}</span>
                            <span className="text-xs font-medium">{option.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Backgrounds Tab */}
                {activeTab === 'backgrounds' && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-400">Replace your background with an image</p>
                    
                    {/* Preset Backgrounds */}
                    <div>
                      <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Presets</h4>
                      <div className="grid grid-cols-4 gap-2">
                        {allBackgrounds.map(bg => (
                          <BackgroundThumbnail
                            key={bg.id}
                            bg={bg}
                            isSelected={currentEffect === BACKGROUND_EFFECTS.VIRTUAL && currentBackground?.id === bg.id}
                            onClick={() => handleBackgroundSelect(bg)}
                            disabled={disabled}
                          />
                        ))}
                      </div>
                    </div>
                    
                    {/* Custom Upload */}
                    <div>
                      <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Custom</h4>
                      <label className={cn(
                        "flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-xl cursor-pointer transition-all",
                        "border-slate-700 hover:border-indigo-500 hover:bg-indigo-500/5 text-gray-400 hover:text-indigo-400",
                        disabled && "opacity-50 cursor-not-allowed"
                      )}>
                        <Upload className="w-5 h-5" />
                        <span className="text-sm">Upload image</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                          disabled={disabled}
                        />
                      </label>
                    </div>
                  </div>
                )}
                
                {/* Performance Note */}
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <p className="text-xs text-amber-400">
                    <strong>Note:</strong> Background effects use AI processing which may impact performance on older devices. 
                    {fps > 0 && fps < 15 && " Consider reducing video quality for better performance."}
                  </p>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default VirtualBackgroundSelector;
