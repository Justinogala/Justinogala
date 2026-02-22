
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Sparkles, FileText } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Header from '@/components/Header';
import ProcessingStatus from '@/components/ProcessingStatus';
import SummaryDisplay from '@/components/SummaryDisplay';
import { createSummarizationJob, pollSummarizationStatus } from '@/services/summarizationJobHandler';
import PageTransition from '@/components/PageTransition';
import AnimatedHeroBackground from '@/components/AnimatedHeroBackground';

// Mock data for existing transcripts - normally fetched from localStorage or DB
const getStoredTranscripts = () => {
  // In a real app, fetch from transcriptionJobHandler storage or DB
  // For demo, we check if there are any jobs in localStorage, otherwise return dummy
  try {
    const jobs = JSON.parse(localStorage.getItem('munal_transcription_jobs') || '{}');
    const completed = Object.values(jobs).filter(j => j.status === 'completed');
    if (completed.length > 0) return completed;
  } catch (e) {}
  
  return [
    { jobId: 'mock-1', fileName: 'Weekly Sync.mp3', transcript: { text: "This is a mock transcript of a weekly sync meeting..." } },
    { jobId: 'mock-2', fileName: 'Product Roadmap Q3.mp4', transcript: { text: "Discussion about Q3 goals and features..." } },
  ];
};

const SummarizationPage = () => {
  const { toast } = useToast();
  const [transcripts, setTranscripts] = useState([]);
  const [selectedTranscriptId, setSelectedTranscriptId] = useState('');
  const [activeJobId, setActiveJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const [summaryData, setSummaryData] = useState(null);

  useEffect(() => {
    setTranscripts(getStoredTranscripts());
  }, []);

  useEffect(() => {
    let interval;
    if (activeJobId && (!jobStatus || jobStatus.status === 'pending' || jobStatus.status === 'processing')) {
      interval = setInterval(() => {
        const status = pollSummarizationStatus(activeJobId);
        setJobStatus(status);
        
        if (status?.status === 'completed') {
          setSummaryData({
            summary: status.summary,
            keyPoints: status.keyPoints,
            actionItems: status.actionItems
          });
          toast({ title: "Summarization Complete", description: "AI has finished analyzing the transcript." });
          setActiveJobId(null);
        } else if (status?.status === 'failed') {
          setActiveJobId(null);
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [activeJobId, jobStatus, toast]);

  const handleStartSummarization = () => {
    if (!selectedTranscriptId) {
      toast({ variant: "destructive", title: "Selection Required", description: "Please select a transcript to summarize." });
      return;
    }

    const selected = transcripts.find(t => t.jobId === selectedTranscriptId);
    if (!selected) return;

    const jobId = createSummarizationJob(selectedTranscriptId, selected.transcript.text);
    setActiveJobId(jobId);
    setJobStatus({ status: 'pending', createdAt: new Date() });
    setSummaryData(null);
  };

  const handleRetry = () => handleStartSummarization();
  
  const handleCancel = () => {
    setActiveJobId(null);
    setJobStatus(null);
    toast({ title: "Cancelled", description: "Summarization cancelled." });
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-bg-secondary flex flex-col">
        <Helmet>
          <title>AI Summarization - Munal</title>
          <meta name="description" content="Generate concise summaries, action items, and key points from transcripts." />
        </Helmet>
        
        <Header />
        
        <div className="flex-grow relative">
          <AnimatedHeroBackground gradientFrom="from-purple-900/10" gradientTo="to-pink-900/10" />
          
          <div className="container mx-auto px-4 py-16 max-w-5xl relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-600">
                Meeting Intelligence
              </h1>
              <p className="text-xl text-text-secondary max-w-2xl mx-auto">
                Instantly extract summaries, key takeaways, and action items from your meeting transcripts using GPT-4.
              </p>
            </motion.div>

            <div className="grid gap-8">
              {/* Selection Section */}
              {!summaryData && !activeJobId && (
                <Card className="border border-border bg-card/50 backdrop-blur-sm shadow-xl">
                  <CardContent className="p-8">
                    <div className="max-w-xl mx-auto space-y-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-text-primary flex items-center gap-2">
                          <FileText className="w-4 h-4 text-purple-500" />
                          Select Transcript
                        </label>
                        <Select value={selectedTranscriptId} onValueChange={setSelectedTranscriptId}>
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Choose a meeting transcript..." />
                          </SelectTrigger>
                          <SelectContent>
                            {transcripts.map((t) => (
                              <SelectItem key={t.jobId} value={t.jobId}>
                                {t.fileName || `Meeting ${t.jobId.slice(0,8)}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <Button 
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg h-12 text-lg"
                        onClick={handleStartSummarization}
                        disabled={!selectedTranscriptId}
                      >
                        <Sparkles className="w-5 h-5 mr-2" />
                        Generate AI Summary
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Status Section */}
              {activeJobId && jobStatus && (
                <ProcessingStatus 
                  status={jobStatus.status}
                  startTime={jobStatus.createdAt}
                  error={jobStatus.error}
                  onRetry={handleRetry}
                  onCancel={handleCancel}
                />
              )}

              {/* Results Section */}
              {summaryData && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-text-primary">Analysis Results</h2>
                    <Button variant="outline" onClick={() => {
                      setSummaryData(null);
                      setJobStatus(null);
                      setActiveJobId(null);
                    }}>
                      Summarize Another
                    </Button>
                  </div>
                  <SummaryDisplay summaryData={summaryData} />
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default SummarizationPage;
