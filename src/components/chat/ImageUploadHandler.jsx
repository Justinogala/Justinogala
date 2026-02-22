import React, { useRef, useState } from 'react';
import { Image as ImageIcon, X, UploadCloud, ZoomIn, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadFileService } from '@/services/uploadFileService';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { validateFile } from '@/services/fileValidation';

const ImageUploadHandler = ({ onUploadComplete, onCancel }) => {
  const fileInputRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validation = validateFile(file, 'IMAGE');
      if (!validation.valid) {
        toast({ 
          variant: 'destructive', 
          title: 'Invalid File', 
          description: validation.error 
        });
        e.target.value = '';
        return;
      }
      setSelectedImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const compressImage = async (file) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const scaleSize = MAX_WIDTH / img.width;
        
        // Only scale down if width > 1200
        if (scaleSize < 1) {
            canvas.width = MAX_WIDTH;
            canvas.height = img.height * scaleSize;
        } else {
            canvas.width = img.width;
            canvas.height = img.height;
        }

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          resolve(new File([blob], file.name, { type: file.type }));
        }, file.type, 0.8); // 80% quality
      };
    });
  };

  const handleUpload = async () => {
    if (!selectedImage) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Compress image before upload
      const compressedFile = await compressImage(selectedImage);

      const result = await uploadFileService.uploadFile(compressedFile, 'images', (progress) => {
        setUploadProgress(progress);
      });

      if (result.success) {
        onUploadComplete({
          type: 'image',
          file: result.data,
          url: result.data.url,
          name: selectedImage.name,
          size: compressedFile.size, // Use compressed size
          mimeType: selectedImage.type,
          uploadedAt: new Date().toISOString()
        });
        
        clearSelection();
      } else {
        toast({ variant: 'destructive', title: 'Upload Failed', description: result.error });
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Unexpected upload error' });
    } finally {
      setIsUploading(false);
    }
  };

  const clearSelection = () => {
    setSelectedImage(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onCancel && onCancel();
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileSelect}
        accept="image/png, image/jpeg, image/jpg, image/gif, image/webp"
      />
      
      {!selectedImage ? (
        <Button 
          type="button" 
          variant="ghost" 
          size="icon" 
          onClick={() => fileInputRef.current?.click()}
          className="text-gray-500 hover:text-indigo-600 rounded-full"
          title="Upload Image"
        >
          <ImageIcon className="w-5 h-5" />
        </Button>
      ) : (
        <AnimatePresence>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="absolute bottom-full left-0 mb-4 p-3 w-72 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-gray-200 dark:border-slate-800 z-50"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate pr-2 max-w-[180px]">
                {selectedImage.name}
              </span>
              <button 
                onClick={clearSelection} 
                disabled={isUploading}
                className="text-gray-400 hover:text-red-500"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-800 mb-3 group border border-gray-200 dark:border-slate-700">
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              <button 
                  onClick={() => setIsLightboxOpen(true)}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity text-white"
              >
                  <ZoomIn className="w-5 h-5" />
              </button>
            </div>

            {isUploading ? (
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] text-gray-500">
                  <span>Compressing & Uploading...</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} className="h-1.5" />
              </div>
            ) : (
              <Button 
                size="sm" 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20"
                onClick={handleUpload}
              >
                <UploadCloud className="w-3 h-3 mr-2" /> Send Image
              </Button>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
        <DialogContent className="max-w-4xl bg-transparent border-none shadow-none p-0 pointer-events-none flex justify-center">
           <div className="pointer-events-auto relative">
             <img src={previewUrl} alt="Full size" className="max-h-[85vh] rounded-md shadow-2xl" />
             <Button
               variant="secondary"
               size="icon"
               className="absolute top-2 right-2 rounded-full h-8 w-8 bg-black/50 hover:bg-black/70 text-white border-none"
               onClick={() => setIsLightboxOpen(false)}
             >
               <X className="w-4 h-4" />
             </Button>
           </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ImageUploadHandler;