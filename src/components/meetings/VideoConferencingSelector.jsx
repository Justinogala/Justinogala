
import React from 'react';
import { 
  Video, 
  Monitor, 
  Link as LinkIcon, 
  Users,
  Zap,
  Globe
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { VIDEO_PLATFORMS } from '@/config/videoConferencingConfig';

const iconMap = {
  Zap: Zap,
  Monitor: Monitor,
  Users: Users,
  Video: Globe, // Distinct from internal
  Link: LinkIcon
};

const VideoConferencingSelector = ({ value, onChange, className }) => {
  
  const getIcon = (iconName) => {
    const IconComponent = iconMap[iconName] || Video;
    return IconComponent;
  };

  const selectedPlatform = VIDEO_PLATFORMS.find(p => p.id === value) || VIDEO_PLATFORMS[0];

  return (
    <div className={className}>
      <Label htmlFor="platform-select" className="mb-2 block">Video Platform</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="platform-select" className={`w-full ${value === 'jizira' ? 'border-violet-500 ring-1 ring-violet-500/20 bg-violet-50/50 dark:bg-violet-900/10' : ''}`}>
          <SelectValue placeholder="Select a platform" />
        </SelectTrigger>
        <SelectContent>
          {VIDEO_PLATFORMS.map((platform) => {
            const Icon = getIcon(platform.iconName);
            return (
              <SelectItem key={platform.id} value={platform.id} className={platform.id === 'jizira' ? 'bg-violet-50 dark:bg-violet-900/20 focus:bg-violet-100 dark:focus:bg-violet-900/40' : ''}>
                <div className="flex items-center gap-2 w-full">
                  <Icon className={`w-4 h-4 ${platform.id === 'jizira' ? 'text-violet-600 dark:text-violet-400' : 'text-slate-500'}`} />
                  <span className={platform.id === 'jizira' ? 'font-semibold text-violet-700 dark:text-violet-300' : ''}>
                    {platform.label}
                  </span>
                  {platform.isRecommended && (
                    <Badge variant="secondary" className="ml-auto text-[10px] h-5 bg-violet-200 text-violet-800 dark:bg-violet-800 dark:text-violet-200 border-0">
                      Recommended
                    </Badge>
                  )}
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      <div className="text-[10px] text-slate-500 mt-1.5 ml-1 flex items-center gap-1.5">
        {selectedPlatform.isRecommended && <Zap className="w-3 h-3 text-violet-500" />}
        {selectedPlatform.description}
      </div>
    </div>
  );
};

export default VideoConferencingSelector;
