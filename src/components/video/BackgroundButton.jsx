
import React, { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import BackgroundSelectorModal from './backgrounds/BackgroundSelectorModal';
import { cn } from '@/lib/utils';
import { useBackgroundManager } from '@/hooks/useBackgroundManager';

const BackgroundButton = ({ className }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { activeBackground } = useBackgroundManager();

  const isActive = activeBackground.id !== 'none';

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isActive ? "secondary" : "default"}
              size="icon"
              onClick={() => setIsModalOpen(true)}
              className={cn(
                "rounded-full w-12 h-12 transition-all duration-200 relative",
                isActive 
                  ? "bg-white text-indigo-600 hover:bg-gray-200 border-2 border-indigo-600" 
                  : "bg-gray-800 text-white hover:bg-gray-700 border border-gray-700",
                className
              )}
            >
              <ImageIcon className="w-5 h-5" />
              {isActive && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                </span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Change Background</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <BackgroundSelectorModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
};

export default BackgroundButton;
