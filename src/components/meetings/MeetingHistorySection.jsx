
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { 
  Search, Download, Share2, Trash2, MoreVertical, Eye, Calendar, Clock, Users, Video, Loader2, Copy, Check
} from 'lucide-react';
import { format } from 'date-fns';
import { localMeetingsStorageService } from '@/services/localMeetingsStorageService';
import { useToast } from '@/components/ui/use-toast';

const MeetingHistorySection = ({ onViewDetails }) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [shareUrl, setShareUrl] = useState(null);
  const [copied, setCopied] = useState(false);

  const loadMeetings = useCallback(() => {
    setLoading(true);
    try {
      const data = localMeetingsStorageService.getAllMeetings();
      const sorted = [...data].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setMeetings(sorted);
    } catch {
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadMeetings(); }, [loadMeetings]);

  const filteredHistory = meetings.filter(item =>
    (item.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDownload = async (meeting) => {
    try {
      const url = await localMeetingsStorageService.getRecordingUrl(meeting.id);
      if (url) {
        const a = document.createElement('a');
        a.href = url;
        a.download = `${meeting.title || 'recording'}.webm`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast({ title: 'Download started', description: `Downloading ${meeting.title}` });
      } else {
        toast({ variant: 'destructive', title: 'No recording found', description: 'This meeting has no downloadable recording.' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Download failed' });
    }
  };

  const handleShare = (meeting) => {
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/meetings?view=${meeting.id}`;
    setShareUrl(url);
    setCopied(false);
  };

  const handleCopyLink = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({ title: 'Link copied to clipboard' });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await localMeetingsStorageService.deleteMeeting(deleteId);
      toast({ title: 'Meeting deleted' });
      loadMeetings();
    } catch {
      toast({ variant: 'destructive', title: 'Failed to delete meeting' });
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const parseDate = (meeting) => {
    try {
      if (meeting.date && meeting.time) {
        return new Date(`${meeting.date}T${meeting.time}`);
      }
      if (meeting.createdAt) return new Date(meeting.createdAt);
      return null;
    } catch { return null; }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400 mr-2" />
        <span className="text-slate-500 text-sm">Loading meeting history...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Past Meetings</h3>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search history..." 
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="meeting-history-search"
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-800/50">
              <TableHead className="w-[300px]">Meeting Info</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead>Participants</TableHead>
              <TableHead>Recording</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredHistory.map((meeting) => {
              const dateObj = parseDate(meeting);
              return (
                <TableRow key={meeting.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <TableCell>
                    <div className="font-medium text-slate-900 dark:text-white">{meeting.title || 'Untitled'}</div>
                    <div className="text-xs text-slate-500">ID: {meeting.id}</div>
                  </TableCell>
                  <TableCell>
                    {dateObj ? (
                      <>
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <Calendar className="w-3.5 h-3.5" />
                          {format(dateObj, 'MMM d, yyyy')}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                          <Clock className="w-3 h-3" />
                          {format(dateObj, 'h:mm a')}
                        </div>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400">No date</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs capitalize">
                      {meeting.platform || 'internal'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {meeting.participants?.length > 0 ? (
                      <div className="flex -space-x-2">
                        {meeting.participants.slice(0, 4).map((p, i) => (
                          <div key={i} className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[8px] font-bold text-slate-600" title={p}>
                            {(p || '?')[0].toUpperCase()}
                          </div>
                        ))}
                        {meeting.participants.length > 4 && (
                          <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[8px] font-bold text-slate-500">
                            +{meeting.participants.length - 4}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {meeting.hasRecording ? (
                      <Badge variant="outline" className="border-red-200 text-red-600 bg-red-50 dark:bg-red-900/20 dark:border-red-900 flex w-fit gap-1 items-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        Recorded
                      </Badge>
                    ) : (
                      <span className="text-xs text-slate-400 italic">No recording</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`meeting-action-${meeting.id}`}>
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onViewDetails?.(meeting.id)} data-testid={`view-details-${meeting.id}`}>
                          <Eye className="w-4 h-4 mr-2" /> View Details
                        </DropdownMenuItem>
                        {meeting.hasRecording && (
                          <>
                            <DropdownMenuItem onClick={() => handleDownload(meeting)} data-testid={`download-recording-${meeting.id}`}>
                              <Download className="w-4 h-4 mr-2" /> Download Recording
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleShare(meeting)} data-testid={`share-recording-${meeting.id}`}>
                              <Share2 className="w-4 h-4 mr-2" /> Share Recording
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => setDeleteId(meeting.id)} data-testid={`delete-meeting-${meeting.id}`}>
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {filteredHistory.length === 0 && (
          <div className="p-12 text-center text-slate-500">
            <Video className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No meetings found</p>
            <p className="text-sm mt-1">{searchQuery ? 'Try a different search term.' : 'Schedule or record a meeting to see it here.'}</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Meeting</DialogTitle>
            <DialogDescription>
              This will permanently delete this meeting and its recording. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)} disabled={deleting}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting} data-testid="confirm-delete-meeting">
              {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Trash2 className="w-4 h-4 mr-1.5" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={!!shareUrl} onOpenChange={(open) => !open && setShareUrl(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Meeting</DialogTitle>
            <DialogDescription>Copy the link below to share this meeting.</DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <Input readOnly value={shareUrl || ''} className="text-sm" data-testid="share-link-input" />
            <Button size="sm" onClick={handleCopyLink} data-testid="copy-share-link-btn">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MeetingHistorySection;
