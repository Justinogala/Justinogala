
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Clock, Share2, Download, Trash2, Video, Monitor, ExternalLink, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import MeetingPlayer from './MeetingPlayer';
import MeetingNotes from './MeetingNotes';
import { localMeetingsStorageService } from '@/services/localMeetingsStorageService';
import { launchMeeting, getPlatformLabel } from '@/utils/VideoConferencingLauncher';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { EXTERNAL_URL_PLATFORMS } from '@/config/videoConferencingConfig';

const MeetingDetails = ({ meetingId, onBack, onDelete }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [videoUrl, setVideoUrl] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const data = localMeetingsStorageService.getMeetingById(meetingId);
      if (data) {
        setMeeting(data);
        if (data.hasRecording) {
          const url = await localMeetingsStorageService.getRecordingUrl(meetingId);
          setVideoUrl(url);
        }
      }
      setLoading(false);
    };
    loadData();
  }, [meetingId]);

  const handleSaveNotes = async (newNotes) => {
    if (meeting) {
      const updated = { ...meeting, notes: newNotes };
      await localMeetingsStorageService.saveMeeting(updated);
      setMeeting(updated);
    }
  };

  const handleLaunch = () => {
    if (meeting) {
      launchMeeting(meeting, navigate, toast);
    }
  };

  if (loading) return <div className="p-10 text-center">Loading meeting details...</div>;
  if (!meeting) return <div className="p-10 text-center">Meeting not found</div>;
  
  const isExternal = EXTERNAL_URL_PLATFORMS.includes(meeting.platform);

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              {meeting.title}
              <Badge variant="outline" className={`text-xs font-normal ${meeting.platform === 'jizira' ? 'bg-violet-50 text-violet-700 border-violet-200' : ''}`}>
                {getPlatformLabel(meeting.platform)}
              </Badge>
            </h1>
            <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
              <span className="flex items-center"><Calendar className="w-3.5 h-3.5 mr-1" /> {meeting.date}</span>
              <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1" /> {meeting.duration || 0} min</span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={handleLaunch} className={`${meeting.platform === 'jizira' ? 'bg-violet-600 hover:bg-violet-700 shadow-md shadow-violet-500/20' : 'bg-slate-900 hover:bg-slate-800'} text-white`}>
            {!isExternal ? (
               <>{meeting.platform === 'jizira' ? <Zap className="w-4 h-4 mr-2" /> : <Video className="w-4 h-4 mr-2" />} Join Meeting</>
            ) : (
               <>{meeting.platform === 'jizira' ? <Zap className="w-4 h-4 mr-2" /> : <Monitor className="w-4 h-4 mr-2" />} Launch {meeting.platform === 'jizira' ? 'Jizira' : 'External'}</>
            )}
          </Button>
          
          <Button variant="outline" size="sm">
            <Share2 className="w-4 h-4 mr-2" /> Share
          </Button>
          {videoUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={videoUrl} download={`${meeting.title}.mp4`}>
                <Download className="w-4 h-4 mr-2" /> Download
              </a>
            </Button>
          )}
          <Button variant="destructive" size="sm" onClick={() => onDelete(meeting.id)}>
            <Trash2 className="w-4 h-4 mr-2" /> Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Main Content Area (Player or Info) */}
        <div className="lg:col-span-2 space-y-4 flex flex-col">
          {videoUrl ? (
            <MeetingPlayer src={videoUrl} />
          ) : (
            <div className="w-full aspect-video bg-slate-100 dark:bg-slate-800 rounded-xl flex flex-col items-center justify-center text-slate-400 p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-700">
              {isExternal ? (
                <>
                  {meeting.platform === 'jizira' ? (
                     <Zap className="w-12 h-12 mb-4 opacity-50 text-violet-500" />
                  ) : (
                     <ExternalLink className="w-12 h-12 mb-4 opacity-50" />
                  )}
                  <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-300 mb-2">
                    {meeting.platform === 'jizira' ? 'Jizira Conference' : 'External Meeting'}
                  </h3>
                  <p className="max-w-md">
                    This meeting is hosted on {getPlatformLabel(meeting.platform)}. 
                    Click the launch button above to join.
                  </p>
                  {meeting.meetingUrl && (
                    <div className="mt-4 p-2 bg-slate-200 dark:bg-slate-700 rounded text-xs break-all max-w-full text-slate-500">
                      <span className="font-semibold block mb-1 uppercase text-[10px] tracking-wider text-slate-400">Meeting Link</span>
                      {meeting.meetingUrl}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <Video className="w-12 h-12 mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-300 mb-2">Internal Meeting</h3>
                  <p className="max-w-md mb-4">
                    Ready to connect? Click the Join button above to start your secure session.
                  </p>
                  <p className="text-sm text-slate-400">No recording available yet.</p>
                </>
              )}
            </div>
          )}
          
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border shadow-sm">
            <h3 className="font-semibold mb-3">Participants</h3>
            <div className="flex flex-wrap gap-2">
              {meeting.participants?.map((p, i) => (
                <Badge key={i} variant="secondary">{p}</Badge>
              )) || <span className="text-slate-500 text-sm">No participants listed</span>}
            </div>
          </div>
        </div>

        {/* Sidebar (Notes) */}
        <div className="lg:col-span-1 h-full">
           <MeetingNotes notes={meeting.notes} onSave={handleSaveNotes} />
        </div>
      </div>
    </div>
  );
};

export default MeetingDetails;
