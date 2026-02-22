
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { FileText, Clock, BarChart, ShieldCheck } from 'lucide-react';
import PageTransition from '@/components/PageTransition';
import TranscriptionsList from '@/components/TranscriptionsList';
import TranscriptionEditor from '@/components/TranscriptionEditor';
import { transcriptionService } from '@/services/transcriptionService';
import { meetingService } from '@/services/meetingService';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import UploadButton from '@/components/upload/UploadButton';
import NewMeetingButton from '@/components/meetings/NewMeetingButton';
import UploadModal from '@/components/upload/UploadModal';
import NewMeetingModal from '@/components/meetings/NewMeetingModal';
import { useToast } from '@/components/ui/use-toast';

const TranscriptionsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [editingItem, setEditingItem] = useState(null);
  const [stats, setStats] = useState({ total: 0, duration: '0h', lastDate: '-' });
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Modal States
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isNewMeetingOpen, setIsNewMeetingOpen] = useState(false);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const all = await transcriptionService.getAllTranscriptions();
        const total = all.length;
        setStats({
          total,
          duration: `${Math.floor(total * 45 / 60)}h ${total * 45 % 60}m`, 
          lastDate: all.length > 0 ? new Date(all[0].date || all[0].uploadDate).toLocaleDateString() : '-'
        });
      } catch (e) {
        console.error("Failed to load stats", e);
      }
    };
    loadStats();
  }, [refreshTrigger]);

  const handleEdit = (item) => {
    setEditingItem(item);
  };

  const handleCloseEditor = () => {
    setEditingItem(null);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleUploadComplete = async (file) => {
    // In a real app, useFileUpload handles the upload logic and returns the file object
    // Here we might need to actually process it through transcriptionService if simulating
    try {
      const transcriptionData = await transcriptionService.createTranscription(file, { title: file.name });
      await transcriptionService.saveTranscription(transcriptionData);
      
      toast({
        title: "Upload Successful",
        description: `${file.name} has been added to your transcriptions.`,
      });
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Processing Failed",
        description: "Could not create transcription entry.",
      });
    }
  };

  const handleCreateMeeting = async (meetingData) => {
    try {
      await meetingService.createMeeting(meetingData);
      toast({
        title: "Meeting Scheduled",
        description: `"${meetingData.title}" has been scheduled for ${meetingData.date}.`,
      });
      // Optionally refresh a meeting list if it were on this page
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to schedule meeting.",
      });
    }
  };

  if (editingItem) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col">
        <Helmet>
          <title>Edit: {editingItem.title} | Munal</title>
        </Helmet>
        <main className="flex-grow p-4 lg:p-6">
           <TranscriptionEditor 
             transcription={editingItem} 
             onClose={handleCloseEditor}
             onUpdate={(updated) => setEditingItem(updated)}
           />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Helmet>
        <title>Transcriptions | Munal</title>
      </Helmet>
      
      <PageTransition>
        <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Transcriptions</h1>
              <p className="text-gray-500 mt-1">Manage and edit your meeting recordings.</p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
               <Badge variant="outline" className="hidden md:flex items-center gap-1 border-indigo-200 text-indigo-700 bg-indigo-50 h-8 mr-2">
                  <ShieldCheck className="w-3 h-3"/> Configured Services
               </Badge>
               <div className="flex gap-3 w-full sm:w-auto">
                 <UploadButton onClick={() => setIsUploadOpen(true)} className="flex-1 sm:flex-none" />
                 <NewMeetingButton onClick={() => setIsNewMeetingOpen(true)} className="flex-1 sm:flex-none" />
               </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-4 transition-transform hover:scale-[1.01]">
               <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600">
                 <FileText className="w-6 h-6" />
               </div>
               <div>
                 <p className="text-sm text-gray-500">Total Transcriptions</p>
                 <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
               </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-4 transition-transform hover:scale-[1.01]">
               <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600">
                 <Clock className="w-6 h-6" />
               </div>
               <div>
                 <p className="text-sm text-gray-500">Total Duration</p>
                 <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.duration}</p>
               </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-4 transition-transform hover:scale-[1.01]">
               <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600">
                 <BarChart className="w-6 h-6" />
               </div>
               <div>
                 <p className="text-sm text-gray-500">Last Activity</p>
                 <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.lastDate}</p>
               </div>
            </div>
          </div>

          {/* List Section */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Your Recordings</h2>
            </div>
            <TranscriptionsList onEdit={handleEdit} key={refreshTrigger} />
          </section>

          {/* Modals */}
          <UploadModal 
            isOpen={isUploadOpen} 
            onClose={() => setIsUploadOpen(false)} 
            onUploadComplete={handleUploadComplete}
          />
          
          <NewMeetingModal 
            isOpen={isNewMeetingOpen} 
            onClose={() => setIsNewMeetingOpen(false)}
            onCreateMeeting={handleCreateMeeting}
          />

        </div>
      </PageTransition>
    </div>
  );
};

export default TranscriptionsPage;
