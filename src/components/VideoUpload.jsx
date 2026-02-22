
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Video } from 'lucide-react';
import FileUpload from '@/components/FileUpload';

const VideoUpload = ({ onUploadComplete }) => {
  return (
    <Card className="bg-gradient-to-br from-bg-primary to-bg-secondary border-border/50 shadow-xl overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Video className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <CardTitle className="text-lg">Upload Video</CardTitle>
            <CardDescription>Upload video meetings for processing</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <FileUpload 
          bucket="video-files"
          fileType="video"
          path="meetings/video"
          multiple={true}
          onUploadComplete={onUploadComplete}
          className="bg-bg-primary/50"
        />
      </CardContent>
    </Card>
  );
};

export default VideoUpload;
