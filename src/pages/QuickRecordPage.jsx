import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { Video } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { teamService } from '@/services/teamService';

import { RecordingControls } from '@/components/recordings/RecordingControls';
import { SavedRecordingsList } from '@/components/recordings/SavedRecordingsList';
import { ShareRecordingDialog } from '@/components/recordings/ShareRecordingDialog';
import { EditRecordingDialog } from '@/components/recordings/EditRecordingDialog';
import { TranscriptDialog } from '@/components/recordings/TranscriptDialog';

const MAX_RECORDING_TIME = 30 * 60;
const API_BASE = window.location.origin;
const PAGE_SIZE = 50;

const QuickRecordPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Recording state
  const [recordingType, setRecordingType] = useState(null);
  const [includeMicrophone, setIncludeMicrophone] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Uncategorized');
  
  // Saved recordings state
  const [savedRecordings, setSavedRecordings] = useState([]);
  const [totalRecordings, setTotalRecordings] = useState(0);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [isLoadingRecordings, setIsLoadingRecordings] = useState(true);
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [categories, setCategories] = useState([]);
  const [filterCategory, setFilterCategory] = useState('All');
  
  // Share dialog state
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareRecording, setShareRecording] = useState(null);
  const [isSharing, setIsSharing] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [shareTab, setShareTab] = useState('link');
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [sharedWithMe, setSharedWithMe] = useState([]);
  const [showSharedWithMe, setShowSharedWithMe] = useState(false);
  
  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editRecordingId, setEditRecordingId] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Transcript dialog state
  const [transcriptDialogOpen, setTranscriptDialogOpen] = useState(false);
  const [transcriptRecording, setTranscriptRecording] = useState(null);
  
  // Refs
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const livePreviewRef = useRef(null);

  const userId = user?.id || 'anonymous';

  // ============== Fetch ==============
  const fetchRecordings = useCallback(async (offset = 0, append = false) => {
    if (!userId || userId === 'anonymous') { setIsLoadingRecordings(false); return; }
    
    try {
      const catParam = filterCategory !== 'All' ? `&category=${encodeURIComponent(filterCategory)}` : '';
      const [recResponse, catResponse, sharedResponse] = await Promise.all([
        fetch(`${API_BASE}/api/recordings/${userId}?limit=${PAGE_SIZE}&offset=${offset}${catParam}`),
        fetch(`${API_BASE}/api/recordings/user/${userId}/categories`),
        fetch(`${API_BASE}/api/recordings/user/${userId}/shared-with-me`)
      ]);
      
      if (recResponse.ok) {
        const data = await recResponse.json();
        if (append) {
          setSavedRecordings(prev => [...prev, ...(data.recordings || [])]);
        } else {
          setSavedRecordings(data.recordings || []);
        }
        setTotalRecordings(data.total || 0);
        setCurrentOffset(offset + (data.recordings?.length || 0));
      }
      if (catResponse.ok) { setCategories((await catResponse.json()).categories || []); }
      if (sharedResponse.ok) {
        const data = await sharedResponse.json();
        setSharedWithMe((data.recordings || []).map(rec => ({
          ...rec, ownerInfo: teamService.getUserById(rec.user_id)
        })));
      }
    } catch (err) {
      console.error('Error fetching recordings:', err);
    } finally {
      setIsLoadingRecordings(false);
    }
  }, [userId, filterCategory]);

  useEffect(() => { fetchRecordings(); }, [fetchRecordings]);

  const loadMore = () => fetchRecordings(currentOffset, true);

  // ============== Recording Logic ==============
  const cleanup = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(track => track.stop()); streamRef.current = null; }
    if (mediaRecorderRef.current) { mediaRecorderRef.current = null; }
    chunksRef.current = [];
  }, []);

  useEffect(() => {
    return () => { cleanup(); if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [cleanup, previewUrl]);

  const startRecording = async () => {
    if (!recordingType) { toast({ variant: "destructive", title: "Select recording type" }); return; }
    try {
      cleanup(); chunksRef.current = []; setSelectedRecording(null);
      let stream;
      if (recordingType === 'screen') {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: { cursor: 'always', displaySurface: 'monitor' }, audio: false });
        if (includeMicrophone) {
          try {
            const audioStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
            stream = new MediaStream([...screenStream.getVideoTracks(), ...audioStream.getAudioTracks()]);
            screenStream.getVideoTracks()[0].onended = () => { audioStream.getTracks().forEach(t => t.stop()); stopRecording(); };
          } catch { stream = screenStream; }
        } else { stream = screenStream; }
        screenStream.getVideoTracks()[0].onended = () => stopRecording();
      } else {
        stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }, audio: includeMicrophone ? { echoCancellation: true, noiseSuppression: true } : false });
      }
      streamRef.current = stream;
      setIsRecording(true); setIsPaused(false); setRecordingTime(0); setRecordedBlob(null); setPreviewUrl(null);
      setTimeout(() => { if (livePreviewRef.current) { livePreviewRef.current.srcObject = stream; livePreviewRef.current.play().catch(() => {}); } }, 100);
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm';
      const mediaRecorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 2500000 });
      mediaRecorder.ondataavailable = (e) => { if (e.data?.size > 0) chunksRef.current.push(e.data); };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setRecordedBlob(blob); setPreviewUrl(URL.createObjectURL(blob));
        streamRef.current?.getTracks().forEach(t => t.stop());
      };
      mediaRecorderRef.current = mediaRecorder; mediaRecorder.start(1000);
      timerRef.current = setInterval(() => { setRecordingTime(prev => { if (prev >= MAX_RECORDING_TIME - 1) { stopRecording(); return prev; } return prev + 1; }); }, 1000);
      toast({ title: "Recording started" });
    } catch (err) {
      cleanup();
      toast({ variant: "destructive", title: "Recording failed", description: err.name === 'NotAllowedError' ? "Permission denied." : "Could not start recording." });
    }
  };

  const stopRecording = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (mediaRecorderRef.current?.state !== 'inactive') mediaRecorderRef.current?.stop();
    setIsRecording(false); setIsPaused(false);
    if (livePreviewRef.current) livePreviewRef.current.srcObject = null;
  }, []);

  const togglePause = () => {
    if (!mediaRecorderRef.current) return;
    if (isPaused) {
      mediaRecorderRef.current.resume();
      timerRef.current = setInterval(() => { setRecordingTime(prev => { if (prev >= MAX_RECORDING_TIME - 1) { stopRecording(); return prev; } return prev + 1; }); }, 1000);
      setIsPaused(false);
    } else {
      mediaRecorderRef.current.pause();
      if (timerRef.current) clearInterval(timerRef.current);
      setIsPaused(true);
    }
  };

  const saveRecording = async () => {
    if (!recordedBlob || userId === 'anonymous') { toast({ variant: "destructive", title: "Please log in to save." }); return; }
    setIsSaving(true);
    try {
      const reader = new FileReader();
      const base64Data = await new Promise((resolve, reject) => { reader.onloadend = () => resolve(reader.result.split(',')[1]); reader.onerror = reject; reader.readAsDataURL(recordedBlob); });
      const response = await fetch(`${API_BASE}/api/recordings`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, title: `Recording ${new Date().toLocaleString()}`, recording_type: recordingType, duration: recordingTime, file_data: base64Data, mime_type: recordedBlob.type || 'video/webm', category: selectedCategory })
      });
      if (response.ok) {
        toast({ title: "Recording saved" }); await fetchRecordings();
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setRecordedBlob(null); setPreviewUrl(null); setRecordingTime(0); setRecordingType(null);
      } else throw new Error('Failed to save');
    } catch { toast({ variant: "destructive", title: "Save failed" }); }
    finally { setIsSaving(false); }
  };

  const downloadRecording = () => {
    if (!recordedBlob) return;
    const url = URL.createObjectURL(recordedBlob);
    const a = document.createElement('a'); a.href = url;
    a.download = `munal-recording-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    toast({ title: "Download started" });
  };

  const discardRecording = () => { if (previewUrl) URL.revokeObjectURL(previewUrl); setRecordedBlob(null); setPreviewUrl(null); setRecordingTime(0); setRecordingType(null); };
  const recordAgain = () => { if (previewUrl) URL.revokeObjectURL(previewUrl); setRecordedBlob(null); setPreviewUrl(null); setRecordingTime(0); };

  // ============== Saved Recording Actions ==============
  const playSavedRecording = async (recording) => {
    if (selectedRecording?.id === recording.id) { setSelectedRecording(null); return; }
    setIsLoadingVideo(true); setSelectedRecording(recording);
    try {
      const ownerId = recording.user_id || userId;
      const response = await fetch(`${API_BASE}/api/recordings/${ownerId}/${recording.id}/stream`);
      if (response.ok) { const blob = await response.blob(); setSelectedRecording({ ...recording, videoUrl: URL.createObjectURL(blob) }); }
      else throw new Error('Stream unavailable');
    } catch { toast({ variant: "destructive", title: "Could not load recording." }); setSelectedRecording(null); }
    finally { setIsLoadingVideo(false); }
  };

  const downloadSavedRecording = async (recording) => {
    toast({ title: "Preparing download..." });
    try {
      const ownerId = recording.user_id || userId;
      const response = await fetch(`${API_BASE}/api/recordings/${ownerId}/${recording.id}/stream`);
      if (response.ok) {
        const blob = await response.blob(); const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `${recording.title.replace(/[^a-z0-9]/gi, '_')}.webm`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
        toast({ title: "Download started" });
      } else throw new Error();
    } catch { toast({ variant: "destructive", title: "Download failed" }); }
  };

  const deleteSavedRecording = async (recording) => {
    try {
      const response = await fetch(`${API_BASE}/api/recordings/${userId}/${recording.id}`, { method: 'DELETE' });
      if (response.ok) {
        toast({ title: "Recording deleted" }); setSavedRecordings(prev => prev.filter(r => r.id !== recording.id));
        setTotalRecordings(prev => prev - 1);
        if (selectedRecording?.id === recording.id) setSelectedRecording(null);
      }
    } catch { toast({ variant: "destructive", title: "Could not delete recording." }); }
  };

  const togglePinRecording = async (recording) => {
    try {
      const response = await fetch(`${API_BASE}/api/recordings/${userId}/${recording.id}/pin`, { method: 'PUT' });
      if (response.ok) {
        const data = await response.json();
        toast({ title: data.pinned ? "Recording pinned" : "Recording unpinned", description: data.pinned ? "This recording won't auto-delete." : "Will expire in 7 days." });
        setSavedRecordings(prev => prev.map(r => r.id === recording.id ? { ...r, pinned: data.pinned, expires_at: data.recording.expires_at } : r)
          .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || new Date(b.created_at) - new Date(a.created_at)));
      }
    } catch { toast({ variant: "destructive", title: "Failed to pin recording" }); }
  };

  // ============== Edit ==============
  const openEditDialog = (recording) => { setEditRecordingId(recording.id); setEditTitle(recording.title); setEditCategory(recording.category || 'Uncategorized'); setEditDialogOpen(true); };
  const saveEdit = async () => {
    if (!editRecordingId) return;
    setIsUpdating(true);
    try {
      const response = await fetch(`${API_BASE}/api/recordings/${userId}/${editRecordingId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: editTitle, category: editCategory })
      });
      if (response.ok) { await fetchRecordings(); setEditDialogOpen(false); toast({ title: "Recording updated" }); }
    } catch { toast({ variant: "destructive", title: "Failed to update" }); }
    finally { setIsUpdating(false); }
  };

  // ============== Transcript ==============
  const openTranscriptDialog = (recording) => { setTranscriptRecording(recording); setTranscriptDialogOpen(true); };

  // ============== Share ==============
  const openShareDialog = async (recording) => {
    setShareRecording(recording);
    setShareLink(recording.share_token ? `${window.location.origin}/shared/recording/${recording.share_token}` : '');
    setSelectedMembers(recording.shared_with || []); setShareTab('link'); setMemberSearch('');
    const members = await teamService.fetchAllUsers(userId);
    setTeamMembers(members); setShareDialogOpen(true);
  };

  const generateShareLink = async () => {
    if (!shareRecording) return; setIsSharing(true);
    try {
      const response = await fetch(`${API_BASE}/api/recordings/${userId}/${shareRecording.id}/share`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_public: true, share_with_users: selectedMembers })
      });
      if (response.ok) {
        const data = await response.json();
        const shareUrl = data.share_url || `/shared/recording/${data.recording?.share_token}`;
        setShareLink(`${window.location.origin}${shareUrl}`); await fetchRecordings(); toast({ title: "Share link generated!" });
      }
    } catch { toast({ variant: "destructive", title: "Failed to generate link" }); }
    finally { setIsSharing(false); }
  };

  const shareWithMembers = async () => {
    if (!shareRecording || selectedMembers.length === 0) return; setIsSharing(true);
    try {
      const response = await fetch(`${API_BASE}/api/recordings/${userId}/${shareRecording.id}/share`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_public: false, share_with_users: selectedMembers })
      });
      if (response.ok) { await fetchRecordings(); toast({ title: "Recording shared!" }); setShareDialogOpen(false); }
    } catch { toast({ variant: "destructive", title: "Failed to share" }); }
    finally { setIsSharing(false); }
  };

  const copyShareLink = () => { navigator.clipboard.writeText(shareLink); setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000); toast({ title: "Link copied!" }); };

  const removeSharing = async () => {
    if (!shareRecording) return;
    try { await fetch(`${API_BASE}/api/recordings/${userId}/${shareRecording.id}/share`, { method: 'DELETE' }); setShareLink(''); await fetchRecordings(); toast({ title: "Sharing removed" }); }
    catch { toast({ variant: "destructive", title: "Failed to remove sharing" }); }
  };

  const toggleMemberSelection = (id) => setSelectedMembers(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
  const filteredTeamMembers = teamMembers.filter(m => m.name.toLowerCase().includes(memberSearch.toLowerCase()) || m.email.toLowerCase().includes(memberSearch.toLowerCase()));

  // Filter recordings by category
  const filteredRecordings = filterCategory === 'All' ? savedRecordings : savedRecordings.filter(r => (r.category || 'Uncategorized') === filterCategory);

  return (
    <div className="min-h-[calc(100vh-120px)] bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8">
      <Helmet><title>Quick Record | Munal</title></Helmet>

      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-rose-500/20">
            <Video className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Quick Record</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecordingControls
            recordingType={recordingType} setRecordingType={setRecordingType}
            includeMicrophone={includeMicrophone} setIncludeMicrophone={setIncludeMicrophone}
            selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory}
            isRecording={isRecording} isPaused={isPaused} recordedBlob={recordedBlob}
            previewUrl={previewUrl} recordingTime={recordingTime} isSaving={isSaving}
            selectedRecording={selectedRecording} isLoadingVideo={isLoadingVideo} livePreviewRef={livePreviewRef}
            onStart={startRecording} onStop={stopRecording} onTogglePause={togglePause}
            onSave={saveRecording} onDownload={downloadRecording} onRecordAgain={recordAgain}
            onDiscard={discardRecording} onClosePlayer={() => setSelectedRecording(null)}
          />
        </div>

        <div className="lg:col-span-1">
          <SavedRecordingsList
            isLoading={isLoadingRecordings} recordings={filteredRecordings}
            sharedRecordings={sharedWithMe} categories={categories}
            showSharedWithMe={showSharedWithMe} setShowSharedWithMe={setShowSharedWithMe}
            filterCategory={filterCategory} setFilterCategory={setFilterCategory}
            selectedRecording={selectedRecording}
            onPlay={playSavedRecording} onDownload={downloadSavedRecording}
            onEdit={openEditDialog} onShare={openShareDialog}
            onDelete={deleteSavedRecording} onPin={togglePinRecording}
            onViewTranscript={openTranscriptDialog}
            hasMore={currentOffset < totalRecordings} onLoadMore={loadMore} total={totalRecordings}
          />
        </div>
      </div>

      <ShareRecordingDialog
        open={shareDialogOpen} onOpenChange={setShareDialogOpen}
        shareLink={shareLink} linkCopied={linkCopied} isSharing={isSharing}
        shareTab={shareTab} setShareTab={setShareTab}
        teamMembers={teamMembers} filteredTeamMembers={filteredTeamMembers}
        selectedMembers={selectedMembers} memberSearch={memberSearch} setMemberSearch={setMemberSearch}
        onCopyLink={copyShareLink} onGenerateLink={generateShareLink}
        onShareWithMembers={shareWithMembers} onRemoveSharing={removeSharing}
        onToggleMember={toggleMemberSelection} onClearMembers={() => setSelectedMembers([])}
      />

      <EditRecordingDialog
        open={editDialogOpen} onOpenChange={setEditDialogOpen}
        editTitle={editTitle} setEditTitle={setEditTitle}
        editCategory={editCategory} setEditCategory={setEditCategory}
        isUpdating={isUpdating} onSave={saveEdit}
      />

      <TranscriptDialog
        open={transcriptDialogOpen} onOpenChange={setTranscriptDialogOpen}
        recording={transcriptRecording} userId={userId}
        onRetranscribe={() => fetchRecordings()}
      />
    </div>
  );
};

export default QuickRecordPage;
