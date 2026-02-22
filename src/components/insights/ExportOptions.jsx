
import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Download, 
  FileText, 
  Copy, 
  File
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/components/ui/use-toast';

const ExportOptions = ({ data }) => {
  const { toast } = useToast();

  const handleCopy = () => {
    if (!data) return;
    const text = `SUMMARY:\n${data.summary.text}\n\nKEY INSIGHTS:\n${data.summary.keyPoints.join('\n- ')}`;
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Analysis summary copied to clipboard."
    });
  };

  const handleExport = (format) => {
    toast({
      title: "Export Started",
      description: `Downloading analysis as ${format.toUpperCase()}...`
    });
    // Implementation would go here - generating actual files
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={handleCopy} className="hidden sm:flex">
        <Copy className="w-4 h-4 mr-2" />
        Copy
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="default" size="sm" className="bg-violet-600 hover:bg-violet-700">
            <Download className="w-4 h-4 mr-2" />
            Export Analysis
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Choose Format</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleExport('pdf')}>
            <File className="w-4 h-4 mr-2 text-red-500" />
            PDF Document
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport('docx')}>
            <FileText className="w-4 h-4 mr-2 text-blue-500" />
            Word Document
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport('txt')}>
            <FileText className="w-4 h-4 mr-2 text-gray-500" />
            Plain Text
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default ExportOptions;
