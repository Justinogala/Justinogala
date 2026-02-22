
import React from 'react';
import { 
  Copy, Play, Link as LinkIcon, Code, UserPlus, Edit, Trash2, 
  Calendar, Clock, Globe, Lock, Video, MapPin, Share2, Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { copyToClipboard } from '@/utils/meetingUtils';
import { useToast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const MeetingDetailsPanel = ({ 
  meeting, 
  onStart, 
  onEmbed, 
  onInvite, 
  onEdit, 
  onDelete 
}) => {
  const { toast } = useToast();

  if (!meeting) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 p-8">
        <div className="w-24 h-24 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <Calendar className="w-12 h-12 text-gray-300 dark:text-slate-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Meeting Selected</h3>
        <p className="text-gray-500 max-w-sm text-center leading-relaxed">Select a meeting from the list to view details, manage settings, or start the session.</p>
      </div>
    );
  }

  const handleCopy = async (text, label) => {
    const success = await copyToClipboard(text);
    if (success) {
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard.`
      });
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md border border-gray-200 dark:border-slate-800 overflow-hidden h-full flex flex-col transition-all duration-300">
      {/* Header */}
      <div className="p-8 border-b border-gray-100 dark:border-slate-800 bg-gradient-to-r from-white via-gray-50/30 to-white dark:from-slate-900 dark:via-slate-900/50 dark:to-slate-900">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 mb-3 border border-violet-200 dark:border-violet-800/50">
              <Video className="w-3 h-3" />
              Video Conference
            </span>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white leading-tight">{meeting.title}</h2>
          </div>
          
          <div className="flex gap-2">
             <Button 
              size="sm" 
              variant="outline" 
              onClick={() => onEdit(meeting)} 
              className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 dark:border-blue-900 dark:text-blue-300 transition-colors"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleCopy(`${window.location.origin}/meet/${meeting.id}`, 'Link')} 
              className="border-violet-200 text-violet-700 hover:bg-violet-50 hover:border-violet-300 dark:border-violet-900 dark:text-violet-300 transition-colors"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
             <Button 
              size="sm" 
              variant="outline" 
              onClick={() => onDelete(meeting)}
              className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700 dark:border-red-900/50 dark:text-red-400 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-6 text-sm text-gray-600 dark:text-gray-400 mt-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span>{meeting.date}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span>{meeting.time}</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-gray-400" />
            <span>{meeting.timezone || "UTC"}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-8 space-y-8">
          
          {/* Main Info */}
          <section>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              Meeting Details
              <div className="h-px bg-gray-200 dark:bg-slate-700 flex-1 ml-2" />
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Meeting ID</label>
                <div className="relative group">
                  <Input 
                    value={meeting.id} 
                    readOnly 
                    className="pr-10 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 group-hover:border-violet-300 transition-colors font-mono text-sm shadow-sm" 
                  />
                  <button 
                    onClick={() => handleCopy(meeting.id, 'Meeting ID')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-violet-600 transition-colors p-1"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Security Code</label>
                <div className="relative group">
                  <Input 
                    value={meeting.password || 'Not required'} 
                    type={meeting.password ? "text" : "text"} 
                    readOnly 
                    className="pr-10 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 group-hover:border-violet-300 transition-colors text-sm shadow-sm" 
                  />
                  {meeting.password && (
                    <button 
                      onClick={() => handleCopy(meeting.password, 'Password')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-violet-600 transition-colors p-1"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

               <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Description</label>
                <div className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-4 text-sm text-gray-700 dark:text-gray-300 min-h-[100px] shadow-sm">
                   {meeting.description || "No description provided."}
                </div>
              </div>
            </div>
          </section>

          {/* Participants Section */}
          <section>
             <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              Participants
              <span className="bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-gray-400 text-[10px] px-2 py-0.5 rounded-full">
                {meeting.participants?.length || 0}
              </span>
              <div className="h-px bg-gray-200 dark:bg-slate-700 flex-1 ml-2" />
            </h3>
            
            {meeting.participants && meeting.participants.length > 0 ? (
              <div className="flex flex-wrap gap-4">
                {meeting.participants.map((p, i) => (
                  <div key={i} className="flex items-center gap-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-2 pr-4 rounded-lg shadow-sm">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={p.avatar} />
                      <AvatarFallback className="bg-violet-100 text-violet-700 text-xs">{p.name?.[0] || '?'}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-gray-900 dark:text-white">{p.name || 'Unknown'}</span>
                      <span className="text-[10px] text-gray-500">{p.role || 'Guest'}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-dashed border-gray-300 dark:border-slate-700 text-center">
                <Users className="w-8 h-8 text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">No participants invited yet.</p>
                <Button variant="link" onClick={() => onInvite(meeting)} className="text-violet-600 h-auto p-0 text-sm mt-1">
                  Invite people
                </Button>
              </div>
            )}
          </section>

        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-6 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 flex justify-between items-center gap-4">
        <div className="flex gap-4">
           <Button variant="outline" className="text-gray-600 border-gray-300 hover:bg-gray-50 hover:text-gray-900 shadow-sm transition-all duration-200">
             <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" className="w-4 h-4 mr-2" alt="Google" />
             Google Cal
           </Button>
           <Button variant="outline" className="text-gray-600 border-gray-300 hover:bg-gray-50 hover:text-gray-900 shadow-sm transition-all duration-200">
             <img src="https://upload.wikimedia.org/wikipedia/commons/d/df/Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg" className="w-4 h-4 mr-2" alt="Outlook" />
             Outlook
           </Button>
        </div>
        
        <Button 
          onClick={() => onStart(meeting)}
          className="bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/30 px-8 py-6 rounded-lg text-lg font-semibold transition-all hover:scale-105 active:scale-95"
        >
          <Play className="w-5 h-5 mr-2 fill-current" />
          Start Meeting
        </Button>
      </div>
    </div>
  );
};

export default MeetingDetailsPanel;
