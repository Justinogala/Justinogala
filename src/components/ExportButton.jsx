
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, FileType, File } from 'lucide-react';
import { exportToPDF, exportToDOCX, exportToText } from '@/services/exportService';
import { useToast } from '@/components/ui/use-toast';

const ExportButton = ({ meeting }) => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async (type) => {
    if (!meeting) return;
    
    setIsExporting(true);
    try {
      if (type === 'pdf') {
        exportToPDF(meeting);
      } else if (type === 'docx') {
        await exportToDOCX(meeting);
      } else if (type === 'txt') {
        exportToText(meeting);
      }
      
      toast({
        title: "Export Successful",
        description: `Your meeting has been exported to ${type.toUpperCase()}.`,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Export Failed",
        description: "There was an error generating your file. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting}>
          <Download className="w-4 h-4 mr-2" />
          {isExporting ? 'Exporting...' : 'Export'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-slate-800 border-white/10 text-white">
        <DropdownMenuItem 
          onClick={() => handleExport('pdf')}
          className="hover:bg-slate-700 focus:bg-slate-700 cursor-pointer"
        >
          <FileType className="w-4 h-4 mr-2 text-red-400" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleExport('docx')}
          className="hover:bg-slate-700 focus:bg-slate-700 cursor-pointer"
        >
          <File className="w-4 h-4 mr-2 text-blue-400" />
          Export as DOCX
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleExport('txt')}
          className="hover:bg-slate-700 focus:bg-slate-700 cursor-pointer"
        >
          <FileText className="w-4 h-4 mr-2 text-gray-400" />
          Export as Text
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExportButton;
