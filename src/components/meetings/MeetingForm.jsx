
import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Clock, User, Video, Mic, AlignLeft } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';

const MeetingForm = ({ formData, onChange, onSelectChange, errors }) => {
  return (
    <div className="space-y-5">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-sm font-medium text-gray-700 dark:text-gray-200">
          Meeting Title <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          name="title"
          placeholder="e.g., Q3 Marketing Strategy"
          value={formData.title}
          onChange={onChange}
          error={errors.title}
          className="bg-white dark:bg-slate-900"
        />
      </div>

      {/* Date & Time Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
            <Calendar className="w-4 h-4 text-violet-500" /> Date <span className="text-red-500">*</span>
          </Label>
          <Input
            id="date"
            name="date"
            type="date"
            value={formData.date}
            onChange={onChange}
            error={errors.date}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="time" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
            <Clock className="w-4 h-4 text-violet-500" /> Time <span className="text-red-500">*</span>
          </Label>
          <Input
            id="time"
            name="time"
            type="time"
            value={formData.time}
            onChange={onChange}
            error={errors.time}
          />
        </div>
      </div>

      {/* Type Selection */}
      <div className="space-y-2">
         <Label className="text-sm font-medium text-gray-700 dark:text-gray-200">Meeting Type</Label>
         <RadioGroup 
            defaultValue={formData.type} 
            onValueChange={(val) => onSelectChange('type', val)}
            className="grid grid-cols-2 gap-4"
         >
            <div>
              <RadioGroupItem value="audio" id="type-audio" className="peer sr-only" />
              <Label
                htmlFor="type-audio"
                className="flex items-center justify-center gap-2 p-3 border-2 border-gray-200 dark:border-slate-700 rounded-lg cursor-pointer hover:border-violet-400 peer-data-[state=checked]:border-violet-600 peer-data-[state=checked]:bg-violet-50 dark:peer-data-[state=checked]:bg-violet-900/20 peer-data-[state=checked]:text-violet-700 transition-all"
              >
                <Mic className="w-4 h-4" />
                Audio Only
              </Label>
            </div>
            <div>
              <RadioGroupItem value="video" id="type-video" className="peer sr-only" />
              <Label
                htmlFor="type-video"
                className="flex items-center justify-center gap-2 p-3 border-2 border-gray-200 dark:border-slate-700 rounded-lg cursor-pointer hover:border-violet-400 peer-data-[state=checked]:border-violet-600 peer-data-[state=checked]:bg-violet-50 dark:peer-data-[state=checked]:bg-violet-900/20 peer-data-[state=checked]:text-violet-700 transition-all"
              >
                <Video className="w-4 h-4" />
                Video Call
              </Label>
            </div>
         </RadioGroup>
      </div>

      {/* Participants */}
      <div className="space-y-2">
        <Label htmlFor="participants" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
          <User className="w-4 h-4 text-gray-500" /> Participants
        </Label>
        <Input
          id="participants"
          name="participants"
          placeholder="Add emails separated by comma"
          value={formData.participants}
          onChange={onChange}
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
          <AlignLeft className="w-4 h-4 text-gray-500" /> Description (Optional)
        </Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Brief agenda or notes..."
          value={formData.description}
          onChange={onChange}
          className="h-24 resize-none bg-white dark:bg-slate-900"
        />
      </div>
    </div>
  );
};

export default MeetingForm;
