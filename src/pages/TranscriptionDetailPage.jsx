
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Edit, 
  Trash2, 
  Loader2,
  RefreshCw,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { transcriptionService } from '@/services/transcriptionService';
import TranscriptionExportButton from '@/components/TranscriptionExportButton';
import TranscriptionEditor from '@/components/TranscriptionEditor';
import InsightsSummariesSection from '@/components/insights/InsightsSummariesSection';
import { Separator } from '@/components/ui/separator';

const TranscriptionDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [transcription, setTranscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [savingChanges, setSavingChanges] = useState(false);

  useEffect(() => {
    const fetchTranscription = async () => {
      try {
        const data = await transcriptionService.getTranscriptionById(id);
        if (!data) {
          toast({ title: "Error", description: "Transcription not found", variant: "destructive" });
          navigate('/transcriptions');
          return;
        }
        setTranscription(data);
      } catch (error) {
        console.error(error);
        toast({ title: "Error", description: "Failed to load transcription", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchTranscription();
  }, [id, navigate, toast]);

  const handleDelete = async () => {
    if (confirm('Delete this transcription?')) {
      await transcriptionService.deleteTranscription(id);
      navigate('/transcriptions');
    }
  };

  const handleUpdateText = async (updatedItem) => {
    setSavingChanges(true);
    try {
      await transcriptionService.saveTranscription(updatedItem);
      setTranscription(updatedItem);
      setIsEditing(false);
      toast({ title: "Success", description: "Text updated." });
    } catch (e) {
      toast({ title: "Error", description: "Failed to save updates", variant: "destructive" });
    } finally {
      setSavingChanges(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;

  if (isEditing) {
    return (
      <TranscriptionEditor 
        transcription={transcription}
        onClose={() => setIsEditing(false)}
        onUpdate={handleUpdateText}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-4 md:p-8">
      <Helmet><title>{transcription.title} | Munal</title></Helmet>
      
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
             <Button variant="ghost" onClick={() => navigate('/transcriptions')} className="pl-0 hover:bg-transparent hover:text-indigo-600">
               <ArrowLeft className="w-4 h-4 mr-2" /> Back to History
             </Button>
             {savingChanges && <span className="text-xs text-gray-500 flex items-center"><RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Saving...</span>}
          </div>

          <div className="flex flex-col lg:flex-row justify-between items-start gap-6 bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="space-y-3">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white leading-tight">{transcription.title}</h1>
              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {new Date(transcription.uploadDate).toLocaleDateString()}</span>
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {transcription.duration}</span>
                <Badge variant={transcription.status === 'Completed' ? 'default' : 'secondary'} className="bg-green-100 text-green-700 hover:bg-green-100 border-0">
                  {transcription.status}
                </Badge>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 w-full lg:w-auto">
              <Button variant="outline" onClick={() => setIsEditing(true)}><Edit className="w-4 h-4 mr-2" /> Edit Transcript</Button>
              <TranscriptionExportButton transcription={transcription} />
              <Button variant="ghost" onClick={handleDelete} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 className="w-4 h-4" /></Button>
            </div>
          </div>
        </div>

        {/* Insights & Analysis Section */}
        <InsightsSummariesSection 
          transcriptionText={transcription.transcribedText || transcription.text}
          speakers={transcription.speakers || ['Speaker 1']} 
        />

        <Separator />

        {/* Raw Transcript Display */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-400" />
            Full Transcript
          </h2>
          <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
            <CardContent className="p-6 md:p-8">
              <p className="whitespace-pre-wrap leading-relaxed text-gray-700 dark:text-gray-300 font-normal text-lg">
                {transcription.transcribedText || transcription.text || "No transcript text available."}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TranscriptionDetailPage;
