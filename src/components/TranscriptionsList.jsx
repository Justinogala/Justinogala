
import React, { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, FileText, Clock, Calendar, Trash2, Edit, Search, Loader2, ExternalLink, File, FileImage as FileIcon, Plus } from 'lucide-react';
import { transcriptionService } from '@/services/transcriptionService';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { transcriptionExportService } from '@/services/transcriptionExportService';
import ExportStatusModal from '@/components/ExportStatusModal';

const TranscriptionsList = ({ onEdit }) => {
  const [transcriptions, setTranscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [exportModal, setExportModal] = useState({ isOpen: false, status: 'idle', type: '', fileName: '' });
  
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchTranscriptions = async () => {
    try {
      setLoading(true);
      const data = await transcriptionService.getAllTranscriptions();
      setTranscriptions(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load transcriptions.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTranscriptions();
  }, []);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await transcriptionService.deleteTranscription(id);
      setTranscriptions(prev => prev.filter(t => t.id !== id));
      toast({
        title: "Deleted",
        description: "Transcription deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete transcription.",
        variant: "destructive"
      });
    }
  };

  const handleExport = async (transcription, format, e) => {
    e.stopPropagation();
    setExportModal({ isOpen: true, status: 'loading', type: format, fileName: '' });

    try {
      let result;
      if (format === 'PDF') {
        result = await transcriptionExportService.exportToPDF(transcription);
      } else {
        result = await transcriptionExportService.exportToWord(transcription);
      }
      
      setExportModal({ 
        isOpen: true, 
        status: 'success', 
        type: format, 
        fileName: result.fileName 
      });

      setTimeout(() => {
        setExportModal(prev => prev.status === 'success' ? { ...prev, isOpen: false } : prev);
      }, 2500);

    } catch (error) {
      setExportModal({ isOpen: true, status: 'error', type: format, fileName: '' });
    }
  };

  const handleRowClick = (id) => {
    navigate(`/transcriptions/${id}`);
  };

  const filteredTranscriptions = transcriptions.filter(t => 
    (t.title || t.fileName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 max-w-sm w-full">
          <Search className="w-4 h-4 text-gray-500" />
          <Input 
            placeholder="Search transcriptions..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-white dark:bg-slate-900"
          />
        </div>
        
        <Button onClick={() => navigate('/transcription/new')} className="bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          New Transcription
        </Button>
      </div>

      <div className="rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 overflow-hidden">
        {loading && transcriptions.length === 0 ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTranscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-gray-500">
                    No transcriptions found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTranscriptions.map((t) => (
                  <TableRow 
                    key={t.id} 
                    className="hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                    onClick={() => handleRowClick(t.id)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded text-indigo-600">
                          <FileText className="w-4 h-4" />
                        </div>
                        <span className="truncate max-w-[200px] font-semibold text-gray-900 dark:text-gray-100">{t.title || t.fileName || 'Untitled'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-gray-500 text-sm">
                        <Calendar className="w-3 h-3" />
                        {t.date || t.uploadDate ? new Date(t.date || t.uploadDate).toLocaleDateString() : '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-gray-500 text-sm">
                        <Clock className="w-3 h-3" />
                        {t.duration || '0:00'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        (t.status || 'processing') === 'completed' ? 'success' : 
                        (t.status || 'processing') === 'failed' ? 'destructive' : 'secondary'
                      } className={
                        (t.status || 'processing') === 'completed' ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                        (t.status || 'processing').includes('processing') ? 'bg-blue-100 text-blue-700 animate-pulse' : ''
                      }>
                        {(t.status || 'processing').charAt(0).toUpperCase() + (t.status || 'processing').slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/transcriptions/${t.id}`); }}>
                            <ExternalLink className="mr-2 h-4 w-4" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(t); }}>
                            <Edit className="mr-2 h-4 w-4" /> Edit Content
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={(e) => handleExport(t, 'PDF', e)}>
                            <FileIcon className="mr-2 h-4 w-4 text-red-500" /> Export PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => handleExport(t, 'Word', e)}>
                            <File className="mr-2 h-4 w-4 text-blue-500" /> Export Word
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600 focus:text-red-700 focus:bg-red-50" onClick={(e) => handleDelete(t.id, e)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <ExportStatusModal
        isOpen={exportModal.isOpen}
        onClose={() => setExportModal({ ...exportModal, isOpen: false })}
        status={exportModal.status}
        type={exportModal.type}
        fileName={exportModal.fileName}
      />
    </div>
  );
};

export default TranscriptionsList;
