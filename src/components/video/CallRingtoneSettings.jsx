
import React from 'react';
import { Volume2, VolumeX, Play, Music } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useCallRingtone } from '@/hooks/useCallRingtone';
import { cn } from '@/lib/utils';

const CallRingtoneSettings = ({ className }) => {
  const { 
    volume, 
    isMuted, 
    ringtoneType, 
    updateVolume, 
    toggleMute, 
    updateRingtoneType, 
    playPreview 
  } = useCallRingtone();

  return (
    <div className={cn("bg-gray-50 dark:bg-slate-800/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700 space-y-6", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Music className="w-5 h-5 text-indigo-500" />
          Ringtone Settings
        </h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={playPreview}
          className="gap-2"
        >
          <Play className="w-4 h-4" /> Preview
        </Button>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Ringtone Style</Label>
          <Select value={ringtoneType} onValueChange={updateRingtoneType}>
            <SelectTrigger className="bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700">
              <SelectValue placeholder="Select ringtone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="grigri">Classic Gri Gri (Telephone)</SelectItem>
              <SelectItem value="digital">Modern Digital Pulse</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Volume</Label>
            <span className="text-sm text-gray-500 font-mono">{Math.round(volume * 100)}%</span>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleMute}
              className={cn("shrink-0", isMuted && "text-red-500")}
            >
              {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </Button>
            <Slider 
              value={[isMuted ? 0 : volume]} 
              min={0} 
              max={1} 
              step={0.01} 
              onValueChange={([val]) => updateVolume(val)}
              className="flex-1"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallRingtoneSettings;
