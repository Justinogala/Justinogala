
import React from 'react';
import { Progress } from '@/components/ui/progress';

const UploadProgress = ({ progress, speed }) => {
  // Format speed nicely
  const formattedSpeed = speed > 1024 
    ? `${(speed / 1024).toFixed(2)} MB/s` 
    : `${speed.toFixed(0)} KB/s`;
    
  return (
    <div className="space-y-2 mt-4">
      <div className="flex justify-between items-center text-xs font-medium text-gray-600 dark:text-gray-300">
        <span>Uploading...</span>
        <span>{Math.round(progress)}% • {formattedSpeed}</span>
      </div>
      <div className="relative h-2 rounded-full overflow-hidden bg-gray-100 dark:bg-slate-700">
        <div 
           className="absolute top-0 left-0 h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-300 ease-out"
           style={{ width: `${progress}%` }}
        />
        {/* Shimmer effect */}
        <div className="absolute top-0 left-0 h-full w-full bg-white/20 -skew-x-45 animate-[shimmer_2s_infinite]" style={{ transform: `translateX(${progress - 100}%)` }}/>
      </div>
    </div>
  );
};

export default UploadProgress;
