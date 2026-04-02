
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Music, Video, Download, Trash2, ArrowRight, HardDrive, MoreVertical } from 'lucide-react';
import { uploadFileService } from '@/services/uploadFileService';
import { fileService } from '@/services/fileService';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

const FileIcon = ({ type }) => {
  if (type?.includes('audio')) return <Music className="w-5 h-5 text-pink-500" />;
  if (type?.includes('video')) return <Video className="w-5 h-5 text-blue-500" />;
  return <FileText className="w-5 h-5 text-emerald-500" />;
};

const formatSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const RecentFilesSection = ({ refreshTrigger }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ used: 0, total: 0 });
  const { toast } = useToast();
  const navigate = useNavigate();

  const loadData = async () => {
    setLoading(true);
    try {
      const [filesRes, statsRes] = await Promise.all([
        uploadFileService.getRecentFiles(5),
        uploadFileService.getStorageStats()
      ]);

      if (filesRes.success) setFiles(filesRes.data);
      if (statsRes.success) setStats(statsRes);
    } catch (error) {
      console.error("Failed to load files", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this file?')) {
      try {
        const result = await fileService.deleteFile(id);
        if (result.success) {
          toast({ title: "File deleted", description: "The file has been permanently removed." });
          loadData();
        } else {
          toast({ title: "Error", description: "Could not delete file.", variant: "destructive" });
        }
      } catch (err) {
         toast({ title: "Error", description: "Could not delete file.", variant: "destructive" });
      }
    }
  };

  const usagePercent = stats.total > 0 ? (stats.used / stats.total) * 100 : 0;

  return (
    <div className="glass-panel rounded-2xl p-6 flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
             <HardDrive className="w-5 h-5 text-purple-500" />
             Files & Storage
          </h3>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/files')} className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-full px-3">
          Manage
        </Button>
      </div>
      
      <div className="flex-1 flex flex-col gap-6">
        {/* Storage Stats */}
        <div className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700/50 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-5">
             <HardDrive className="w-24 h-24" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Storage Usage</span>
              <span className="text-xs font-mono text-gray-500 dark:text-gray-400 bg-white dark:bg-slate-950 px-2 py-0.5 rounded border border-gray-100 dark:border-gray-800">
                {formatSize(stats.used)} / {formatSize(stats.total)}
              </span>
            </div>
            <Progress value={usagePercent} className="h-2.5 bg-gray-100 dark:bg-gray-700" indicatorClassName="bg-gradient-to-r from-purple-500 to-indigo-500" />
            <p className="text-[10px] text-gray-400 mt-2 text-right">
              {usagePercent.toFixed(1)}% used
            </p>
          </div>
        </div>

        {/* File List */}
        <div className="flex-1 space-y-3">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Recent Uploads</h4>
          {loading ? (
             <div className="space-y-3">
               {[1, 2, 3].map(i => (
                 <div key={i} className="h-14 bg-gray-100/50 dark:bg-slate-800/50 rounded-xl animate-pulse" />
               ))}
             </div>
          ) : files.length > 0 ? (
            <div className="space-y-2">
              <AnimatePresence>
                {files.map((file, idx) => (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-gray-100 dark:hover:border-slate-700/50 hover:shadow-sm"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 flex items-center justify-center shrink-0">
                        <FileIcon type={file.type} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[150px]">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatSize(file.size)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-indigo-600 rounded-full">
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-gray-400 hover:text-red-500 rounded-full"
                        onClick={(e) => handleDelete(file.id, e)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="text-center py-6 text-gray-400 text-sm bg-gray-50/30 dark:bg-slate-900/20 rounded-xl border border-dashed border-gray-200 dark:border-slate-800">
              <p>No files uploaded yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecentFilesSection;
