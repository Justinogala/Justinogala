import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { 
  Video, Trash2, Download, Eye, Search, RefreshCw, 
  Loader2, AlertCircle, Clock, HardDrive, Film
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const API_URL = import.meta.env.REACT_APP_BACKEND_URL || '';

const AdminVideoHistoryPage = () => {
  const { toast } = useToast();
  const [videos, setVideos] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [loadingVideo, setLoadingVideo] = useState(false);

  useEffect(() => {
    loadVideos();
    loadStats();
  }, []);

  const loadVideos = async (searchQuery = '') => {
    setLoading(true);
    try {
      const url = searchQuery 
        ? `${API_URL}/api/admin/video-history?search=${encodeURIComponent(searchQuery)}`
        : `${API_URL}/api/admin/video-history`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setVideos(data.videos || []);
      }
    } catch (error) {
      console.error('Error loading videos:', error);
      toast({ variant: 'destructive', title: 'Failed to load videos' });
    }
    setLoading(false);
  };

  const loadStats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/video-history/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadVideos(search);
  };

  const handleViewVideo = async (videoId) => {
    setLoadingVideo(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/video-history/${videoId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedVideo(data);
        setShowVideoDialog(true);
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to load video' });
    }
    setLoadingVideo(false);
  };

  const handleDownload = (video) => {
    if (!video?.video_base64) return;
    const link = document.createElement('a');
    link.href = `data:video/mp4;base64,${video.video_base64}`;
    link.download = `${video.title || 'video'}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: 'Video downloaded' });
  };

  const handleDelete = async (videoId) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/video-history/${videoId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        toast({ title: 'Video deleted' });
        loadVideos(search);
        loadStats();
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to delete video' });
    }
  };

  const handleDeleteAll = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/video-history`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const data = await res.json();
        toast({ title: `Deleted ${data.deleted_count} videos` });
        loadVideos();
        loadStats();
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to delete videos' });
    }
    setShowDeleteAllDialog(false);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '-';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <>
      <Helmet>
        <title>Video History | Admin | Munal</title>
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Video className="w-7 h-7 text-fuchsia-500" />
              Video History
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Manage AI-generated videos. Videos auto-delete after 7 days.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { loadVideos(search); loadStats(); }}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => setShowDeleteAllDialog(true)}
              disabled={videos.length === 0}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete All
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 bg-fuchsia-100 dark:bg-fuchsia-900/30 rounded-lg">
                  <Film className="w-6 h-6 text-fuchsia-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Videos</p>
                  <p className="text-2xl font-bold">{stats.total_videos}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <HardDrive className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Storage Used</p>
                  <p className="text-2xl font-bold">{stats.total_storage_mb} MB</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">4s Videos</p>
                  <p className="text-2xl font-bold">{stats.videos_by_duration?.["4"] || 0}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Extended Videos</p>
                  <p className="text-2xl font-bold">
                    {(stats.videos_by_duration?.["24"] || 0) + 
                     (stats.videos_by_duration?.["36"] || 0) + 
                     (stats.videos_by_duration?.["48"] || 0) + 
                     (stats.videos_by_duration?.["60"] || 0)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by title or prompt..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit" variant="outline">Search</Button>
        </form>

        {/* Videos Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-fuchsia-500" />
              </div>
            ) : videos.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Video className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No videos found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Prompt</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Expires In</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {videos.map((video) => (
                    <TableRow key={video.id}>
                      <TableCell className="font-medium">{video.title}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-gray-500">
                        {video.prompt}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{video.duration}s</Badge>
                      </TableCell>
                      <TableCell>{formatFileSize(video.file_size)}</TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {formatDate(video.created_at)}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={video.days_until_deletion <= 2 ? "destructive" : "secondary"}
                          className="text-xs"
                        >
                          {video.days_until_deletion} days
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewVideo(video.id)}
                            disabled={loadingVideo}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={async () => {
                              const res = await fetch(`${API_URL}/api/admin/video-history/${video.id}`);
                              const data = await res.json();
                              handleDownload(data);
                            }}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-500 hover:text-red-600"
                            onClick={() => handleDelete(video.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Video Preview Dialog */}
      <Dialog open={showVideoDialog} onOpenChange={setShowVideoDialog}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedVideo?.title || 'Video Preview'}</DialogTitle>
          </DialogHeader>
          {selectedVideo && (
            <div className="space-y-4">
              <video
                src={`data:video/mp4;base64,${selectedVideo.video_base64}`}
                controls
                autoPlay
                className="w-full rounded-lg"
              />
              <div className="text-sm text-gray-500 space-y-1">
                <p><strong>Prompt:</strong> {selectedVideo.prompt}</p>
                <p><strong>Duration:</strong> {selectedVideo.duration}s | <strong>Resolution:</strong> {selectedVideo.size}</p>
                <p><strong>File Size:</strong> {formatFileSize(selectedVideo.file_size)}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVideoDialog(false)}>Close</Button>
            <Button onClick={() => handleDownload(selectedVideo)}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete All Confirmation */}
      <AlertDialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Videos?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all {videos.length} videos from history.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAll} className="bg-red-600 hover:bg-red-700">
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AdminVideoHistoryPage;
