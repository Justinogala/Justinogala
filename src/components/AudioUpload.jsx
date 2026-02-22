
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Music } from 'lucide-react';
import FileUpload from '@/components/FileUpload';

const AudioUpload = ({ onUploadComplete }) => {
  return (
    <Card className="bg-gradient-to-br from-bg-primary to-bg-secondary border-border/50 shadow-xl overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-pink-500/10 rounded-lg">
            <Music className="w-6 h-6 text-pink-500" />
          </div>
          <div>
            <CardTitle className="text-lg">Upload Audio</CardTitle>
            <CardDescription>Upload recordings for transcription</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <FileUpload 
          bucket="audio-files"
          fileType="audio"
          path="meetings/audio"
          multiple={true}
          onUploadComplete={onUploadComplete}
          className="bg-bg-primary/50"
        />
      </CardContent>
    </Card>
  );
};

export default AudioUpload;
