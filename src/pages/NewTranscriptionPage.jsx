
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ShieldCheck, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { transcriptionHistoryService } from '@/services/transcriptionHistoryService';
import PageTransition from '@/components/PageTransition';
import TranscriptionUploadComponent from '@/components/TranscriptionUploadComponent';
import TranscriptDisplay from '@/components/TranscriptDisplay';
import { useAuth } from '@/context/AuthContext';

/**
 * Unified New Transcription Page using Munal AI Whisper
 */
const NewTranscriptionPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [result, setResult] = useState(null);

  // Called when TranscriptionUploadComponent finishes successfully
  const handleCompletion = (data) => {
    // Data is already saved by the upload component, but we store it in state for editing
    setResult(data);
    toast({ 
      title: "Success", 
      description: "Processing complete. Review your transcription below." 
    });
  };

  const handleSave = async (editedText) => {
    if (!result) return;
    
    try {
      // Prepare the update object. We preserve original metadata and update the text.
      const updatedData = {
        ...result,
        text: editedText || result.text,
        transcribedText: editedText || result.transcribedText,
        // Ensure critical metadata fields are present for history display
        status: 'Completed',
        uploadDate: result.uploadDate || new Date().toISOString(),
        duration: result.duration,
        fileName: result.fileName,
        fileSize: result.fileSize
      };

      // Save/Update in history
      transcriptionHistoryService.saveTranscription(user?.id || 'default', updatedData);
      
      toast({ title: "Saved", description: "Transcription saved to history." });
      
      // Navigate after a brief delay to allow toast to be seen
      setTimeout(() => {
        navigate('/transcriptions');
      }, 500);
      
    } catch (error) {
      console.error(error);
      toast({ 
        title: "Error", 
        description: "Failed to save changes.", 
        variant: "destructive" 
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Helmet>
        <title>New Transcription | Munal</title>
      </Helmet>

      <PageTransition>
        <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
          <div className="flex items-center gap-4 mb-8">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/transcriptions')}
              className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">New Transcription</h1>
              <p className="text-gray-500 text-sm">High-accuracy transcription powered by Munal AI Whisper.</p>
            </div>
          </div>

          {!result ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-6">
                <Card className="border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                  <CardContent className="p-6">
                    <h2 className="text-lg font-semibold mb-4">Upload Audio File</h2>
                    <TranscriptionUploadComponent onTranscriptionComplete={handleCompletion} />
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30">
                  <CardContent className="p-6 space-y-4">
                    <h3 className="font-semibold text-emerald-900 dark:text-emerald-100 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-emerald-600" />
                      Munal AI Powered
                    </h3>
                    <p className="text-sm text-emerald-800 dark:text-emerald-200/80">
                      We use state-of-the-art Whisper model for accurate speech recognition and multilingual support.
                    </p>
                    <div className="text-xs text-emerald-700 pt-2 border-t border-emerald-200 dark:border-emerald-800">
                      Supports: MP3, M4A, WAV, OGG, WEBM (Max 25MB)
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <TranscriptDisplay 
                transcript={{
                  text: result.transcribedText || result.text,
                  ...result
                }} 
                onSave={handleSave} 
                metadata={{
                  duration: result.duration,
                  language: result.language
                }}
              />
              <div className="flex justify-end gap-3">
                 <Button variant="outline" onClick={() => setResult(null)}>Discard & Start Over</Button>
                 <Button onClick={() => handleSave(result.transcribedText || result.text)} className="bg-indigo-600 hover:bg-indigo-700">Save & Finish</Button>
              </div>
            </div>
          )}
        </div>
      </PageTransition>
    </div>
  );
};

export default NewTranscriptionPage;
