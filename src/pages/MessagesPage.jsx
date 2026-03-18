import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { 
  Loader2, Send, Search, Inbox, SendHorizontal, Star, 
  Trash2, Reply, Plus, Mail, ArrowLeft, RefreshCw,
  FileEdit, AlertCircle, RotateCcw, Trash, MoreHorizontal,
  Paperclip, X, FileText, Image, File, Download, Settings, Menu,
  Sparkles, Wand2, ListChecks, MessageSquareText, Zap, Smile, AtSign
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import PageTransition from '@/components/PageTransition';

import { getApiUrl, API_URL } from '@/lib/api';

const MessagesPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('inbox');
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [thread, setThread] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [counts, setCounts] = useState({ inbox_unread: 0, drafts: 0, junk: 0, trash: 0 });
  const [users, setUsers] = useState({});
  
  // Compose modal state
  const [showCompose, setShowCompose] = useState(false);
  const [editingDraft, setEditingDraft] = useState(null);
  const [composeRecipient, setComposeRecipient] = useState(null);
  const [composeSubject, setComposeSubject] = useState('');
  const [composeContent, setComposeContent] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);

  // CC / BCC state
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [ccRecipients, setCcRecipients] = useState([]);
  const [bccRecipients, setBccRecipients] = useState([]);
  const [ccSearchQuery, setCcSearchQuery] = useState('');
  const [bccSearchQuery, setBccSearchQuery] = useState('');
  const [ccSearchResults, setCcSearchResults] = useState([]);
  const [bccSearchResults, setBccSearchResults] = useState([]);
  const [activeSearchField, setActiveSearchField] = useState(null); // 'to' | 'cc' | 'bcc'
  
  // Attachment state
  const [attachments, setAttachments] = useState([]);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const fileInputRef = useRef(null);
  
  // Reply state
  const [replyContent, setReplyContent] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [replyAttachments, setReplyAttachments] = useState([]);
  const [uploadingReplyAttachment, setUploadingReplyAttachment] = useState(false);
  const replyFileInputRef = useRef(null);

  // AI features state
  const [smartReplies, setSmartReplies] = useState([]);
  const [loadingSmartReplies, setLoadingSmartReplies] = useState(false);
  const [threadSummary, setThreadSummary] = useState('');
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [suggestedActions, setSuggestedActions] = useState([]);
  const [loadingActions, setLoadingActions] = useState(false);
  const [draftingReply, setDraftingReply] = useState(false);
  const [aiSettings, setAiSettings] = useState(null);

  // AI Compose state
  const [aiPrompt, setAiPrompt] = useState('');
  const [composingWithAi, setComposingWithAi] = useState(false);
  const [showAiCompose, setShowAiCompose] = useState(false);

  const handleAiCompose = async () => {
    if (!aiPrompt.trim()) return;
    setComposingWithAi(true);
    try {
      const res = await fetch(`${API_URL}/api/messages/ai/compose`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          message_content: aiPrompt,
          sender_name: composeRecipient?.name || '',
        }),
      });
      const data = await res.json();
      if (data.success && data.subject && data.body) {
        setComposeSubject(data.subject);
        setComposeContent(data.body);
        setShowAiCompose(false);
        setAiPrompt('');
        toast({ title: 'AI Compose', description: 'Subject and message generated — review and edit before sending' });
      } else {
        toast({ variant: 'destructive', title: 'AI Compose failed', description: data.error || 'Try rephrasing your prompt' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'AI Compose failed' });
    }
    setComposingWithAi(false);
  };

  // Fetch message counts
  const fetchCounts = useCallback(async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(`${API_URL}/api/messages/counts/${user.id}`);
      const data = await response.json();
      if (data.success) {
        setCounts(data.counts);
      }
    } catch (error) {
      console.error('Error fetching counts:', error);
    }
  }, [user?.id]);

  // Fetch messages based on active tab
  const fetchMessages = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      let endpoint = '';
      switch (activeTab) {
        case 'inbox': endpoint = 'inbox'; break;
        case 'sent': endpoint = 'sent'; break;
        case 'drafts': endpoint = 'drafts'; break;
        case 'junk': endpoint = 'junk'; break;
        case 'trash': endpoint = 'trash'; break;
        default: endpoint = 'inbox';
      }
      
      const response = await fetch(`${API_URL}/api/messages/${endpoint}/${user.id}`);
      const data = await response.json();
      if (data.success) {
        setMessages(data.messages);
        setUsers(data.senders || data.recipients || data.users || {});
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({ title: 'Error', description: 'Failed to load messages', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [user?.id, activeTab, toast]);

  // Fetch message thread
  const fetchThread = useCallback(async (messageId) => {
    try {
      const response = await fetch(`${API_URL}/api/messages/thread/${messageId}`);
      const data = await response.json();
      if (data.success) {
        setThread(data.thread);
        setUsers(prev => ({ ...prev, ...data.participants }));
      }
    } catch (error) {
      console.error('Error fetching thread:', error);
    }
  }, []);

  // Search users
  const searchUsers = useCallback(async (query) => {
    if (!query || query.length < 2 || !user?.id) {
      setUserSearchResults([]);
      return;
    }
    setSearchingUsers(true);
    try {
      const response = await fetch(`${API_URL}/api/messages/users/search?q=${encodeURIComponent(query)}&current_user_id=${user.id}`);
      const data = await response.json();
      if (data.success) {
        setUserSearchResults(data.users);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearchingUsers(false);
    }
  }, [user?.id]);

  // Generic user search for CC/BCC
  const searchUsersFor = useCallback(async (query, setResults) => {
    if (!query || query.length < 2 || !user?.id) { setResults([]); return; }
    try {
      const response = await fetch(`${API_URL}/api/messages/users/search?q=${encodeURIComponent(query)}&current_user_id=${user.id}`);
      const data = await response.json();
      if (data.success) setResults(data.users);
    } catch { /* silent */ }
  }, [user?.id]);

  useEffect(() => {
    fetchMessages();
    fetchCounts();
  }, [activeTab, fetchMessages, fetchCounts]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      searchUsers(userSearchQuery);
    }, 300);
    return () => clearTimeout(debounce);
  }, [userSearchQuery, searchUsers]);

  // Debounced search for CC/BCC
  useEffect(() => {
    const t = setTimeout(() => searchUsersFor(ccSearchQuery, setCcSearchResults), 300);
    return () => clearTimeout(t);
  }, [ccSearchQuery, searchUsersFor]);

  useEffect(() => {
    const t = setTimeout(() => searchUsersFor(bccSearchQuery, setBccSearchResults), 300);
    return () => clearTimeout(t);
  }, [bccSearchQuery, searchUsersFor]);

  // Open message
  const openMessage = async (message) => {
    if (message.is_draft) {
      // Open draft for editing
      setEditingDraft(message);
      setComposeRecipient(message.recipient_id ? { id: message.recipient_id, name: message.recipient_name } : null);
      setComposeSubject(message.subject || '');
      setComposeContent(message.content || '');
      setAttachments(message.attachments || []);
      setShowCompose(true);
      return;
    }
    
    setSelectedMessage(message);
    await fetchThread(message.id);
    
    // Mark as read if unread
    if (!message.is_read && message.recipient_id === user?.id) {
      try {
        await fetch(`${API_URL}/api/messages/read/${message.id}`, { method: 'PUT' });
        setMessages(prev => prev.map(m => m.id === message.id ? { ...m, is_read: true } : m));
        fetchCounts();
      } catch (error) {
        console.error('Error marking as read:', error);
      }
    }
  };

  // Reset compose form
  const resetCompose = () => {
    setShowCompose(false);
    setEditingDraft(null);
    setComposeRecipient(null);
    setComposeSubject('');
    setComposeContent('');
    setUserSearchQuery('');
    setUserSearchResults([]);
    setAttachments([]);
    setShowCcBcc(false);
    setCcRecipients([]);
    setBccRecipients([]);
    setCcSearchQuery('');
    setBccSearchQuery('');
    setCcSearchResults([]);
    setBccSearchResults([]);
    setShowAiCompose(false);
    setAiPrompt('');
  };

  // Handle file upload
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    setUploadingAttachment(true);
    try {
      for (const file of files) {
        // Check file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          toast({ title: 'Error', description: `${file.name} is too large. Maximum size is 10MB`, variant: 'destructive' });
          continue;
        }
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('user_id', user.id);
        
        const response = await fetch(`${API_URL}/api/messages/attachments/upload`, {
          method: 'POST',
          body: formData
        });
        
        const data = await response.json();
        if (data.success) {
          setAttachments(prev => [...prev, data.attachment]);
        } else {
          toast({ title: 'Error', description: `Failed to upload ${file.name}`, variant: 'destructive' });
        }
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({ title: 'Error', description: 'Failed to upload files', variant: 'destructive' });
    } finally {
      setUploadingAttachment(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Remove attachment
  const removeAttachment = async (attachmentId) => {
    try {
      await fetch(`${API_URL}/api/messages/attachments/${attachmentId}?user_id=${user.id}`, {
        method: 'DELETE'
      });
      setAttachments(prev => prev.filter(a => a.id !== attachmentId));
    } catch (error) {
      console.error('Error removing attachment:', error);
    }
  };

  // Get file icon based on type
  const getFileIcon = (contentType, filename) => {
    // Check by content type first
    if (contentType?.startsWith('image/')) return Image;
    if (contentType?.includes('pdf')) return FileText;
    if (contentType?.includes('word') || contentType?.includes('document')) return FileText;
    if (contentType?.includes('spreadsheet') || contentType?.includes('excel')) return FileText;
    if (contentType?.includes('presentation') || contentType?.includes('powerpoint')) return FileText;
    if (contentType?.includes('json') || contentType?.includes('javascript') || contentType?.includes('text/')) return FileText;
    
    // Check by file extension as fallback
    if (filename) {
      const ext = filename.split('.').pop()?.toLowerCase();
      const textExts = ['txt', 'md', 'json', 'xml', 'csv', 'js', 'ts', 'jsx', 'tsx', 'py', 'html', 'css', 'yaml', 'yml'];
      const docExts = ['doc', 'docx', 'pdf', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp'];
      const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'];
      
      if (imageExts.includes(ext)) return Image;
      if (textExts.includes(ext) || docExts.includes(ext)) return FileText;
    }
    
    return File;
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);

  // Handle drag events
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;
    
    setUploadingAttachment(true);
    try {
      for (const file of files) {
        // Check file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          toast({ title: 'Error', description: `${file.name} is too large. Maximum size is 10MB`, variant: 'destructive' });
          continue;
        }
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('user_id', user.id);
        
        const response = await fetch(`${API_URL}/api/messages/attachments/upload`, {
          method: 'POST',
          body: formData
        });
        
        const data = await response.json();
        if (data.success) {
          setAttachments(prev => [...prev, data.attachment]);
          toast({ title: 'Success', description: `${file.name} attached` });
        } else {
          toast({ title: 'Error', description: `Failed to upload ${file.name}`, variant: 'destructive' });
        }
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({ title: 'Error', description: 'Failed to upload files', variant: 'destructive' });
    } finally {
      setUploadingAttachment(false);
    }
  };

  // Send new message
  const handleSendMessage = async () => {
    if (!composeRecipient || !composeSubject.trim() || !composeContent.trim()) {
      toast({ title: 'Error', description: 'Please fill in all fields', variant: 'destructive' });
      return;
    }
    setSendingMessage(true);
    try {
      let response;
      if (editingDraft) {
        // Send draft - first update with attachments
        await fetch(`${API_URL}/api/messages/draft/${user.id}?draft_id=${editingDraft.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipient_id: composeRecipient.id,
            subject: composeSubject,
            content: composeContent,
            attachments: attachments.map(a => ({ id: a.id, filename: a.filename, size: a.size, content_type: a.content_type }))
          })
        });
        // Then send
        response = await fetch(`${API_URL}/api/messages/draft/${editingDraft.id}/send/${user.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        // Send new message
        response = await fetch(`${API_URL}/api/messages/send/${user.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipient_id: composeRecipient.id,
            subject: composeSubject,
            content: composeContent,
            attachments: attachments.map(a => ({ id: a.id, filename: a.filename, size: a.size, content_type: a.content_type })),
            cc_ids: ccRecipients.map(u => u.id),
            bcc_ids: bccRecipients.map(u => u.id),
          })
        });
      }
      const data = await response.json();
      if (data.success) {
        toast({ title: 'Success', description: 'Message sent!' });
        resetCompose();
        fetchMessages();
        fetchCounts();
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to send message', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({ title: 'Error', description: 'Failed to send message', variant: 'destructive' });
    } finally {
      setSendingMessage(false);
    }
  };

  // Save as draft
  const handleSaveDraft = async () => {
    setSavingDraft(true);
    try {
      const url = editingDraft 
        ? `${API_URL}/api/messages/draft/${user.id}?draft_id=${editingDraft.id}`
        : `${API_URL}/api/messages/draft/${user.id}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient_id: composeRecipient?.id || null,
          subject: composeSubject,
          content: composeContent,
          attachments: attachments.map(a => ({ id: a.id, filename: a.filename, size: a.size, content_type: a.content_type }))
        })
      });
      const data = await response.json();
      if (data.success) {
        toast({ title: 'Success', description: 'Draft saved!' });
        resetCompose();
        if (activeTab === 'drafts') fetchMessages();
        fetchCounts();
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to save draft', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      toast({ title: 'Error', description: 'Failed to save draft', variant: 'destructive' });
    } finally {
      setSavingDraft(false);
    }
  };

  // Send reply
  const handleSendReply = async () => {
    if (!replyContent.trim() || !selectedMessage) return;
    setSendingReply(true);
    try {
      const response = await fetch(`${API_URL}/api/messages/reply/${selectedMessage.id}/${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyContent, attachments: replyAttachments.length > 0 ? replyAttachments : undefined })
      });
      const data = await response.json();
      if (data.success) {
        toast({ title: 'Success', description: 'Reply sent!' });
        setReplyContent('');
        setReplyAttachments([]);
        await fetchThread(selectedMessage.id);
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to send reply', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      toast({ title: 'Error', description: 'Failed to send reply', variant: 'destructive' });
    } finally {
      setSendingReply(false);
    }
  };

  // Handle reply file upload
  const handleReplyFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setUploadingReplyAttachment(true);
    try {
      for (const file of files) {
        if (file.size > 10 * 1024 * 1024) {
          toast({ title: 'Error', description: `${file.name} is too large (max 10MB)`, variant: 'destructive' });
          continue;
        }
        const formData = new FormData();
        formData.append('file', file);
        formData.append('user_id', user.id);
        const response = await fetch(`${API_URL}/api/messages/attachments/upload`, { method: 'POST', body: formData });
        const data = await response.json();
        if (data.success) {
          setReplyAttachments(prev => [...prev, data.attachment]);
        } else {
          toast({ title: 'Error', description: `Failed to upload ${file.name}`, variant: 'destructive' });
        }
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to upload files', variant: 'destructive' });
    } finally {
      setUploadingReplyAttachment(false);
      if (replyFileInputRef.current) replyFileInputRef.current.value = '';
    }
  };

  const removeReplyAttachment = async (attachmentId) => {
    try {
      await fetch(`${API_URL}/api/messages/attachments/${attachmentId}?user_id=${user.id}`, { method: 'DELETE' });
      setReplyAttachments(prev => prev.filter(a => a.id !== attachmentId));
    } catch (error) {
      console.error('Error removing reply attachment:', error);
    }
  };

  // Toggle star
  const toggleStar = async (messageId, e) => {
    e.stopPropagation();
    try {
      const response = await fetch(`${API_URL}/api/messages/star/${messageId}`, { method: 'PUT' });
      const data = await response.json();
      if (data.success) {
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, is_starred: data.is_starred } : m));
      }
    } catch (error) {
      console.error('Error toggling star:', error);
    }
  };

  // Move to junk
  const moveToJunk = async (messageId, e) => {
    e?.stopPropagation();
    try {
      const response = await fetch(`${API_URL}/api/messages/junk/${messageId}`, { method: 'PUT' });
      const data = await response.json();
      if (data.success) {
        toast({ title: 'Success', description: data.is_junk ? 'Moved to junk' : 'Removed from junk' });
        fetchMessages();
        fetchCounts();
      }
    } catch (error) {
      console.error('Error moving to junk:', error);
      toast({ title: 'Error', description: 'Failed to move to junk', variant: 'destructive' });
    }
  };

  // Move to trash
  const moveToTrash = async (messageId, e) => {
    e?.stopPropagation();
    try {
      const response = await fetch(`${API_URL}/api/messages/trash/${messageId}`, { method: 'PUT' });
      const data = await response.json();
      if (data.success) {
        toast({ title: 'Success', description: 'Moved to trash' });
        fetchMessages();
        fetchCounts();
        if (selectedMessage?.id === messageId) {
          setSelectedMessage(null);
          setThread([]);
        }
      }
    } catch (error) {
      console.error('Error moving to trash:', error);
      toast({ title: 'Error', description: 'Failed to move to trash', variant: 'destructive' });
    }
  };

  // Restore from trash
  const restoreFromTrash = async (messageId, e) => {
    e?.stopPropagation();
    try {
      const response = await fetch(`${API_URL}/api/messages/restore/${messageId}`, { method: 'PUT' });
      const data = await response.json();
      if (data.success) {
        toast({ title: 'Success', description: 'Message restored' });
        fetchMessages();
        fetchCounts();
      }
    } catch (error) {
      console.error('Error restoring message:', error);
      toast({ title: 'Error', description: 'Failed to restore message', variant: 'destructive' });
    }
  };

  // Permanently delete
  const permanentlyDelete = async (messageId, e) => {
    e?.stopPropagation();
    if (!confirm('Are you sure you want to permanently delete this message?')) return;
    try {
      const response = await fetch(`${API_URL}/api/messages/${messageId}/${user.id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        toast({ title: 'Success', description: 'Message deleted permanently' });
        setMessages(prev => prev.filter(m => m.id !== messageId));
        fetchCounts();
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({ title: 'Error', description: 'Failed to delete message', variant: 'destructive' });
    }
  };

  // Empty trash
  const emptyTrash = async () => {
    if (!confirm('Are you sure you want to permanently delete all messages in trash?')) return;
    try {
      const response = await fetch(`${API_URL}/api/messages/trash/empty/${user.id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        toast({ title: 'Success', description: `Deleted ${data.deleted_count} messages` });
        fetchMessages();
        fetchCounts();
      }
    } catch (error) {
      console.error('Error emptying trash:', error);
      toast({ title: 'Error', description: 'Failed to empty trash', variant: 'destructive' });
    }
  };

  // ============ AI Features ============
  // Fetch AI settings for the current user
  const fetchAiSettings = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [sRes, aRes] = await Promise.all([
        fetch(`${API_URL}/api/messages/settings/${user.id}`),
        fetch(`${API_URL}/api/messages/assistant/${user.id}`),
      ]);
      const sData = await sRes.json();
      const aData = await aRes.json();
      setAiSettings({
        aiEnabled: sData.settings?.ai_personalization_enabled ?? true,
        smartReplies: sData.settings?.ai_smart_replies ?? true,
        autoCategorize: sData.settings?.ai_auto_categorize ?? true,
        assistantEnabled: aData.settings?.enabled ?? true,
        summarize: aData.settings?.summarize_threads ?? true,
        suggestActions: aData.settings?.suggest_actions ?? true,
        autoDraft: aData.settings?.auto_draft_replies ?? false,
      });
    } catch { /* fallback defaults */ }
  }, [user?.id]);

  useEffect(() => { fetchAiSettings(); }, [fetchAiSettings]);

  const buildAiPayload = (msg) => ({
    user_id: user.id,
    message_content: msg?.content || selectedMessage?.content || '',
    message_subject: msg?.subject || selectedMessage?.subject || '',
    sender_name: msg?.sender_name || selectedMessage?.sender_name || '',
    thread_messages: thread.map(t => ({ sender_name: t.sender_name, content: t.content })),
  });

  const fetchSmartReplies = async () => {
    if (!selectedMessage) return;
    setLoadingSmartReplies(true);
    setSmartReplies([]);
    try {
      const res = await fetch(`${API_URL}/api/messages/ai/smart-replies`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildAiPayload()),
      });
      const data = await res.json();
      if (data.success && data.replies?.length) setSmartReplies(data.replies);
    } catch { /* silent */ }
    setLoadingSmartReplies(false);
  };

  const fetchThreadSummary = async () => {
    if (!selectedMessage) return;
    setLoadingSummary(true);
    setThreadSummary('');
    try {
      const res = await fetch(`${API_URL}/api/messages/ai/summarize-thread`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildAiPayload()),
      });
      const data = await res.json();
      if (data.success && data.summary) setThreadSummary(data.summary);
    } catch { /* silent */ }
    setLoadingSummary(false);
  };

  const fetchSuggestedActions = async () => {
    if (!selectedMessage) return;
    setLoadingActions(true);
    setSuggestedActions([]);
    try {
      const res = await fetch(`${API_URL}/api/messages/ai/suggest-actions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildAiPayload()),
      });
      const data = await res.json();
      if (data.success && data.actions?.length) setSuggestedActions(data.actions);
    } catch { /* silent */ }
    setLoadingActions(false);
  };

  const handleAiDraft = async () => {
    if (!selectedMessage) return;
    setDraftingReply(true);
    try {
      const res = await fetch(`${API_URL}/api/messages/ai/draft-reply`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildAiPayload()),
      });
      const data = await res.json();
      if (data.success && data.draft) {
        setReplyContent(data.draft);
        toast({ title: 'AI Draft Ready', description: 'Review and edit before sending' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'AI Draft failed' });
    }
    setDraftingReply(false);
  };

  // Auto-load smart replies when opening a message
  useEffect(() => {
    if (selectedMessage && thread.length > 0 && aiSettings?.aiEnabled && aiSettings?.smartReplies) {
      setSmartReplies([]);
      setThreadSummary('');
      setSuggestedActions([]);
      fetchSmartReplies();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMessage?.id, thread.length]);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const filteredMessages = messages.filter(msg => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      msg.subject?.toLowerCase().includes(searchLower) ||
      msg.content?.toLowerCase().includes(searchLower) ||
      msg.sender_name?.toLowerCase().includes(searchLower) ||
      msg.recipient_name?.toLowerCase().includes(searchLower)
    );
  });

  // Mobile sidebar visibility state
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const tabs = [
    { id: 'inbox', label: 'Inbox', icon: Inbox, count: counts.inbox_unread },
    { id: 'sent', label: 'Sent', icon: SendHorizontal },
    { id: 'drafts', label: 'Drafts', icon: FileEdit, count: counts.drafts },
    { id: 'junk', label: 'Junk', icon: AlertCircle, count: counts.junk },
    { id: 'trash', label: 'Trash', icon: Trash, count: counts.trash },
  ];

  return (
    <PageTransition>
      <div className="h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)] flex flex-col md:container md:mx-auto md:px-4 md:py-6">
        
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b bg-white dark:bg-slate-900">
          <button 
            onClick={() => setShowMobileSidebar(true)}
            className="p-2 -ml-2 text-gray-600 dark:text-gray-400"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="font-semibold text-lg capitalize">{activeTab}</h1>
          <Button 
            size="icon"
            onClick={() => { resetCompose(); setShowCompose(true); }}
            className="bg-indigo-600 hover:bg-indigo-700 h-10 w-10"
            data-testid="mobile-compose-btn"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 flex gap-4 overflow-hidden">
          {/* Mobile Sidebar Overlay */}
          {showMobileSidebar && (
            <div 
              className="fixed inset-0 z-50 md:hidden"
              onClick={() => setShowMobileSidebar(false)}
            >
              <div className="absolute inset-0 bg-black/50" />
              <div 
                className="absolute left-0 top-0 bottom-0 w-72 bg-white dark:bg-slate-900 shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4 border-b flex items-center justify-between">
                  <h2 className="font-semibold">Messages</h2>
                  <Button variant="ghost" size="icon" onClick={() => setShowMobileSidebar(false)}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                <div className="p-4">
                  <Button 
                    onClick={() => { resetCompose(); setShowCompose(true); setShowMobileSidebar(false); }} 
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Compose
                  </Button>
                </div>
                <nav className="flex-1 px-2 space-y-1">
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => { 
                        setActiveTab(tab.id); 
                        setSelectedMessage(null); 
                        setShowMobileSidebar(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors",
                        activeTab === tab.id 
                          ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300" 
                          : "hover:bg-gray-100 dark:hover:bg-slate-800"
                      )}
                    >
                      <tab.icon className="w-5 h-5" />
                      <span className="flex-1">{tab.label}</span>
                      {tab.count > 0 && (
                        <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                          {tab.count}
                        </Badge>
                      )}
                    </button>
                  ))}
                </nav>
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-white dark:bg-slate-900">
                  <button
                    onClick={() => { navigate('/messages/settings'); setShowMobileSidebar(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-400"
                  >
                    <Settings className="w-5 h-5" />
                    <span>Settings</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Desktop Sidebar */}
          <Card className="hidden md:flex w-64 flex-shrink-0 flex-col bg-white dark:bg-slate-900">
            <div className="p-4">
              <Button 
                onClick={() => { resetCompose(); setShowCompose(true); }} 
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                data-testid="compose-message-btn"
              >
                <Plus className="w-4 h-4 mr-2" />
                Compose
              </Button>
            </div>
            
            <nav className="flex-1 px-2 space-y-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setSelectedMessage(null); }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                    activeTab === tab.id 
                      ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300" 
                      : "hover:bg-gray-100 dark:hover:bg-slate-800"
                  )}
                  data-testid={`${tab.id}-tab`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="flex-1">{tab.label}</span>
                  {tab.count > 0 && (
                    <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                      {tab.count}
                    </Badge>
                  )}
                </button>
              ))}
            </nav>
            
            {/* Settings Link */}
            <div className="p-2 border-t">
              <button
                onClick={() => navigate('/messages/settings')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-400"
                data-testid="message-settings-btn"
              >
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </button>
            </div>
          </Card>

          {/* Main Content */}
          <Card className={cn(
            "flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-900",
            "md:rounded-lg",
            // On mobile with selected message, show full screen
            selectedMessage ? "fixed inset-0 z-40 md:relative md:inset-auto" : ""
          )}>
            {selectedMessage ? (
              /* Message Thread View */
              <>
                <div className="p-3 md:p-4 border-b flex items-center gap-3 safe-area-top">
                  <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => { setSelectedMessage(null); setThread([]); }}>
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-base md:text-lg truncate">{selectedMessage.subject}</h2>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      {thread.length} message{thread.length !== 1 ? 's' : ''} in this conversation
                    </p>
                  </div>
                  {/* AI Summarize button */}
                  {aiSettings?.assistantEnabled && aiSettings?.summarize && thread.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchThreadSummary}
                      disabled={loadingSummary}
                      className="border-violet-200 text-violet-600 hover:bg-violet-50 dark:border-violet-800 dark:text-violet-400 dark:hover:bg-violet-950/40 shrink-0"
                      data-testid="summarize-thread-btn"
                    >
                      {loadingSummary ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <MessageSquareText className="w-3.5 h-3.5 mr-1.5" />}
                      <span className="hidden sm:inline">Summarize</span>
                    </Button>
                  )}
                </div>
                
                <ScrollArea className="flex-1 p-3 md:p-4">
                  <div className="space-y-4">
                    {thread.map((msg) => {
                      const isMe = msg.sender_id === user?.id;
                      const sender = users[msg.sender_id];
                      return (
                        <div key={msg.id} className={cn("flex gap-2 md:gap-3", isMe && "flex-row-reverse")}>
                          <Avatar className="w-8 h-8 md:w-10 md:h-10 flex-shrink-0">
                            <AvatarImage src={sender?.avatar} />
                            <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs md:text-sm">
                              {getInitials(sender?.name || msg.sender_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className={cn("flex-1 max-w-[85%] md:max-w-[70%]", isMe && "text-right")}>
                            <div className={cn(
                              "rounded-xl md:rounded-lg p-3 md:p-4",
                              isMe 
                                ? "bg-indigo-600 text-white" 
                                : "bg-gray-100 dark:bg-slate-800"
                            )}>
                              <p className={cn("text-xs mb-2", isMe ? "text-indigo-200" : "text-muted-foreground")}>
                                {msg.sender_name} • {format(new Date(msg.created_at), 'MMM d, h:mm a')}
                              </p>
                              <p className="whitespace-pre-wrap text-sm md:text-base">{msg.content}</p>
                              
                              {/* Attachments in thread */}
                              {msg.attachments && msg.attachments.length > 0 && (
                                <div className={cn("mt-3 space-y-2", isMe ? "border-t border-indigo-500/30 pt-3" : "border-t pt-3")}>
                                  <p className={cn("text-xs font-medium", isMe ? "text-indigo-200" : "text-muted-foreground")}>
                                    Attachments ({msg.attachments.length})
                                  </p>
                                  {msg.attachments.map((att) => {
                                    const FileIcon = getFileIcon(att.content_type, att.filename);
                                    return (
                                      <a
                                        key={att.id}
                                        href={`${API_URL}/api/messages/attachments/${att.id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={cn(
                                          "flex items-center gap-2 p-2 rounded transition-colors",
                                          isMe 
                                            ? "bg-indigo-500/30 hover:bg-indigo-500/40" 
                                            : "bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600"
                                        )}
                                      >
                                        <FileIcon className={cn("w-4 h-4", isMe ? "text-white" : "text-indigo-500")} />
                                        <span className={cn("text-sm flex-1 truncate", isMe && "text-white")}>{att.filename}</span>
                                        <Download className={cn("w-4 h-4", isMe ? "text-white" : "text-gray-500")} />
                                      </a>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
                
                {/* Reply Box */}
                <div className="border-t bg-gray-50 dark:bg-slate-800/50">
                  {/* AI Thread Summary */}
                  {threadSummary && (
                    <div className="px-4 pt-3" data-testid="thread-summary-panel">
                      <div className="bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1.5">
                          <MessageSquareText className="w-3.5 h-3.5 text-violet-600" />
                          <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Thread Summary</span>
                          <button onClick={() => setThreadSummary('')} className="ml-auto text-violet-400 hover:text-violet-600"><X className="w-3 h-3" /></button>
                        </div>
                        <p className="text-xs text-violet-800 dark:text-violet-200 leading-relaxed">{threadSummary}</p>
                      </div>
                    </div>
                  )}

                  {/* AI Smart Replies */}
                  {(smartReplies.length > 0 || loadingSmartReplies) && (
                    <div className="px-4 pt-3" data-testid="smart-replies-panel">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span className="text-xs font-medium text-slate-500">Smart Replies</span>
                      </div>
                      {loadingSmartReplies ? (
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <Loader2 className="w-3 h-3 animate-spin" /> Generating suggestions...
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {smartReplies.map((reply, i) => (
                            <button
                              key={i}
                              onClick={() => setReplyContent(reply)}
                              className="text-xs px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-600 dark:text-slate-300 transition-colors max-w-[280px] truncate"
                              data-testid={`smart-reply-${i}`}
                            >
                              {reply}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* AI Suggested Actions */}
                  {suggestedActions.length > 0 && (
                    <div className="px-4 pt-3" data-testid="suggested-actions-panel">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-3 h-3 text-emerald-500" />
                        <span className="text-xs font-medium text-slate-500">Suggested Actions</span>
                        <button onClick={() => setSuggestedActions([])} className="ml-auto text-slate-400 hover:text-slate-600"><X className="w-3 h-3" /></button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {suggestedActions.map((a, i) => (
                          <span
                            key={i}
                            className="text-xs px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
                            title={a.description}
                          >
                            {a.action}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Reply input + AI buttons */}
                  <div className="p-4">
                    {/* Reply Attachments */}
                    {replyAttachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {replyAttachments.map((att) => {
                          const IconComp = getFileIcon(att.content_type, att.filename);
                          return (
                            <div key={att.id} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-1.5 text-sm group" data-testid={`reply-attachment-${att.id}`}>
                              <IconComp className="w-4 h-4 text-indigo-500 shrink-0" />
                              <span className="truncate max-w-[140px]">{att.filename}</span>
                              <span className="text-xs text-slate-400">{formatFileSize(att.size)}</span>
                              <button onClick={() => removeReplyAttachment(att.id)} className="ml-1 text-slate-400 hover:text-red-500 transition-colors" data-testid={`remove-reply-att-${att.id}`}>
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-violet-300 dark:focus-within:ring-violet-700 transition-shadow">
                      <Textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Write your reply..."
                        className="border-0 focus-visible:ring-0 min-h-[60px] md:min-h-[80px] resize-none text-base rounded-none"
                        data-testid="reply-input"
                      />

                      {/* Toolbar */}
                      <div className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border-t">
                        <div className="flex items-center gap-0.5">
                          {/* File Attach */}
                          <input
                            type="file"
                            ref={replyFileInputRef}
                            onChange={handleReplyFileUpload}
                            className="hidden"
                            multiple
                            data-testid="reply-file-input"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => replyFileInputRef.current?.click()}
                            disabled={uploadingReplyAttachment}
                            className="h-8 w-8 p-0 text-slate-500 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/40"
                            title="Attach file"
                            data-testid="reply-attach-btn"
                          >
                            {uploadingReplyAttachment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                          </Button>

                          <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />

                          {/* AI Draft Reply */}
                          {aiSettings?.assistantEnabled && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleAiDraft}
                              disabled={draftingReply}
                              className="text-violet-600 hover:text-violet-700 hover:bg-violet-50 dark:text-violet-400 dark:hover:bg-violet-950/40 h-8 text-xs gap-1"
                              data-testid="ai-draft-btn"
                            >
                              {draftingReply ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                              <span className="hidden sm:inline">AI Draft</span>
                            </Button>
                          )}
                          {/* Suggest Actions */}
                          {aiSettings?.assistantEnabled && aiSettings?.suggestActions && suggestedActions.length === 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={fetchSuggestedActions}
                              disabled={loadingActions}
                              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40 h-8 text-xs gap-1"
                              data-testid="suggest-actions-btn"
                            >
                              {loadingActions ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ListChecks className="w-3.5 h-3.5" />}
                              <span className="hidden sm:inline">Actions</span>
                            </Button>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {replyContent.length > 0 && (
                            <span className="text-[11px] text-slate-400 tabular-nums">{replyContent.length}</span>
                          )}
                          <Button 
                            onClick={handleSendReply} 
                            disabled={!replyContent.trim() || sendingReply}
                            size="sm"
                            className="h-8 px-4 bg-violet-600 hover:bg-violet-700"
                            data-testid="send-reply-btn"
                          >
                            {sendingReply ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Send className="w-4 h-4 mr-1.5" />}
                            <span className="hidden sm:inline">Send</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* Message List View */
              <>
                {/* Desktop header with search */}
                <div className="hidden md:flex p-4 border-b items-center justify-between gap-4">
                  <h2 className="font-semibold text-lg capitalize">{activeTab}</h2>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search messages..."
                        className="pl-9 w-64"
                        data-testid="search-messages-input"
                      />
                    </div>
                    <Button variant="ghost" size="icon" onClick={fetchMessages}>
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                    {activeTab === 'trash' && messages.length > 0 && (
                      <Button variant="destructive" size="sm" onClick={emptyTrash}>
                        Empty Trash
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Mobile search bar */}
                <div className="md:hidden p-3 border-b">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search messages..."
                      className="pl-9 w-full h-10"
                    />
                  </div>
                </div>
                
                <ScrollArea className="flex-1">
                  {loading ? (
                    <div className="flex justify-center items-center h-40">
                      <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                    </div>
                  ) : filteredMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                      <Mail className="w-12 h-12 mb-2 opacity-50" />
                      <p>No messages in {activeTab}</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredMessages.map((msg) => {
                        const otherUserId = activeTab === 'sent' || activeTab === 'drafts' 

                          ? msg.recipient_id 
                          : msg.sender_id;
                        const otherUser = users[otherUserId];
                        const displayName = activeTab === 'sent' || activeTab === 'drafts'
                          ? (msg.recipient_name || 'No recipient')
                          : msg.sender_name;
                        
                        return (
                          <div
                            key={msg.id}
                            onClick={() => openMessage(msg)}
                            className={cn(
                              "flex items-center gap-3 p-3 md:p-4 cursor-pointer",
                              "hover:bg-gray-50 dark:hover:bg-slate-800/50 active:bg-gray-100 dark:active:bg-slate-800",
                              "transition-colors",
                              !msg.is_read && activeTab === 'inbox' && "bg-indigo-50/50 dark:bg-indigo-900/10"
                            )}
                            data-testid={`message-item-${msg.id}`}
                          >
                            <Avatar className="w-10 h-10 md:w-11 md:h-11 flex-shrink-0">
                              <AvatarImage src={otherUser?.avatar} />
                              <AvatarFallback className="bg-indigo-100 text-indigo-700 text-sm">
                                {getInitials(displayName)}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={cn(
                                  "font-medium text-sm md:text-base truncate max-w-[150px] md:max-w-none",
                                  !msg.is_read && activeTab === 'inbox' && "font-semibold"
                                )}>
                                  {displayName}
                                </span>
                                <span className="text-xs text-muted-foreground md:hidden">
                                  {format(new Date(msg.created_at), 'MMM d')}
                                </span>
                                {msg.is_draft && (
                                  <Badge variant="secondary" className="bg-amber-100 text-amber-700 text-xs">Draft</Badge>
                                )}
                                {!msg.is_read && activeTab === 'inbox' && (
                                  <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 text-xs">New</Badge>
                                )}
                              </div>
                              <p className={cn(
                                "text-sm truncate",
                                !msg.is_read && activeTab === 'inbox' 
                                  ? "font-medium text-gray-900 dark:text-white" 
                                  : "text-muted-foreground"
                              )}>
                                {msg.subject || '(No subject)'}
                              </p>
                              <p className="text-xs text-muted-foreground truncate mt-0.5 hidden md:block">
                                {msg.content?.slice(0, 80)}{msg.content?.length > 80 ? '...' : ''}
                              </p>
                            </div>
                            
                            {/* Desktop actions */}
                            <div className="hidden md:flex items-center gap-2 flex-shrink-0">
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(msg.created_at), 'MMM d')}
                              </span>
                              
                              {activeTab !== 'trash' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={(e) => toggleStar(msg.id, e)}
                                >
                                  <Star className={cn("w-4 h-4", msg.is_starred && "fill-yellow-400 text-yellow-400")} />
                                </Button>
                              )}
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {activeTab === 'trash' ? (
                                    <>
                                      <DropdownMenuItem onClick={(e) => restoreFromTrash(msg.id, e)}>
                                        <RotateCcw className="w-4 h-4 mr-2" />
                                        Restore
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={(e) => permanentlyDelete(msg.id, e)} className="text-red-600">
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete Permanently
                                      </DropdownMenuItem>
                                    </>
                                  ) : activeTab === 'junk' ? (
                                    <>
                                      <DropdownMenuItem onClick={(e) => moveToJunk(msg.id, e)}>
                                        <Inbox className="w-4 h-4 mr-2" />
                                        Not Junk (Move to Inbox)
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={(e) => moveToTrash(msg.id, e)} className="text-red-600">
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </>
                                  ) : (
                                    <>
                                      <DropdownMenuItem onClick={(e) => moveToJunk(msg.id, e)}>
                                        <AlertCircle className="w-4 h-4 mr-2" />
                                        Mark as Junk
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={(e) => moveToTrash(msg.id, e)} className="text-red-600">
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Move to Trash
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            {/* Mobile star and chevron */}
                            <div className="md:hidden flex items-center gap-1">
                              {activeTab !== 'trash' && msg.is_starred && (
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </>
            )}
          </Card>
        </div>

        {/* Compose Modal */}
        <Dialog open={showCompose} onOpenChange={(open) => !open && resetCompose()}>
          <DialogContent 
            className="sm:max-w-[600px] max-h-[90vh] md:max-h-[85vh] overflow-y-auto"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Drag overlay */}
            {isDragging && (
              <div className="absolute inset-0 z-50 bg-indigo-500/20 border-2 border-dashed border-indigo-500 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Paperclip className="w-12 h-12 mx-auto text-indigo-500 mb-2" />
                  <p className="text-lg font-medium text-indigo-700 dark:text-indigo-300">Drop files to attach</p>
                </div>
              </div>
            )}
            
            <DialogHeader>
              <DialogTitle>{editingDraft ? 'Edit Draft' : 'New Message'}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-2 md:py-4">
              {/* AI Compose Bar */}
              {!showAiCompose ? (
                <button
                  onClick={() => setShowAiCompose(true)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-950/40 transition-colors text-sm"
                  data-testid="show-ai-compose-btn"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Write with AI — describe what you want to say</span>
                </button>
              ) : (
                <div className="rounded-lg border border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-950/20 p-3 space-y-2" data-testid="ai-compose-panel">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                    <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">AI Compose</span>
                    <button onClick={() => { setShowAiCompose(false); setAiPrompt(''); }} className="ml-auto text-violet-400 hover:text-violet-600"><X className="w-3.5 h-3.5" /></button>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder='e.g. "schedule follow-up about Q1 report" or "thank them for the presentation"'
                      className="flex-1 h-9 text-sm bg-white dark:bg-slate-900 border-violet-200 dark:border-violet-800"
                      onKeyDown={(e) => e.key === 'Enter' && !composingWithAi && handleAiCompose()}
                      disabled={composingWithAi}
                      data-testid="ai-compose-prompt-input"
                    />
                    <Button
                      size="sm"
                      onClick={handleAiCompose}
                      disabled={!aiPrompt.trim() || composingWithAi}
                      className="bg-violet-600 hover:bg-violet-700 h-9 px-4 shrink-0"
                      data-testid="ai-compose-generate-btn"
                    >
                      {composingWithAi ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                      <span className="ml-1.5 hidden sm:inline">{composingWithAi ? 'Generating...' : 'Generate'}</span>
                    </Button>
                  </div>
                  <p className="text-[10px] text-violet-500">Describe your message briefly — AI will generate the subject and full body for you.</p>
                </div>
              )}
              {/* Recipient Search */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium">To:</label>
                  {!showCcBcc && (
                    <button
                      onClick={() => setShowCcBcc(true)}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                      data-testid="show-cc-bcc-btn"
                    >
                      Cc &amp; Bcc
                    </button>
                  )}
                </div>
                {composeRecipient ? (
                  <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-slate-800 rounded-lg">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-indigo-100 text-indigo-700 text-sm">
                        {getInitials(composeRecipient.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{composeRecipient.name || composeRecipient.email}</p>
                      {composeRecipient.email && <p className="text-xs text-muted-foreground truncate">{composeRecipient.email}</p>}
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 shrink-0" onClick={() => setComposeRecipient(null)}>
                      Change
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <Input
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      placeholder="Search users..."
                      className="h-11 md:h-10"
                      data-testid="recipient-search-input"
                    />
                    {searchingUsers && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin" />
                    )}
                    {userSearchResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-900 border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {userSearchResults.map((u) => (
                          <button
                            key={u.id}
                            onClick={() => {
                              setComposeRecipient(u);
                              setUserSearchQuery('');
                              setUserSearchResults([]);
                            }}
                            className="w-full flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                            data-testid={`user-result-${u.id}`}
                          >
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={u.avatar} />
                              <AvatarFallback className="bg-indigo-100 text-indigo-700 text-sm">
                                {getInitials(u.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="text-left">
                              <p className="font-medium text-sm">{u.name || 'Unknown'}</p>
                              <p className="text-xs text-muted-foreground">{u.email}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* CC Field */}
              {showCcBcc && (
                <div data-testid="cc-field">
                  <label className="text-sm font-medium mb-1.5 block">Cc:</label>
                  {ccRecipients.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-1.5">
                      {ccRecipients.map((u) => (
                        <span key={u.id} className="inline-flex items-center gap-1 text-xs bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
                          {u.name || u.email}
                          <button onClick={() => setCcRecipients(prev => prev.filter(r => r.id !== u.id))} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="relative">
                    <Input
                      value={ccSearchQuery}
                      onChange={(e) => setCcSearchQuery(e.target.value)}
                      placeholder="Add Cc recipients..."
                      className="h-9 text-sm"
                      data-testid="cc-search-input"
                    />
                    {ccSearchResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-900 border rounded-lg shadow-lg max-h-36 overflow-y-auto">
                        {ccSearchResults.filter(u => !ccRecipients.find(r => r.id === u.id) && u.id !== composeRecipient?.id).map((u) => (
                          <button key={u.id} onClick={() => { setCcRecipients(prev => [...prev, u]); setCcSearchQuery(''); setCcSearchResults([]); }}
                            className="w-full flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-slate-800 text-sm" data-testid={`cc-result-${u.id}`}>
                            <Avatar className="w-6 h-6"><AvatarFallback className="bg-indigo-100 text-indigo-700 text-[10px]">{getInitials(u.name)}</AvatarFallback></Avatar>
                            <span className="truncate">{u.name || u.email}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* BCC Field */}
              {showCcBcc && (
                <div data-testid="bcc-field">
                  <label className="text-sm font-medium mb-1.5 block">Bcc:</label>
                  {bccRecipients.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-1.5">
                      {bccRecipients.map((u) => (
                        <span key={u.id} className="inline-flex items-center gap-1 text-xs bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full border border-gray-200 dark:border-gray-700">
                          {u.name || u.email}
                          <button onClick={() => setBccRecipients(prev => prev.filter(r => r.id !== u.id))} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="relative">
                    <Input
                      value={bccSearchQuery}
                      onChange={(e) => setBccSearchQuery(e.target.value)}
                      placeholder="Add Bcc recipients..."
                      className="h-9 text-sm"
                      data-testid="bcc-search-input"
                    />
                    {bccSearchResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-900 border rounded-lg shadow-lg max-h-36 overflow-y-auto">
                        {bccSearchResults.filter(u => !bccRecipients.find(r => r.id === u.id) && u.id !== composeRecipient?.id).map((u) => (
                          <button key={u.id} onClick={() => { setBccRecipients(prev => [...prev, u]); setBccSearchQuery(''); setBccSearchResults([]); }}
                            className="w-full flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-slate-800 text-sm" data-testid={`bcc-result-${u.id}`}>
                            <Avatar className="w-6 h-6"><AvatarFallback className="bg-gray-200 text-gray-700 text-[10px]">{getInitials(u.name)}</AvatarFallback></Avatar>
                            <span className="truncate">{u.name || u.email}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Subject */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">Subject:</label>
                <Input
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  placeholder="Enter subject..."
                  data-testid="compose-subject-input"
                />
              </div>
              
              {/* Content */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">Message:</label>
                <Textarea
                  value={composeContent}
                  onChange={(e) => setComposeContent(e.target.value)}
                  placeholder="Write your message..."
                  className="min-h-[150px]"
                  data-testid="compose-content-input"
                />
              </div>
              
              {/* Attachments */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Attachments:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      className="hidden"
                      multiple
                      accept="*/*"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingAttachment}
                      data-testid="attach-file-btn"
                    >
                      {uploadingAttachment ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Paperclip className="w-4 h-4 mr-2" />
                      )}
                      Attach File
                    </Button>
                  </div>
                </div>
                
                {attachments.length > 0 && (
                  <div className="space-y-2 mt-2 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                    {attachments.map((attachment) => {
                      const FileIcon = getFileIcon(attachment.content_type, attachment.filename);
                      return (
                        <div 
                          key={attachment.id} 
                          className="flex items-center gap-3 p-2 bg-white dark:bg-slate-700 rounded border"
                        >
                          <FileIcon className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{attachment.filename}</p>
                            <p className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600"
                            onClick={() => removeAttachment(attachment.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {attachments.length === 0 && (
                  <div 
                    className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:border-indigo-400 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Drag & drop files here or click to browse
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Supports all file types (images, docs, JSON, txt, etc.) • Max 10MB per file
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={resetCompose}>Cancel</Button>
              <Button 
                variant="secondary"
                onClick={handleSaveDraft} 
                disabled={savingDraft}
                data-testid="save-draft-btn"
              >
                {savingDraft ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileEdit className="w-4 h-4 mr-2" />}
                Save Draft
              </Button>
              <Button 
                onClick={handleSendMessage} 
                disabled={!composeRecipient || !composeSubject.trim() || !composeContent.trim() || sendingMessage}
                data-testid="send-message-btn"
              >
                {sendingMessage ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Send Message
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
};

export default MessagesPage;
