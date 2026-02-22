
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, FileText, ListTodo, BrainCircuit, Globe } from 'lucide-react';
import { validateShareToken, logShareAccess } from '@/services/sharingService';
import TranscriptViewer from '@/components/TranscriptViewer';
import SummarySection from '@/components/SummarySection';
import ActionItemsSection from '@/components/ActionItemsSection';
import InsightsSection from '@/components/InsightsSection';

const SharedMeetingPage = () => {
  const { shareToken } = useParams();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSharedMeeting = async () => {
      try {
        setLoading(true);
        // Validate token and fetch data
        const { valid, data, error } = await validateShareToken(shareToken);

        if (!valid) {
          setError(error || 'This link is invalid or has expired.');
          setLoading(false);
          return;
        }

        const meetingData = data.meetings;
        setMeeting(meetingData);
        
        // Log access
        logShareAccess(data.id);
        
      } catch (err) {
        setError('Failed to load meeting.');
      } finally {
        setLoading(false);
      }
    };

    fetchSharedMeeting();
  }, [shareToken]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <Globe className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Unavailable</h1>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{meeting.title} - Shared EchoNote AI</title>
      </Helmet>
      
      <div className="min-h-screen bg-slate-950">
        <header className="bg-slate-900 border-b border-white/10 p-4 sticky top-0 z-50">
          <div className="container mx-auto flex justify-between items-center">
             <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">E</span>
                </div>
                <span className="text-xl font-bold text-white">EchoNote AI</span>
             </div>
             <Badge variant="outline" className="border-indigo-500/50 text-indigo-400">
               <Globe className="w-3 h-3 mr-1" />
               Public Read-Only View
             </Badge>
          </div>
        </header>
        
        <main className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 p-8 rounded-2xl border border-white/10">
              <h1 className="text-3xl font-bold text-white mb-4">{meeting.title}</h1>
              <div className="flex flex-wrap items-center gap-6 text-gray-300">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {new Date(meeting.created_at).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {meeting.duration ? `${Math.floor(meeting.duration/60)}:${(meeting.duration%60).toString().padStart(2, '0')}` : '--:--'}
                </div>
              </div>
            </div>

            {/* Content Tabs */}
            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-slate-900/50 p-1 mb-8">
                <TabsTrigger value="summary">
                  <FileText className="w-4 h-4 mr-2" /> Summary
                </TabsTrigger>
                <TabsTrigger value="transcript">
                  <FileText className="w-4 h-4 mr-2" /> Transcript
                </TabsTrigger>
                <TabsTrigger value="actions">
                  <ListTodo className="w-4 h-4 mr-2" /> Action Items
                </TabsTrigger>
                <TabsTrigger value="insights">
                  <BrainCircuit className="w-4 h-4 mr-2" /> Insights
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
            </Tabs>
          </div>
        </main>
      </div>
    </>
  );
};

export default SharedMeetingPage;
