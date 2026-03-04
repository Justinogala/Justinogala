import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
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
  Paperclip, X, FileText, Image, File, Download
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

const API_URL = import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_BACKEND_URL || '';

const MessagesPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
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
  
  // Attachment state
  const [attachments, setAttachments] = useState([]);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const fileInputRef = useRef(null);
  
  // Reply state
  const [replyContent, setReplyContent] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

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
            attachments: attachments.map(a => ({ id: a.id, filename: a.filename, size: a.size, content_type: a.content_type }))
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
        body: JSON.stringify({ content: replyContent })
      });
      const data = await response.json();
      if (data.success) {
        toast({ title: 'Success', description: 'Reply sent!' });
        setReplyContent('');
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

  const tabs = [
    { id: 'inbox', label: 'Inbox', icon: Inbox, count: counts.inbox_unread },
    { id: 'sent', label: 'Sent', icon: SendHorizontal },
    { id: 'drafts', label: 'Drafts', icon: FileEdit, count: counts.drafts },
    { id: 'junk', label: 'Junk', icon: AlertCircle, count: counts.junk },
    { id: 'trash', label: 'Trash', icon: Trash, count: counts.trash },
  ];

  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-6 h-[calc(100vh-5rem)]">
        <div className="flex gap-4 h-full">
          {/* Sidebar */}
          <Card className="w-64 flex-shrink-0 flex flex-col bg-white dark:bg-slate-900">
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
          </Card>

          {/* Main Content */}
          <Card className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-900">
            {selectedMessage ? (
              /* Message Thread View */
              <>
                <div className="p-4 border-b flex items-center gap-3">
                  <Button variant="ghost" size="icon" onClick={() => { setSelectedMessage(null); setThread([]); }}>
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <div className="flex-1">
                    <h2 className="font-semibold text-lg">{selectedMessage.subject}</h2>
                    <p className="text-sm text-muted-foreground">
                      {thread.length} message{thread.length !== 1 ? 's' : ''} in this conversation
                    </p>
                  </div>
                </div>
                
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {thread.map((msg) => {
                      const isMe = msg.sender_id === user?.id;
                      const sender = users[msg.sender_id];
                      return (
                        <div key={msg.id} className={cn("flex gap-3", isMe && "flex-row-reverse")}>
                          <Avatar className="w-10 h-10 flex-shrink-0">
                            <AvatarImage src={sender?.avatar} />
                            <AvatarFallback className="bg-indigo-100 text-indigo-700">
                              {getInitials(sender?.name || msg.sender_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className={cn("flex-1 max-w-[70%]", isMe && "text-right")}>
                            <div className={cn(
                              "rounded-lg p-4",
                              isMe 
                                ? "bg-indigo-600 text-white" 
                                : "bg-gray-100 dark:bg-slate-800"
                            )}>
                              <p className={cn("text-xs mb-2", isMe ? "text-indigo-200" : "text-muted-foreground")}>
                                {msg.sender_name} • {format(new Date(msg.created_at), 'MMM d, h:mm a')}
                              </p>
                              <p className="whitespace-pre-wrap">{msg.content}</p>
                              
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
                <div className="p-4 border-t bg-gray-50 dark:bg-slate-800/50">
                  <div className="flex gap-2">
                    <Textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Write your reply..."
                      className="flex-1 min-h-[80px] resize-none"
                      data-testid="reply-input"
                    />
                  </div>
                  <div className="flex justify-end mt-2">
                    <Button 
                      onClick={handleSendReply} 
                      disabled={!replyContent.trim() || sendingReply}
                      data-testid="send-reply-btn"
                    >
                      {sendingReply ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Reply className="w-4 h-4 mr-2" />}
                      Send Reply
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              /* Message List View */
              <>
                <div className="p-4 border-b flex items-center justify-between gap-4">
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
                              "flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors",
                              !msg.is_read && activeTab === 'inbox' && "bg-indigo-50/50 dark:bg-indigo-900/10"
                            )}
                            data-testid={`message-item-${msg.id}`}
                          >
                            <Avatar className="w-10 h-10 flex-shrink-0">
                              <AvatarImage src={otherUser?.avatar} />
                              <AvatarFallback className="bg-indigo-100 text-indigo-700">
                                {getInitials(displayName)}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={cn("font-medium", !msg.is_read && activeTab === 'inbox' && "font-semibold")}>
                                  {displayName}
                                </span>
                                {msg.is_draft && (
                                  <Badge variant="secondary" className="bg-amber-100 text-amber-700 text-xs">Draft</Badge>
                                )}
                                {!msg.is_read && activeTab === 'inbox' && (
                                  <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 text-xs">New</Badge>
                                )}
                              </div>
                              <p className={cn("text-sm truncate", !msg.is_read && activeTab === 'inbox' ? "font-medium text-gray-900 dark:text-white" : "text-muted-foreground")}>
                                {msg.subject || '(No subject)'}
                              </p>
                              <p className="text-xs text-muted-foreground truncate mt-0.5">
                                {msg.content?.slice(0, 80)}{msg.content?.length > 80 ? '...' : ''}
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-2 flex-shrink-0">
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
                                      <DropdownMenuItem 
                                        onClick={(e) => permanentlyDelete(msg.id, e)}
                                        className="text-red-600"
                                      >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete Permanently
                                      </DropdownMenuItem>
                                    </>
                                  ) : (
                                    <>
                                      {activeTab === 'inbox' && (
                                        <DropdownMenuItem onClick={(e) => moveToJunk(msg.id, e)}>
                                          <AlertCircle className="w-4 h-4 mr-2" />
                                          {msg.is_junk ? 'Not Junk' : 'Mark as Junk'}
                                        </DropdownMenuItem>
                                      )}
                                      {activeTab === 'junk' && (
                                        <DropdownMenuItem onClick={(e) => moveToJunk(msg.id, e)}>
                                          <Inbox className="w-4 h-4 mr-2" />
                                          Move to Inbox
                                        </DropdownMenuItem>
                                      )}
                                      <DropdownMenuItem 
                                        onClick={(e) => moveToTrash(msg.id, e)}
                                        className="text-red-600"
                                      >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Move to Trash
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
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
            className="sm:max-w-[600px]"
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
            
            <div className="space-y-4 py-4">
              {/* Recipient Search */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">To:</label>
                {composeRecipient ? (
                  <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-slate-800 rounded-lg">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-indigo-100 text-indigo-700 text-sm">
                        {getInitials(composeRecipient.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{composeRecipient.name || composeRecipient.email}</p>
                      {composeRecipient.email && <p className="text-xs text-muted-foreground">{composeRecipient.email}</p>}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setComposeRecipient(null)}>
                      Change
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <Input
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      placeholder="Search users by name or email..."
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
