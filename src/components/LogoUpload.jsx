
import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logoUploadService } from '@/services/logoUploadService';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

const LogoUpload = ({ className }) => {
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const [logo, setLogo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Load initial logo
    const savedLogo = logoUploadService.getLogo();
    if (savedLogo) setLogo(savedLogo);
  }, []);

  const handleFile = async (file) => {
    if (!file) return;
    
    setLoading(true);
    setError('');
    
    try {
      const base64 = await logoUploadService.uploadLogo(file);
      setLogo(base64);
      toast({ title: "Success", description: "Logo uploaded successfully." });
    } catch (err) {
      setError(err.message);
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const onDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const removeLogo = () => {
    logoUploadService.removeLogo();
    setLogo(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Brand Logo</label>
        {logo && (
          <Button variant="ghost" size="sm" onClick={removeLogo} className="text-red-500 h-8 px-2">
            <X className="w-4 h-4 mr-1" /> Remove
          </Button>
        )}
      </div>

      <div 
        className={cn(
          "relative flex flex-col items-center justify-center w-full h-48 rounded-lg border-2 border-dashed transition-all",
          dragActive ? "border-primary bg-primary/5" : "border-border bg-muted/20",
          error ? "border-red-500/50 bg-red-500/5" : ""
        )}
        onDragEnter={onDrag}
        onDragLeave={onDrag}
        onDragOver={onDrag}
        onDrop={onDrop}
      >
        <input 
          ref={fileInputRef}
          type="file" 
          className="hidden" 
          accept="image/png, image/jpeg, image/svg+xml"
          onChange={handleChange}
        />

        {loading ? (
          <div className="flex flex-col items-center space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Uploading...</p>
          </div>
        ) : logo ? (
          <div className="relative w-full h-full p-4 flex items-center justify-center">
             <img src={logo} alt="Brand Logo" className="max-h-full max-w-full object-contain" />
             <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                   Change Logo
                </Button>
             </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground font-medium">Click to upload or drag and drop</p>
            <p className="text-xs text-muted-foreground mt-1">SVG, PNG, JPG (max 2MB)</p>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center text-sm text-red-500 bg-red-500/10 p-2 rounded">
          <AlertCircle className="w-4 h-4 mr-2" />
          {error}
        </div>
      )}
    </div>
  );
};

export default LogoUpload;
