
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { HardDrive, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import AudioUpload from '@/components/AudioUpload';
import VideoUpload from '@/components/VideoUpload';
import DocumentUpload from '@/components/DocumentUpload';
import FileList from '@/components/FileList';
import FilePreview from '@/components/FilePreview';
import FileDetailsModal from '@/components/FileDetailsModal';
import RecordingTranscriptViewer from '@/components/RecordingTranscriptViewer';
import { fileService } from '@/services/fileService';
import PageTransition from '@/components/PageTransition';

const FileManagementPage = () => {
  const { toast } = useToast();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPreviewFile, setSelectedPreviewFile] = useState(null);
  const [selectedDetailFile, setSelectedDetailFile] = useState(null);
  const [transcriptFile, setTranscriptFile] = useState(null);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const result = await fileService.listFiles({});
      if (result.success) {
        setFiles(result.data);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load files"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleUploadComplete = (newFiles) => {
    toast({
      title: "Upload Successful",
      description: `${newFiles.length} file(s) uploaded successfully`
    });
    fetchFiles();
  };

  const handleDelete = async (fileId) => {
    const result = await fileService.deleteFile(fileId);
    if (result.success) {
      toast({
        title: "File Deleted",
        description: "The file has been permanently removed"
      });
      fetchFiles();
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error || "Could not delete file"
      });
    }
  };

  const handleDownload = async (file) => {
    try {
      const result = await fileService.downloadFile(file.id);
      if (result.success) {
        const url = URL.createObjectURL(result.data);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name || 'download';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        toast({ variant: "destructive", title: "Error", description: "Download failed" });
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Could not download file" });
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-bg-secondary flex flex-col">
        <Helmet>
          <title>File Management - Munal</title>
          <meta name="description" content="Manage your audio, video, and documents." />
        </Helmet>
        
        <main className="flex-grow container mx-auto px-4 py-8 max-w-7xl space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-text-primary flex items-center">
                <HardDrive className="w-8 h-8 mr-3 text-indigo-500" />
                File Manager
              </h1>
              <p className="text-text-secondary mt-1">
                Upload and manage your meeting recordings and documents
              </p>
            </div>
            <Button onClick={fetchFiles} variant="outline" disabled={loading} className="gap-2">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <AudioUpload onUploadComplete={handleUploadComplete} />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <VideoUpload onUploadComplete={handleUploadComplete} />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <DocumentUpload onUploadComplete={handleUploadComplete} />
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: 0.4 }}
            className="bg-card/30 rounded-xl p-6 border border-border"
          >
            <h2 className="text-xl font-semibold mb-6 text-text-primary">Your Files</h2>
            <FileList 
              files={files} 
              onPreview={setSelectedPreviewFile}
              onDetails={setSelectedDetailFile}
              onDelete={handleDelete}
              onViewTranscript={setTranscriptFile}
              onDownload={handleDownload}
            />
          </motion.div>
        </main>

        <FilePreview 
          file={selectedPreviewFile} 
          isOpen={!!selectedPreviewFile} 
          onClose={() => setSelectedPreviewFile(null)} 
        />
        
        <FileDetailsModal 
          file={selectedDetailFile}
          isOpen={!!selectedDetailFile}
          onClose={() => setSelectedDetailFile(null)}
          onDelete={handleDelete}
        />
        
        <RecordingTranscriptViewer
          fileId={transcriptFile?.id}
          fileName={transcriptFile?.name}
          isOpen={!!transcriptFile}
          onClose={() => setTranscriptFile(null)}
        />
      </div>
    </PageTransition>
  );
};

export default FileManagementPage;
