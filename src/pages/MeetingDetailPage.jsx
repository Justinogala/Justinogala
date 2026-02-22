import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, Calendar, Edit2, FileText, ListTodo, BrainCircuit, MessageSquare, Share2 } from 'lucide-react';
import Header from '@/components/Header';
import TranscriptViewer from '@/components/TranscriptViewer';
import SummarySection from '@/components/SummarySection';
import ActionItemsSection from '@/components/ActionItemsSection';
import InsightsSection from '@/components/InsightsSection';
import ChatPanel from '@/components/ChatPanel';
import ProcessingStatus from '@/components/ProcessingStatus';
import ExportButton from '@/components/ExportButton';
import ShareModal from '@/components/ShareModal';
import { useToast } from '@/components/ui/use-toast';
import { getMeetingById } from '@/services/supabaseService';

const MeetingDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const { toast } = useToast();

  const fetchMeeting = async () => {
    try {
      const data = await getMeetingById(id);
      setMeeting(data);
    } catch (error) {
      console.error('Error loading meeting:', error);
      toast({
        title: "Error",
        description: "Meeting not found or deleted",
        variant: "destructive"
      });
      setTimeout(() => navigate('/dashboard'), 1500);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeeting();
    // Removed Supabase subscription
  }, [id]);

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;
  if (!meeting) return null;

  // Adapt database fields to UI component expectations
  const mappedMeeting = {
    ...meeting,
    actionItems: meeting.action_items,
    createdAt: meeting.created_at,
    processingStep: meeting.status === 'processing' ? 'transcribing' : 'completed',
    progress: meeting.status === 'completed' ? 100 : 50 
  };

  return (
    <>
      <Helmet>
        <title>{meeting.title} - EchoNote AI</title>
      </Helmet>
      
      <div className="min-h-screen bg-slate-950">
        <Header />
        
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={() => navigate('/dashboard')} className="pl-0 hover:pl-2 transition-all">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            
            <div className="flex gap-2">
              <ExportButton meeting={mappedMeeting} />
              <Button onClick={() => setShareModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>

          {meeting.status === 'processing' ? (
             <div className="max-w-3xl mx-auto mt-12">
               <ProcessingStatus 
                 status="transcribing"
                 progress={50}
               />
               <p className="text-center text-gray-500 mt-4">Processing in background...</p>
             </div>
          ) : (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                    {meeting.title}
                  </h1>
                  <div className="flex items-center gap-4 text-gray-400 text-sm">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(meeting.created_at).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {meeting.duration ? `${Math.floor(meeting.duration/60)}:${(meeting.duration%60).toString().padStart(2, '0')}` : '--:--'}
                    </span>
                    <Badge variant="outline" className="capitalize bg-green-500/10 text-green-400 border-green-500/30">
                      {meeting.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Content Tabs */}
              <Tabs defaultValue="summary" className="w-full">
                <TabsList className="grid w-full grid-cols-5 bg-slate-900/50 p-1 mb-8">
                  <TabsTrigger value="summary">
                    <FileText className="w-4 h-4 mr-2" /> Summary
                  </TabsTrigger>
                  <TabsTrigger value="transcript">
                    <Edit2 className="w-4 h-4 mr-2" /> Transcript
                  </TabsTrigger>
                  <TabsTrigger value="actions">
                    <ListTodo className="w-4 h-4 mr-2" /> Action Items
                  </TabsTrigger>
                  <TabsTrigger value="insights">
                    <BrainCircuit className="w-4 h-4 mr-2" /> Insights
                  </TabsTrigger>
                  <TabsTrigger value="chat">
                    <MessageSquare className="w-4 h-4 mr-2" /> AI Chat
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="summary" className="min-h-[500px]">
                  <SummarySection 
                    summary={meeting.summary || { overview: 'No summary available.', keyPoints: [], outcomes: [] }} 
                  />
                </TabsContent>

                <TabsContent value="transcript" className="h-[700px]">
                  <TranscriptViewer segments={meeting.transcript?.segments || []} />
                </TabsContent>

                <TabsContent value="actions">
                  <ActionItemsSection actionItems={meeting.action_items || []} />
                </TabsContent>

                <TabsContent value="insights">
                  <InsightsSection insights={meeting.insights} />
                </TabsContent>

                <TabsContent value="chat">
                  <ChatPanel apiKey={import.meta.env.VITE_OPENAI_API_KEY} />
                </TabsContent>
              </Tabs>
            </div>
          )}
        </main>
        
        <ShareModal 
          isOpen={shareModalOpen} 
          onClose={() => setShareModalOpen(false)} 
          meetingId={meeting.id} 
        />
      </div>
    </>
  );
};

export default MeetingDetailPage;