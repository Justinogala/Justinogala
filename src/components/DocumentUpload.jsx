
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import FileUpload from '@/components/FileUpload';

const DocumentUpload = ({ onUploadComplete }) => {
  return (
    <Card className="bg-gradient-to-br from-bg-primary to-bg-secondary border-border/50 shadow-xl overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <FileText className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <CardTitle className="text-lg">Upload Documents</CardTitle>
            <CardDescription>Upload agendas, minutes, or notes</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <FileUpload 
          bucket="documents"
          fileType="document"
          path="workplace/docs"
          multiple={true}
          onUploadComplete={onUploadComplete}
          className="bg-bg-primary/50"
        />
      </CardContent>
    </Card>
  );
};

export default DocumentUpload;
