
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { ArrowLeft, Save } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import TranscriptionUploadComponent from '@/components/TranscriptionUploadComponent';
import TranscriptDisplay from '@/components/TranscriptDisplay';
import PageTransition from '@/components/PageTransition';
import { transcriptionHistoryService } from '@/services/transcriptionHistoryService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const TranscriptionPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [result, setResult] = useState(null);

  const handleCompletion = (data) => {
    setResult(data);
    toast({ 
      title: "Success", 
      description: "Transcription completed successfully." 
    });
  };

  const handleSave = (editedText) => {
    if (!result || !user) return;
    
    try {
      transcriptionHistoryService.saveTranscription(user.id, {
        ...result,
        text: editedText || result.text,
        status: 'Completed',
        timestamp: new Date().toISOString()
      });
      
      toast({ title: "Saved", description: "Transcription saved to history." });
      navigate('/transcriptions');
    } catch (error) {
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: "Failed to save to history." 
      });
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-6">
        <Helmet>
          <title>New Transcription - Munal</title>
        </Helmet>
        
        <div className="container mx-auto max-w-4xl space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate('/transcriptions')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                New Transcription
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                AI-powered transcription using AssemblyAI
              </p>
            </div>
          </div>

          {!result ? (
            <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 shadow-sm">
              <CardContent className="p-8">
                <TranscriptionUploadComponent 
                  onTranscriptionComplete={handleCompletion} 
                />
              </CardContent>
            </Card>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Results</h2>
                <div className="flex gap-2">
                   <Button variant="outline" onClick={() => setResult(null)}>
                     Transcribe Another
                   </Button>
                   <Button onClick={() => handleSave(result.text)} className="bg-green-600 hover:bg-green-700 text-white">
                     <Save className="w-4 h-4 mr-2" /> Save to History
                   </Button>
                </div>
              </div>

              <TranscriptDisplay 
                transcript={result} 
                onSave={handleSave}
                metadata={{
                  duration: result.audio_duration,
                  language: result.language_code
                }}
              />
            </motion.div>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default TranscriptionPage;
