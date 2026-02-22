
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Users, Video, Link as LinkIcon, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import VideoConferencingSelector from './VideoConferencingSelector';
import { DEFAULT_PLATFORM, EXTERNAL_URL_PLATFORMS } from '@/config/videoConferencingConfig';

const MeetingScheduler = ({ onSchedule, onCancel }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    duration: '30',
    type: 'one-on-one',
    platform: DEFAULT_PLATFORM, // Default to Jizira
    meetingUrl: '',
    participants: '',
    participantList: [],
    settings: {
      recording: false,
      waitingRoom: true,
      chat: true
    }
  });

  const handleAddParticipant = () => {
    if (formData.participants && formData.participants.includes('@')) {
      setFormData(prev => ({
        ...prev,
        participantList: [...prev.participantList, prev.participants],
        participants: ''
      }));
    }
  };

  const handleRemoveParticipant = (index) => {
    setFormData(prev => ({
      ...prev,
      participantList: prev.participantList.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.date || !formData.time) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    // Validation for external platforms requiring URL
    const isExternalPlatform = EXTERNAL_URL_PLATFORMS.includes(formData.platform);
    if (isExternalPlatform && !formData.meetingUrl) {
      toast({
        title: "Missing Meeting Link",
        description: `Please provide the ${formData.platform === 'jizira' ? 'Jizira' : 'external'} meeting URL.`,
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      onSchedule(formData);
    }, 1500);
  };

  const getUrlLabel = () => {
    switch(formData.platform) {
      case 'jizira': return 'Jizira Meeting URL';
      case 'zoom': return 'Zoom Link';
      case 'google-meet': return 'Google Meet Link';
      case 'microsoft-teams': return 'Microsoft Teams Link';
      default: return 'External Meeting URL';
    }
  };

  const isExternalPlatform = EXTERNAL_URL_PLATFORMS.includes(formData.platform);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto p-1"
    >
      <Card className="border-0 shadow-2xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                Schedule New Meeting
              </CardTitle>
              <CardDescription>
                Set up a new video conference with your team or clients.
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Details */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Meeting Title</Label>
                  <Input 
                    id="title" 
                    placeholder="e.g., Weekly Team Sync" 
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Agenda and meeting details..." 
                    className="min-h-[120px]"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input 
                      id="date" 
                      type="date" 
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Time</Label>
                    <Input 
                      id="time" 
                      type="time" 
                      value={formData.time}
                      onChange={(e) => setFormData({...formData, time: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Duration</Label>
                    <Select 
                      value={formData.duration} 
                      onValueChange={(val) => setFormData({...formData, duration: val})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="45">45 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <Select defaultValue="utc-5">
                      <SelectTrigger>
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="utc-8">Pacific Time (US)</SelectItem>
                        <SelectItem value="utc-5">Eastern Time (US)</SelectItem>
                        <SelectItem value="utc+0">GMT (London)</SelectItem>
                        <SelectItem value="utc+1">CET (Paris)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Right Column: Participants & Settings */}
              <div className="space-y-6">
                
                <VideoConferencingSelector 
                  value={formData.platform}
                  onChange={(val) => setFormData({...formData, platform: val})}
                />

                {isExternalPlatform && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    <Label htmlFor="meetingUrl">
                      {getUrlLabel()} <span className="text-red-500">*</span>
                    </Label>
                    <Input 
                      id="meetingUrl"
                      placeholder={formData.platform === 'jizira' ? 'https://jizira.com/...' : 'https://...'}
                      value={formData.meetingUrl}
                      onChange={(e) => setFormData({...formData, meetingUrl: e.target.value})}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Participants</Label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Add email address" 
                      value={formData.participants}
                      onChange={(e) => setFormData({...formData, participants: e.target.value})}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddParticipant())}
                    />
                    <Button type="button" onClick={handleAddParticipant} variant="secondary">Add</Button>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 min-h-[100px] flex flex-wrap gap-2">
                    {formData.participantList.length === 0 && (
                      <span className="text-sm text-slate-400 w-full text-center py-4">No participants added yet</span>
                    )}
                    {formData.participantList.map((email, idx) => (
                      <div key={idx} className="bg-white dark:bg-slate-700 px-3 py-1 rounded-full text-sm flex items-center shadow-sm border border-slate-200 dark:border-slate-600">
                        <span className="mr-2">{email}</span>
                        <button type="button" onClick={() => handleRemoveParticipant(idx)} className="text-slate-400 hover:text-red-500">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <h4 className="font-medium text-sm text-slate-500 uppercase tracking-wider">Settings</h4>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Record Meeting</Label>
                      <p className="text-xs text-slate-500">Automatically start recording when meeting begins</p>
                    </div>
                    <Switch 
                      checked={formData.settings.recording}
                      onCheckedChange={(checked) => setFormData({...formData, settings: {...formData.settings, recording: checked}})}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Preview Section */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Preview
              </h4>
              <div className="flex flex-col md:flex-row gap-6 text-sm">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <Calendar className="w-4 h-4" />
                  {formData.date || 'Date not set'}
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <Clock className="w-4 h-4" />
                  {formData.time ? `${formData.time} (${formData.duration} min)` : 'Time not set'}
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <Video className="w-4 h-4" />
                  {isExternalPlatform ? 'External Link' : 'Integrated Video'}
                </div>
              </div>
            </div>

            <CardFooter className="px-0 flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
              <Button type="submit" disabled={loading} className="bg-violet-600 hover:bg-violet-700 text-white min-w-[140px]">
                {loading ? 'Scheduling...' : 'Schedule Meeting'}
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default MeetingScheduler;
