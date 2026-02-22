
import React, { useState, useEffect } from 'react';
import { Plus, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { localMeetingsStorageService } from '@/services/localMeetingsStorageService';
import { generateMeetingId, copyToClipboard, generateMeetingLink } from '@/utils/meetingUtils';
import { motion, AnimatePresence } from 'framer-motion';

// Components
import InstantMeetingSection from '@/components/meetings/InstantMeetingSection';
import MeetingListItem from '@/components/meetings/MeetingListItem';
import MeetingDetailsPanel from '@/components/meetings/MeetingDetailsPanel';
import NewMeetingDialog from '@/components/meetings/NewMeetingDialog';
import MeetingSearchBar from '@/components/meetings/MeetingSearchBar';

const MeetingsManagementPage = () => {
  const { toast } = useToast();
  const [meetings, setMeetings] = useState([]);
  const [filteredMeetings, setFilteredMeetings] = useState([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load meetings on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      // Simulate slight delay for professional loading feel
      await new Promise(r => setTimeout(r, 500));
      
      const loadedMeetings = localMeetingsStorageService.getAllMeetings();
      // Sort by createdAt descending
      const sorted = loadedMeetings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setMeetings(sorted);
      setFilteredMeetings(sorted);
      
      if (sorted.length > 0 && !selectedMeetingId) {
        setSelectedMeetingId(sorted[0].id);
      }
      setIsLoading(false);
    };
    loadData();
  }, []);

  const selectedMeeting = meetings.find(m => m.id === selectedMeetingId);

  const handleSearch = (query) => {
    if (!query) {
      setFilteredMeetings(meetings);
      return;
    }
    const lower = query.toLowerCase();
    const filtered = meetings.filter(m => 
      m.title.toLowerCase().includes(lower) || 
      m.id.toLowerCase().includes(lower)
    );
    setFilteredMeetings(filtered);
  };

  const handleCreateMeeting = async (meetingData) => {
    const result = await localMeetingsStorageService.createMeeting(meetingData);
    if (result.success) {
      const updatedList = [result.data, ...meetings];
      setMeetings(updatedList);
      setFilteredMeetings(updatedList);
      setSelectedMeetingId(result.data.id);
      
      toast({
        title: "Meeting Created",
        description: `"${result.data.title}" has been scheduled successfully.`
      });
    } else {
      toast({
        variant: "destructive",
        title: "Creation Failed",
        description: "Could not create meeting. Please try again."
      });
    }
  };

  const handleDeleteMeeting = async (meeting) => {
    if (window.confirm(`Are you sure you want to delete "${meeting.title}"? This action cannot be undone.`)) {
      await localMeetingsStorageService.deleteMeeting(meeting.id);
      const updated = meetings.filter(m => m.id !== meeting.id);
      setMeetings(updated);
      setFilteredMeetings(updated);
      
      if (selectedMeetingId === meeting.id) {
        setSelectedMeetingId(updated.length > 0 ? updated[0].id : null);
      }
      
      toast({ 
        title: "Meeting Deleted", 
        description: "The meeting has been permanently removed.",
        variant: "destructive"
      });
    }
  };

  // Action Handlers
  const handleStart = (m) => {
    toast({ 
      title: "Connecting...", 
      description: `Starting session for ${m.title}` 
    });
    // Add navigation logic here
  };

  const handleEmbed = (m) => {
    const code = `<iframe src="${window.location.origin}/embed/${m.id}" width="100%" height="500px"></iframe>`;
    copyToClipboard(code);
    toast({ title: "Embed Code Copied", description: "Paste this code into your website." });
  };

  const handleInvite = (m) => {
    toast({ title: "Invite Participants", description: "Invitation dialog feature coming soon." });
  };

  const handleEdit = (m) => {
    toast({ title: "Edit Meeting", description: "Edit functionality coming soon." });
  };

  // Instant Meeting Handlers
  const handleInstantStart = async () => {
    const id = generateMeetingId();
    const meetingData = {
      id,
      title: 'Quick Instant Meeting',
      description: 'Instant session started from dashboard',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    await handleCreateMeeting(meetingData);
    handleStart(meetingData);
  };

  const handleInstantCopy = async () => {
    const id = generateMeetingId(); // Generate a new ID just for the link
    const link = generateMeetingLink(id);
    await copyToClipboard(link);
    toast({ title: "Link Copied", description: "New instant meeting link copied to clipboard." });
  };

  const handleInstantJoin = (id) => {
    toast({ title: "Joining Meeting", description: `Connecting to session ID: ${id}...` });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-slate-950 dark:to-slate-900 p-4 lg:p-8 font-sans text-gray-900 dark:text-gray-100">
      <div className="max-w-[1400px] mx-auto space-y-8">
        
        {/* Top Header Section */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 pb-6 border-b border-gray-200 dark:border-slate-800">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-2">My Meetings</h1>
            <div className="flex items-center gap-4">
               <p className="text-gray-500 dark:text-gray-400 text-sm">Manage, schedule, and join your secure video sessions.</p>
               <Button 
                onClick={() => setIsDialogOpen(true)}
                className="bg-violet-600 hover:bg-violet-700 text-white rounded-full shadow-lg shadow-violet-500/20 px-6 py-2 h-9 text-sm font-medium transition-transform hover:scale-105 active:scale-95"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Meeting
              </Button>
            </div>
          </div>

          <div className="w-full xl:w-auto">
            <InstantMeetingSection 
              onStart={handleInstantStart}
              onCopyLink={handleInstantCopy}
              onJoin={handleInstantJoin}
            />
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[600px]">
          
          {/* Left Sidebar - List */}
          <div className="lg:col-span-4 xl:col-span-3 flex flex-col space-y-4">
            <div className="sticky top-0 bg-transparent z-10 pb-2">
              <MeetingSearchBar onSearch={handleSearch} />
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 -mr-1 max-h-[calc(100vh-280px)]">
              {isLoading ? (
                <div className="space-y-3 p-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="h-24 bg-gray-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : filteredMeetings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-dashed border-gray-300 dark:border-slate-700 shadow-sm mx-1">
                  <div className="bg-gray-50 dark:bg-slate-800 p-3 rounded-full mb-3">
                    <List className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 font-medium text-sm">No meetings found</p>
                  <Button variant="link" onClick={() => setIsDialogOpen(true)} className="text-violet-600 text-xs mt-1">
                    Create your first meeting
                  </Button>
                </div>
              ) : (
                <AnimatePresence>
                  {filteredMeetings.map(meeting => (
                    <MeetingListItem 
                      key={meeting.id}
                      meeting={meeting}
                      isSelected={selectedMeetingId === meeting.id}
                      onClick={(m) => setSelectedMeetingId(m.id)}
                    />
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>

          {/* Right Panel - Details */}
          <div className="lg:col-span-8 xl:col-span-9 h-[calc(100vh-280px)] sticky top-0">
             <motion.div 
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ duration: 0.4 }}
               className="h-full"
             >
                <MeetingDetailsPanel 
                  meeting={selectedMeeting}
                  onStart={handleStart}
                  onEmbed={handleEmbed}
                  onInvite={handleInvite}
                  onEdit={handleEdit}
                  onDelete={handleDeleteMeeting}
                />
             </motion.div>
          </div>
        </div>
      </div>

      <NewMeetingDialog 
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onCreate={handleCreateMeeting}
      />
    </div>
  );
};

export default MeetingsManagementPage;
