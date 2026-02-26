import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, Link } from 'react-router-dom';
import { Loader2, Video, Clock, Calendar, ArrowLeft, Download, Play, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const API_BASE = window.location.origin;

const SharedRecordingPage = () => {
  const { shareToken } = useParams();
  const [recording, setRecording] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [loadingVideo, setLoadingVideo] = useState(false);

  useEffect(() => {
    const fetchRecording = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/recordings/shared/${shareToken}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('This recording is no longer available or the link has expired.');
          } else {
            setError('Failed to load recording.');
          }
          return;
        }
        
        const data = await response.json();
        setRecording(data);
      } catch (err) {
        console.error('Error fetching shared recording:', err);
        setError('Unable to load recording. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };

    if (shareToken) {
      fetchRecording();
    }
  }, [shareToken]);

  const loadVideo = async () => {
    if (!recording || videoUrl) return;
    
    setLoadingVideo(true);
    try {
      const response = await fetch(`${API_BASE}/api/recordings/shared/${shareToken}/stream`);
      
      if (response.ok) {
        const blob = await response.blob();
        setVideoUrl(URL.createObjectURL(blob));
      } else {
        setError('Failed to load video content.');
      }
    } catch (err) {
      console.error('Error loading video:', err);
      setError('Failed to load video.');
    } finally {
      setLoadingVideo(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-rose-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading recording...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Recording Not Available</h1>
          <p className="text-gray-500 mb-6">{error}</p>
          <Link to="/">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Go to Home
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <Helmet>
        <title>{recording?.title || 'Shared Recording'} | Munal</title>
      </Helmet>

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to="/">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <p className="text-sm text-gray-500">Shared Recording</p>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{recording?.title}</h1>
          </div>
        </div>

        {/* Video Player */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden"
        >
          <div className="aspect-video bg-gray-900 relative">
            {videoUrl ? (
              <video 
                src={videoUrl} 
                controls 
                autoPlay
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Video className="w-16 h-16 text-gray-600 mb-4" />
                <Button 
                  onClick={loadVideo} 
                  disabled={loadingVideo}
                  className="gap-2 bg-rose-500 hover:bg-rose-600"
                  size="lg"
                >
                  {loadingVideo ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Play className="w-5 h-5" />
                  )}
                  {loadingVideo ? 'Loading...' : 'Play Recording'}
                </Button>
              </div>
            )}
          </div>

          {/* Recording Info */}
          <div className="p-6">
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {formatTime(recording?.duration || 0)}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {formatDate(recording?.created_at)}
              </span>
              {recording?.file_size && (
                <span>{formatFileSize(recording.file_size)}</span>
              )}
              {recording?.category && (
                <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                  {recording.category}
                </span>
              )}
            </div>

            {videoUrl && (
              <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                <a 
                  href={videoUrl} 
                  download={`${recording?.title || 'recording'}.webm`}
                  className="inline-flex"
                >
                  <Button variant="outline" className="gap-2">
                    <Download className="w-4 h-4" /> Download Recording
                  </Button>
                </a>
              </div>
            )}
          </div>
        </motion.div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-400">
          <p>Shared via <span className="font-semibold text-rose-500">Munal AI</span></p>
        </div>
      </div>
    </div>
  );
};

export default SharedRecordingPage;
