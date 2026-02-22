
import React from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Download, Share2, File } from 'lucide-react';

const FileDetailsModal = ({ file, isOpen, onClose, onDelete }) => {
  if (!file) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="File Details">
      <div className="space-y-6">
        <div className="flex items-center space-x-4 pb-6 border-b border-white/10">
          <div className="w-16 h-16 bg-indigo-500/20 rounded-xl flex items-center justify-center">
            <File className="w-8 h-8 text-indigo-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white break-all">{file.name}</h3>
            <p className="text-gray-400 text-sm">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>File Name</Label>
            <Input defaultValue={file.name} />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Input value={file.type} disabled className="bg-white/5" />
            </div>
            <div className="space-y-2">
              <Label>Bucket</Label>
              <Input value={file.bucket} disabled className="bg-white/5" />
            </div>
          </div>

          <div className="space-y-2">
             <Label>Upload Date</Label>
             <Input value={new Date(file.uploadedAt).toLocaleString()} disabled className="bg-white/5" />
          </div>
        </div>

        <div className="flex justify-between items-center pt-6 border-t border-white/10">
          <Button 
            variant="destructive" 
            onClick={() => {
              onDelete(file.id);
              onClose();
            }}
            className="bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:text-red-400 border-none"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>

          <div className="flex space-x-2">
            <Button variant="outline" className="border-white/10 hover:bg-white/5">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default FileDetailsModal;
