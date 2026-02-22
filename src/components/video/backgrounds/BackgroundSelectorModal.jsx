
import React, { useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import BackgroundSelector from './BackgroundSelector';
import { useBackgroundManager } from '@/hooks/useBackgroundManager';

const BackgroundSelectorModal = ({ isOpen, onClose, onSave }) => {
  const { 
    activeBackground, 
    selectBackground, 
    saveBackgroundSelection,
    customBackgrounds, 
    uploadCustomBackground, 
    removeCustomBackground 
  } = useBackgroundManager();

  // Store the initial background when modal opens to allow cancellation
  const initialBackgroundRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      initialBackgroundRef.current = activeBackground.id;
    }
  }, [isOpen]); // Only run when open state changes

  const handleCancel = () => {
    // Revert to initial background if it exists
    if (initialBackgroundRef.current && initialBackgroundRef.current !== activeBackground.id) {
      selectBackground(initialBackgroundRef.current);
    }
    onClose();
  };

  const handleSave = () => {
    saveBackgroundSelection();
    if (onSave) onSave(activeBackground);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="max-w-3xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-800 shadow-2xl">
        <DialogHeader className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-slate-900/80 backdrop-blur-sm z-10">
          <DialogTitle>Virtual Background</DialogTitle>
          <DialogDescription>
            Choose a background effect. Changes are previewed immediately.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden relative">
          <BackgroundSelector 
            activeBackgroundId={activeBackground.id}
            onSelect={selectBackground}
            customBackgrounds={customBackgrounds}
            onUploadCustom={uploadCustomBackground}
            onDeleteCustom={removeCustomBackground}
          />
        </div>

        <DialogFooter className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-slate-900 flex flex-row justify-between items-center sm:justify-between">
           <div className="text-xs text-gray-500 font-medium px-2 py-1 bg-gray-200 dark:bg-slate-800 rounded-md hidden sm:block">
             {activeBackground.name ? `Selected: ${activeBackground.name}` : 'No background selected'}
           </div>
           <div className="flex gap-3 w-full sm:w-auto justify-end">
             <Button 
                variant="outline" 
                onClick={handleCancel}
                className="hover:bg-gray-100 dark:hover:bg-slate-800"
              >
               Cancel
             </Button>
             <Button 
                onClick={handleSave} 
                className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 px-8"
              >
               Save Changes
             </Button>
           </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BackgroundSelectorModal;
