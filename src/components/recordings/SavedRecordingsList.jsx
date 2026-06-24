import React from 'react';
import {
  Monitor, Camera, Play, Download, Edit2, Share2, Trash2, Pin, PinOff,
  Clock, HardDrive, Loader2, FolderOpen, ChevronDown, Users, Globe, Mail, Video,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getDaysRemaining = (expiresAt) => {
  if (!expiresAt) return null;
  const now = new Date();
  const expires = new Date(expiresAt);
  const diff = expires - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const RecordingItem = ({ recording, isSelected, onPlay, onDownload, onEdit, onShare, onDelete, onPin, isOwned }) => {
  const daysLeft = getDaysRemaining(recording.expires_at);
  const isPinned = recording.pinned;

  return (
    <div className={cn("p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors", isSelected && "bg-rose-50 dark:bg-rose-950/20")}>
      <div className="flex items-start gap-3">
        <button onClick={() => onPlay(recording)} className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", recording.recording_type === 'screen' ? "bg-blue-100 dark:bg-blue-900/30" : "bg-purple-100 dark:bg-purple-900/30")}>
          {recording.recording_type === 'screen' ? <Monitor className="w-5 h-5 text-blue-600 dark:text-blue-400" /> : <Camera className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
        </button>
        
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onPlay(recording)}>
          <div className="flex items-center gap-1.5">
            {isPinned && <Pin className="w-3 h-3 text-amber-500 shrink-0" />}
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{recording.title}</p>
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatTime(recording.duration)}</span>
            <span>{formatFileSize(recording.file_size)}</span>
          </div>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {!isOwned && (
              <span className="text-xs bg-indigo-100 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                <Mail className="w-3 h-3" /> {recording.ownerInfo?.name || 'Unknown'}
              </span>
            )}
            {isOwned && (
              <>
                <span className="text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-500">{recording.category || 'Uncategorized'}</span>
                {isPinned && (
                  <span className="text-xs bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <Pin className="w-3 h-3" /> Pinned
                  </span>
                )}
                {recording.is_shared && (
                  <span className="text-xs bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded text-green-600 dark:text-green-400 flex items-center gap-1">
                    {recording.shared_with?.length > 0 ? <Users className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                    {recording.shared_with?.length > 0 ? `${recording.shared_with.length} member${recording.shared_with.length > 1 ? 's' : ''}` : 'Public'}
                  </span>
                )}
                {daysLeft !== null ? (
                  <span className={cn("text-xs px-1.5 py-0.5 rounded", daysLeft <= 2 ? "bg-red-100 text-red-600 dark:bg-red-900/30" : "bg-gray-100 text-gray-500 dark:bg-gray-800")}>
                    {daysLeft}d left
                  </span>
                ) : (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">No expiry</span>
                )}
              </>
            )}
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" data-testid={`recording-menu-${recording.id}`}><ChevronDown className="w-4 h-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem data-testid={`recording-play-${recording.id}`} onClick={() => onPlay(recording)}><Play className="w-4 h-4 mr-2" />Play</DropdownMenuItem>
            <DropdownMenuItem data-testid={`recording-download-${recording.id}`} onClick={() => onDownload(recording)}><Download className="w-4 h-4 mr-2" />Download</DropdownMenuItem>
            {isOwned && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem data-testid={`recording-pin-${recording.id}`} onClick={() => onPin(recording)}>
                  {isPinned ? <PinOff className="w-4 h-4 mr-2" /> : <Pin className="w-4 h-4 mr-2" />}
                  {isPinned ? 'Unpin' : 'Pin'}
                </DropdownMenuItem>
                <DropdownMenuItem data-testid={`recording-edit-${recording.id}`} onClick={() => onEdit(recording)}><Edit2 className="w-4 h-4 mr-2" />Edit</DropdownMenuItem>
                <DropdownMenuItem data-testid={`recording-share-${recording.id}`} onClick={() => onShare(recording)}><Share2 className="w-4 h-4 mr-2" />Share</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem data-testid={`recording-delete-${recording.id}`} onClick={() => onDelete(recording)} className="text-red-600"><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export const SavedRecordingsList = ({
  isLoading, recordings, sharedRecordings, categories,
  showSharedWithMe, setShowSharedWithMe,
  filterCategory, setFilterCategory,
  selectedRecording,
  onPlay, onDownload, onEdit, onShare, onDelete, onPin,
  hasMore, onLoadMore, total,
}) => (
  <motion.div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-800 overflow-hidden" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
    <div className="p-4 border-b border-gray-100 dark:border-gray-800">
      <div className="flex items-center gap-2 mb-3">
        <Button variant={!showSharedWithMe ? "default" : "outline"} size="sm"
          className={cn("flex-1 text-xs", !showSharedWithMe && "bg-rose-500 hover:bg-rose-600")}
          onClick={() => setShowSharedWithMe(false)}>
          <HardDrive className="w-3 h-3 mr-1.5" /> My Recordings
        </Button>
        <Button variant={showSharedWithMe ? "default" : "outline"} size="sm"
          className={cn("flex-1 text-xs", showSharedWithMe && "bg-rose-500 hover:bg-rose-600")}
          onClick={() => setShowSharedWithMe(true)}>
          <Users className="w-3 h-3 mr-1.5" /> Shared ({sharedRecordings.length})
        </Button>
      </div>
      
      {!showSharedWithMe && (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="w-full justify-between text-xs">
                <span className="flex items-center gap-1.5"><FolderOpen className="w-3 h-3" /> {filterCategory}</span>
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48">
              <DropdownMenuItem onClick={() => setFilterCategory('All')}>All Categories</DropdownMenuItem>
              <DropdownMenuSeparator />
              {categories.map(cat => (
                <DropdownMenuItem key={cat.name} onClick={() => setFilterCategory(cat.name)}>
                  {cat.name} ({cat.count})
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <p className="text-xs text-gray-500 mt-2">Auto-deleted after 7 days • Pin to keep</p>
        </>
      )}
    </div>

    <div className="max-h-[500px] overflow-y-auto">
      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 text-gray-400 animate-spin" /></div>
      ) : showSharedWithMe ? (
        sharedRecordings.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Users className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No recordings shared with you</p>
            <p className="text-xs text-gray-400 mt-1">When someone shares a recording, it appears here</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {sharedRecordings.map(rec => (
              <RecordingItem key={rec.id} recording={rec} isSelected={selectedRecording?.id === rec.id}
                onPlay={onPlay} onDownload={onDownload} onEdit={onEdit} onShare={onShare} onDelete={onDelete} onPin={onPin} isOwned={false} />
            ))}
          </div>
        )
      ) : (
        recordings.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Video className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No recordings yet</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {recordings.map(rec => (
                <RecordingItem key={rec.id} recording={rec} isSelected={selectedRecording?.id === rec.id}
                  onPlay={onPlay} onDownload={onDownload} onEdit={onEdit} onShare={onShare} onDelete={onDelete} onPin={onPin} isOwned={true} />
              ))}
            </div>
            {hasMore && (
              <div className="p-3 text-center border-t border-gray-100 dark:border-gray-800">
                <Button variant="ghost" size="sm" onClick={onLoadMore} className="text-xs text-gray-500">
                  Load More ({total - recordings.length} remaining)
                </Button>
              </div>
            )}
          </>
        )
      )}
    </div>
  </motion.div>
);
