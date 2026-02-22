
import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Video, Phone, MapPin, MoreVertical, Trash2, Edit, Monitor, Users, ExternalLink, Link as LinkIcon, Zap, Globe } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { formatMeetingDateTime } from '@/utils/dateTimeFormatter';
import { launchMeeting, getPlatformLabel } from '@/utils/VideoConferencingLauncher';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { VIDEO_PLATFORMS, EXTERNAL_URL_PLATFORMS } from '@/config/videoConferencingConfig';

const MeetingCard = ({ meeting, isSelected, onView, onEdit, onDelete }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    id, 
    title, 
    date, 
    time,
    participants = [], 
    type = 'video',
    platform = 'jizira',
    description,
    status = 'upcoming',
    meetingUrl
  } = meeting;

  const handleJoin = (e) => {
    e.stopPropagation();
    launchMeeting(meeting, navigate, toast);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(id);
    }
  };

  const getPlatformIcon = () => {
    switch(platform) {
      case 'jizira': return <Zap className="w-3.5 h-3.5 mr-1 text-violet-600 dark:text-violet-400" />;
      case 'zoom': return <Monitor className="w-3.5 h-3.5 mr-1 text-blue-500" />;
      case 'google-meet': return <Users className="w-3.5 h-3.5 mr-1 text-green-500" />;
      case 'microsoft-teams': return <Users className="w-3.5 h-3.5 mr-1 text-indigo-500" />;
      case 'custom': return <LinkIcon className="w-3.5 h-3.5 mr-1" />;
      case 'webrtc': return <Globe className="w-3.5 h-3.5 mr-1" />;
      case 'internal': 
      default: return <Video className="w-3.5 h-3.5 mr-1" />;
    }
  };

  const getStatusColor = () => {
    if (status === 'completed') return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
    if (status === 'cancelled') return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
    return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
  };

  const isExternal = EXTERNAL_URL_PLATFORMS.includes(platform);

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      <Card 
        className={cn(
          "h-full overflow-hidden transition-all duration-300 border bg-white dark:bg-slate-900 group cursor-pointer flex flex-col",
          isSelected 
            ? "border-violet-500 ring-1 ring-violet-500 shadow-lg shadow-violet-500/10" 
            : "border-slate-200 dark:border-slate-800 hover:shadow-xl hover:border-violet-200 dark:hover:border-violet-800",
          platform === 'jizira' && !isSelected && "border-l-4 border-l-violet-500"
        )}
        onClick={() => onView(id)}
      >
        <div className="p-5 flex flex-col h-full">
          {/* Header */}
          <div className="flex justify-between items-start mb-3">
            <div className="space-y-2 flex-1 mr-2">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className={cn("uppercase text-[10px] font-bold tracking-wider", getStatusColor())}>
                   {status}
                </Badge>
                <Badge variant="outline" className={cn("text-[10px] font-medium border-slate-200 dark:border-slate-700 flex items-center w-fit", platform === 'jizira' && "bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 border-violet-100 dark:border-violet-800")}>
                  {getPlatformIcon()} {getPlatformLabel(platform)}
                </Badge>
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight group-hover:text-violet-600 transition-colors">
                {title || 'Untitled Meeting'}
              </h3>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(id); }}>
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(id); }}>
                  <Edit className="w-3.5 h-3.5 mr-2" /> Edit Meeting
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                  <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Details */}
          <div className="space-y-3 mb-4 flex-1">
            <div className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300">
              <Calendar className="w-4 h-4 mr-2.5 text-violet-500" />
              {formatMeetingDateTime(date, time)}
            </div>
            
            {description && (
              <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 pl-7">
                {description}
              </p>
            )}

            {isExternal && meetingUrl && (
              <div className="pl-7 mt-2">
                 <a 
                   href={meetingUrl} 
                   target="_blank" 
                   rel="noreferrer" 
                   className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center truncate max-w-full"
                   onClick={(e) => e.stopPropagation()}
                 >
                   <LinkIcon className="w-3 h-3 mr-1 flex-shrink-0" />
                   {meetingUrl}
                 </a>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 mt-auto">
             <div className="flex items-center gap-2">
               <div className="flex -space-x-2">
                 {participants.slice(0,3).map((p, i) => (
                   <div key={i} className="w-7 h-7 rounded-full bg-slate-200 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-bold text-slate-600 overflow-hidden" title={typeof p === 'string' ? p : p.name}>
                     {typeof p === 'string' ? p.charAt(0).toUpperCase() : (p.avatar ? <img src={p.avatar} alt="User" /> : p.name?.[0])}
                   </div>
                 ))}
                 {participants.length > 3 && (
                   <div className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-bold text-slate-500">
                     +{participants.length - 3}
                   </div>
                 )}
               </div>
               {participants.length > 0 && (
                 <span className="text-xs text-slate-500">{participants.length} Participant{participants.length !== 1 ? 's' : ''}</span>
               )}
               {participants.length === 0 && <span className="text-xs text-slate-400 italic">No participants</span>}
             </div>

            <Button 
              size="sm" 
              className={cn(
                "rounded-full px-4 shadow-md transition-all duration-300",
                platform === 'jizira' 
                  ? "bg-violet-600 hover:bg-violet-700 text-white shadow-violet-200 dark:shadow-none" 
                  : "bg-slate-900 hover:bg-slate-800 text-white"
              )}
              onClick={handleJoin}
            >
              {isExternal ? 'Launch' : 'Join'}
              {isExternal && <ExternalLink className="w-3 h-3 ml-2" />}
              {platform === 'jizira' && <Zap className="w-3 h-3 ml-2" />}
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default MeetingCard;
