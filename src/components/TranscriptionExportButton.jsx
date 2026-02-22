
import React, { useState } from 'react';
import { Download, FileText, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import { transcriptionExportService } from '@/services/transcriptionExportService';
import ExportStatusModal from '@/components/ExportStatusModal';
import { calculateFileSizeEstimate } from '@/utils/transcriptionExportUtils';

const TranscriptionExportButton = ({ transcription, variant = "outline", size = "default", className }) => {
  const { toast } = useToast();
  const [modalState, setModalState] = useState({ isOpen: false, status: 'idle', type: '', fileName: '' });

  const handleExport = async (format) => {
    if (!transcription) return;

    setModalState({ isOpen: true, status: 'loading', type: format, fileName: '' });

    try {
      let result;
      if (format === 'PDF') {
        result = await transcriptionExportService.exportToPDF(transcription);
      } else {
        result = await transcriptionExportService.exportToWord(transcription);
      }
      
      setModalState({ 
        isOpen: true, 
        status: 'success', 
        type: format, 
        fileName: result.fileName 
      });

      // Auto close success modal after 3 seconds
      setTimeout(() => {
        setModalState(prev => prev.status === 'success' ? { ...prev, isOpen: false } : prev);
      }, 3000);

    } catch (error) {
      setModalState({ isOpen: true, status: 'error', type: format, fileName: '' });
      toast({
        title: "Export Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const fileSize = calculateFileSizeEstimate(transcription?.text || transcription?.transcription);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} size={size} className={className}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <div className="px-2 py-1.5 text-xs text-muted-foreground">
            Estimated size: {fileSize}
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleExport('PDF')}>
            <FileText className="w-4 h-4 mr-2 text-red-500" />
            Export as PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport('Word')}>
            <File className="w-4 h-4 mr-2 text-blue-500" />
            Export as Word
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ExportStatusModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        status={modalState.status}
        type={modalState.type}
        fileName={modalState.fileName}
      />
    </>
  );
};

export default TranscriptionExportButton;
