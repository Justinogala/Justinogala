
import React from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import BackgroundSelector from '@/components/video/backgrounds/BackgroundSelector';
import { useBackgroundManager } from '@/hooks/useBackgroundManager';

const BackgroundSettings = () => {
  const { 
    activeBackground, 
    selectBackground, 
    customBackgrounds, 
    uploadCustomBackground, 
    removeCustomBackground 
  } = useBackgroundManager();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Default Background</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Set your preferred background for all calls.
          </p>
        </div>
        <div className="flex items-center space-x-2">
           <Switch id="auto-apply" defaultChecked />
           <Label htmlFor="auto-apply">Auto-apply on join</Label>
        </div>
      </div>

      <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden h-[400px] flex flex-col">
        <div className="bg-gray-50 dark:bg-slate-800 p-3 border-b border-gray-200 dark:border-gray-700">
           <span className="text-sm font-medium">Select Background</span>
        </div>
        <div className="flex-1 overflow-hidden relative">
          <BackgroundSelector 
            activeBackgroundId={activeBackground.id}
            onSelect={selectBackground}
            customBackgrounds={customBackgrounds}
            onUploadCustom={uploadCustomBackground}
            onDeleteCustom={removeCustomBackground}
          />
        </div>
      </div>
    </div>
  );
};

export default BackgroundSettings;
