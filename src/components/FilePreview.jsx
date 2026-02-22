
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, FileText, Music, Video as VideoIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

const FilePreview = ({ file, isOpen, onClose }) => {
  if (!file) return null;

  const isAudio = file.type?.startsWith('audio') || file.bucket === 'audio-files';
  const isVideo = file.type?.startsWith('video') || file.bucket === 'video-files';
  const isImage = file.type?.startsWith('image') || file.bucket === 'avatars';
  
  // Use the temporary URL from metadata if available (for prototype)
  // or a placeholder since we can't persist blob URLs across refreshes in a real app easily without DB
  const previewUrl = file.url || '#'; 

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={file.name} className="max-w-4xl">
      <div className="space-y-6">
        <div className="flex items-center justify-center bg-black/20 rounded-xl min-h-[300px] overflow-hidden">
          {isAudio && (
            <div className="w-full p-8 text-center">
              <div className="w-20 h-20 bg-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Music className="w-10 h-10 text-pink-500" />
              </div>
              <audio controls className="w-full" src={previewUrl}>
                Your browser does not support the audio element.
              </audio>
            </div>
          )}
          
          {isVideo && (
            <video controls className="w-full max-h-[60vh] rounded-lg" src={previewUrl}>
              Your browser does not support the video element.
            </video>
          )}

          {isImage && (
            <img src={previewUrl} alt={file.name} className="max-w-full max-h-[60vh] object-contain" />
          )}

          {!isAudio && !isVideo && !isImage && (
            <div className="text-center p-12">
              <FileText className="w-24 h-24 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">Preview not available for this file type</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
          <div>
            <p className="font-semibold text-gray-300">File Type</p>
            <p>{file.type || 'Unknown'}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-300">Size</p>
            <p>{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
          </div>
          <div>
            <p className="font-semibold text-gray-300">Uploaded</p>
            <p>{new Date(file.uploadedAt).toLocaleString()}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-300">Location</p>
            <p className="truncate" title={file.path}>{file.path}</p>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-white/10">
          <Button variant="outline" onClick={onClose} className="mr-2">
            Close
          </Button>
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default FilePreview;
