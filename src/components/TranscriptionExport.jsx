
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Download, FileText, File } from 'lucide-react';
import { transcriptionService } from '@/services/transcriptionService';
import { useToast } from '@/components/ui/use-toast';

const TranscriptionExport = ({ transcription }) => {
  const [format, setFormat] = useState('PDF');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    setExporting(true);
    try {
      const result = await transcriptionService.exportTranscription(transcription.id, format);
      
      // Simulate download
      toast({
        title: "Export Ready",
        description: `Your ${format} file has been generated.`,
      });
      setOpen(false);
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Could not export the file.",
        variant: "destructive"
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" /> Export
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export Transcription</DialogTitle>
          <DialogDescription>
            Choose format and options for your download.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label>Format</Label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger>
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PDF">PDF Document (.pdf)</SelectItem>
                <SelectItem value="DOCX">Word Document (.docx)</SelectItem>
                <SelectItem value="TXT">Plain Text (.txt)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="metadata" 
              checked={includeMetadata} 
              onCheckedChange={setIncludeMetadata} 
            />
            <Label htmlFor="metadata" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Include metadata (Title, Date, Duration)
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleExport} disabled={exporting} className="bg-indigo-600 hover:bg-indigo-700">
            {exporting ? 'Generating...' : 'Download'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TranscriptionExport;
