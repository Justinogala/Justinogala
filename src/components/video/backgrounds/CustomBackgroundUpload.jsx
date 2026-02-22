
import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

const CustomBackgroundUpload = ({ onUpload }) => {
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    await processFile(file);
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    await processFile(file);
  };

  const processFile = async (file) => {
    if (!file) return;

    // Validate type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast({ variant: 'destructive', title: 'Invalid file type', description: 'Please upload JPG, PNG, or WebP.' });
      return;
    }

    setIsUploading(true);
    try {
      await onUpload(file);
      toast({ title: 'Background uploaded', description: 'Your custom background is ready to use.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Upload failed', description: error });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div 
      className={cn(
        "relative group cursor-pointer border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all",
        isDragging 
          ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30" 
          : "border-gray-300 dark:border-gray-700 hover:border-indigo-400 hover:bg-gray-50 dark:hover:bg-slate-800"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input 
        type="file" 
        ref={fileInputRef}
        className="hidden" 
        accept="image/png, image/jpeg, image/webp"
        onChange={handleFileSelect}
      />
      
      {isUploading ? (
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-2" />
      ) : (
        <div className="bg-indigo-100 dark:bg-indigo-900/50 p-3 rounded-full mb-3 group-hover:scale-110 transition-transform">
          <Upload className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        </div>
      )}
      
      <h3 className="font-semibold text-gray-900 dark:text-white">Click or drag image</h3>
      <p className="text-xs text-gray-500 mt-1">JPG, PNG, WebP up to 5MB</p>
    </div>
  );
};

export default CustomBackgroundUpload;
