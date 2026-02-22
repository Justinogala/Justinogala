
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, ArrowUpDown, Loader2, Plus, RefreshCw, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { AnimatePresence } from 'framer-motion';

import PageTransition from '@/components/PageTransition';
import TranscriptionHistoryItem from '@/components/TranscriptionHistoryItem';
import EmptyTranscriptionState from '@/components/EmptyTranscriptionState';
import TranscriptionDetailModal from '@/components/TranscriptionDetailModal';
import { useTranscriptionHistory } from '@/hooks/useTranscriptionHistory';

const TranscriptionHistoryPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Use custom hook for data management
  const { transcriptions, loading, error, refresh, deleteTranscription } = useTranscriptionHistory();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Date');
  
  // Modal State
  const [selectedTranscription, setSelectedTranscription] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleView = (item) => {
    setSelectedTranscription(item);
    setIsModalOpen(true);
  };

  const handleDownload = (item) => {
     if (!item.transcribedText) return;
     const blob = new Blob([item.transcribedText], { type: 'text/plain' });
     const url = URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url;
     a.download = `${item.fileName || 'transcription'}.txt`;
     document.body.appendChild(a);
     a.click();
     document.body.removeChild(a);
     toast({ title: "Download started" });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this transcription?')) {
      await deleteTranscription(id);
      
      if (selectedTranscription?.id === id) {
        setIsModalOpen(false);
        setSelectedTranscription(null);
      }
    }
  };

  // Filter Logic
  const filteredItems = transcriptions.filter(item => {
    const matchesSearch = (item.fileName || item.title || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || (item.status || '').toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === 'Date') return new Date(b.uploadDate) - new Date(a.uploadDate);
    if (sortBy === 'Name') return (a.fileName || '').localeCompare(b.fileName || '');
    if (sortBy === 'Size') {
      const sizeA = parseFloat(a.fileSize || 0);
      const sizeB = parseFloat(b.fileSize || 0);
      return sizeA - sizeB;
    }
    return 0;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-4 lg:p-8">
      <Helmet>
        <title>History | Munal</title>
      </Helmet>

      <PageTransition>
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Transcription History</h1>
              <p className="text-gray-500 mt-1">Manage your audio transcriptions and recordings.</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={refresh} title="Refresh Data">
                 <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button onClick={() => navigate('/transcription/new')} className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4 mr-2" /> New Transcription
              </Button>
            </div>
          </div>

          {/* Controls */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
             <div className="relative w-full md:max-w-sm">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-gray-50 dark:bg-slate-800 border-none"
                />
             </div>
             
             <div className="flex items-center gap-2 w-full md:w-auto">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-[150px]">
                    <Filter className="w-4 h-4 mr-2 text-gray-400" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Status</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Processing">Processing</SelectItem>
                    <SelectItem value="Failed">Failed</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full md:w-[150px]">
                    <ArrowUpDown className="w-4 h-4 mr-2 text-gray-400" />
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Date">Newest First</SelectItem>
                    <SelectItem value="Name">Name (A-Z)</SelectItem>
                    <SelectItem value="Size">Size</SelectItem>
                  </SelectContent>
                </Select>
             </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <p>{error}</p>
            </div>
          )}

          {/* List */}
          <div className="min-h-[400px]">
            {loading ? (
               <div className="flex justify-center items-center h-64">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
               </div>
            ) : filteredItems.length === 0 ? (
               searchTerm || statusFilter !== 'All' ? (
                 <div className="text-center py-20 text-gray-500">
                    <p>No results found for your filters.</p>
                    <Button variant="link" onClick={() => { setSearchTerm(''); setStatusFilter('All'); }}>Clear Filters</Button>
                 </div>
               ) : (
                 <EmptyTranscriptionState />
               )
            ) : (
               <div className="space-y-3">
                  <AnimatePresence>
                    {filteredItems.map(item => (
                       <TranscriptionHistoryItem 
                          key={item.id} 
                          item={item} 
                          onView={handleView}
                          onDelete={() => handleDelete(item.id)}
                          onDownload={handleDownload}
                       />
                    ))}
                  </AnimatePresence>
               </div>
            )}
          </div>
        </div>
      </PageTransition>

      <TranscriptionDetailModal
        transcription={selectedTranscription}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default TranscriptionHistoryPage;
