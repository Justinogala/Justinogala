
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Music, Video, MoreVertical, 
  Download, Eye, Trash2, Search, Filter,
  FileType, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const FileIcon = ({ type, bucket }) => {
  if (type?.includes('audio') || bucket === 'audio-files') return <Music className="w-5 h-5 text-pink-500" />;
  if (type?.includes('video') || bucket === 'video-files') return <Video className="w-5 h-5 text-blue-500" />;
  return <FileText className="w-5 h-5 text-emerald-500" />;
};

const FileList = ({ files, onPreview, onDetails, onDelete, onViewTranscript }) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filterType === 'all' 
      ? true 
      : file.type?.includes(filterType) || file.bucket?.includes(filterType);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input 
            placeholder="Search files..." 
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
          {['all', 'audio', 'video', 'document'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                filterType === type 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card/50 backdrop-blur-sm rounded-xl border border-border overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 text-sm font-medium text-gray-400">
          <div className="col-span-6 md:col-span-5">Name</div>
          <div className="col-span-3 hidden md:block">Date</div>
          <div className="col-span-3 md:col-span-2 text-right md:text-left">Size</div>
          <div className="col-span-3 md:col-span-2 text-right">Actions</div>
        </div>

        <div className="divide-y divide-white/5">
          <AnimatePresence>
            {filteredFiles.length > 0 ? (
              filteredFiles.map((file) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 transition-colors group"
                >
                  <div className="col-span-6 md:col-span-5 flex items-center gap-3 overflow-hidden">
                    <div className="p-2 rounded-lg bg-white/5">
                      <FileIcon type={file.type} bucket={file.bucket} />
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="truncate font-medium text-gray-200">{file.name}</span>
                      {file.has_transcript && (
                        <Badge 
                          variant="outline" 
                          className="w-fit mt-1 text-[10px] py-0 px-1.5 border-indigo-500/50 text-indigo-400 bg-indigo-500/10"
                        >
                          <FileType className="w-2.5 h-2.5 mr-1" />
                          Transcript
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="col-span-3 hidden md:block text-sm text-gray-400">
                    {new Date(file.uploadedAt).toLocaleDateString()}
                  </div>
                  
                  <div className="col-span-3 md:col-span-2 text-sm text-gray-400 text-right md:text-left">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </div>
                  
                  <div className="col-span-3 md:col-span-2 flex justify-end gap-2">
                    <div className="hidden md:flex gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onPreview(file)}>
                        <Eye className="w-4 h-4 text-gray-400" />
                      </Button>
                      {file.has_transcript && onViewTranscript && (
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8" 
                          onClick={() => onViewTranscript(file)}
                          title="View Transcript"
                        >
                          <FileType className="w-4 h-4 text-indigo-400" />
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <Download className="w-4 h-4 text-gray-400" />
                      </Button>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4 text-gray-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44 bg-slate-800 border-white/10 text-gray-200">
                        <DropdownMenuItem onClick={() => onDetails(file)}>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onPreview(file)} className="md:hidden">
                          <Eye className="w-4 h-4 mr-2" /> Preview
                        </DropdownMenuItem>
                        {file.has_transcript && onViewTranscript && (
                          <DropdownMenuItem onClick={() => onViewTranscript(file)}>
                            <FileType className="w-4 h-4 mr-2 text-indigo-400" /> View Transcript
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="md:hidden">
                          <Download className="w-4 h-4 mr-2" /> Download
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-400 focus:text-red-400 focus:bg-red-400/10"
                          onClick={() => onDelete(file.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="p-12 text-center text-gray-500">
                <Filter className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No files found</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default FileList;
