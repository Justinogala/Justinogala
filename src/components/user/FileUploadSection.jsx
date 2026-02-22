
import React from 'react';
import { FileVideo, FileAudio, Trash2, Download, CloudOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

const FileUploadSection = ({ files, onDelete }) => {
  const { toast } = useToast();

  const handleDownload = (file) => {
    toast({
      title: "Download Started",
      description: `Downloading ${file.name}...`
    });
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this file?")) {
      onDelete(id);
    }
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Uploaded Files</h2>
      
      {files.length === 0 ? (
        <Card className="bg-gray-50 dark:bg-slate-900 border-dashed border-2 border-gray-300 dark:border-gray-700">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <CloudOff className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-600 dark:text-gray-300">No files uploaded yet</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Upload video or audio files to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {files.map((file) => (
            <div 
              key={file.id} 
              className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className={`p-2 rounded-lg ${file.type.startsWith('video') ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400'}`}>
                  {file.type.startsWith('video') ? <FileVideo className="w-6 h-6" /> : <FileAudio className="w-6 h-6" />}
                </div>
                <div className="min-w-0">
                  <h3 className="font-medium text-gray-900 dark:text-white truncate">{file.name}</h3>
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 gap-3">
                    <span>{formatSize(file.size)}</span>
                    <span>•</span>
                    <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => handleDownload(file)} title="Download">
                  <Download className="w-4 h-4 text-gray-500 hover:text-indigo-600" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(file.id)} title="Delete">
                  <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-500" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUploadSection;
