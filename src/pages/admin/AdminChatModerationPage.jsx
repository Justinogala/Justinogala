import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, Flag, Trash2, Search, RefreshCw, 
  Eye, AlertTriangle, CheckCircle, Filter, User,
  Building2, ChevronLeft, ChevronRight, BarChart2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import PageTransition from '@/components/PageTransition';
import { format } from 'date-fns';

const API_URL = import.meta.env.REACT_APP_BACKEND_URL || '';

const AdminChatModerationPage = () => {
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('all');
  const [messages, setMessages] = useState([]);
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Action dialog
  const [actionDialog, setActionDialog] = useState({ open: false, message: null, action: '' });
  const [actionReason, setActionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  
  // Message detail dialog
  const [detailDialog, setDetailDialog] = useState({ open: false, message: null });

  useEffect(() => {
    fetchStats();
    fetchAnalytics();
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [activeTab, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) {
        fetchMessages();
      } else {
        setPage(1);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/chat-moderation/stats`);
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/chat-moderation/analytics`);
      const data = await res.json();
      if (data.success) {
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'flagged' 
        ? `${API_URL}/api/admin/chat-moderation/flagged`
        : `${API_URL}/api/admin/chat-moderation/messages`;
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '30',
        ...(search && { search }),
        ...(activeTab === 'flagged' && { flagged_only: 'true' })
      });
      
      const res = await fetch(`${endpoint}?${params}`);
      const data = await res.json();
      
      if (data.success) {
        setMessages(data.messages);
        setTotalPages(data.total_pages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const performAction = async () => {
    if (!actionDialog.message || !actionDialog.action) return;
    
    setActionLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/api/admin/chat-moderation/messages/${actionDialog.message.id}/action`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: actionDialog.action,
            reason: actionReason
          })
        }
      );
      
      const data = await res.json();
      
      if (data.success) {
        toast({ title: 'Success', description: data.message });
        fetchMessages();
        fetchStats();
        setActionDialog({ open: false, message: null, action: '' });
        setActionReason('');
      } else {
        throw new Error(data.detail || 'Action failed');
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setActionLoading(false);
    }
  };

  const openActionDialog = (message, action) => {
    setActionDialog({ open: true, message, action });
    setActionReason('');
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <PageTransition>
      <div className="p-6 space-y-6" data-testid="admin-chat-moderation-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-7 h-7 text-indigo-600" />
              Chat Moderation
            </h1>
            <p className="text-gray-500 mt-1">Monitor and moderate workspace conversations</p>
          </div>
          <Button onClick={() => { fetchMessages(); fetchStats(); }} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Messages</p>
                    <p className="text-2xl font-bold">{stats.total_messages.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
                    <MessageSquare className="w-5 h-5 text-indigo-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Flagged</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.flagged_messages}</p>
                  </div>
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                    <Flag className="w-5 h-5 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Today</p>
                    <p className="text-2xl font-bold text-green-600">{stats.messages_today}</p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Active Workspaces</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.active_chat_workspaces}</p>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                    <Building2 className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs and Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <TabsList>
              <TabsTrigger value="all">All Messages</TabsTrigger>
              <TabsTrigger value="flagged" className="relative">
                Flagged
                {stats?.flagged_messages > 0 && (
                  <Badge className="ml-2 bg-orange-500 text-white">{stats.flagged_messages}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
            
            {activeTab !== 'analytics' && (
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search messages..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            )}
          </div>

          <TabsContent value="all" className="mt-0">
            <Card>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex justify-center py-12">
                    <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No messages found</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[600px]">
                    <div className="divide-y">
                      {messages.map((msg) => (
                        <div key={msg.id} className="p-4 hover:bg-gray-50 dark:hover:bg-slate-800/50">
                          <div className="flex items-start gap-3">
                            <Avatar className="w-10 h-10 flex-shrink-0">
                              <AvatarFallback className="bg-indigo-100 text-indigo-700">
                                {getInitials(msg.sender?.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium">{msg.sender?.name || 'Unknown'}</span>
                                <span className="text-xs text-gray-500">in</span>
                                <Badge variant="outline" className="text-xs">
                                  {msg.workspace?.name || 'Unknown'}
                                </Badge>
                                <span className="text-xs text-gray-400">
                                  {format(new Date(msg.created_at), 'MMM d, h:mm a')}
                                </span>
                                {msg.is_flagged && (
                                  <Badge className="bg-orange-100 text-orange-700">
                                    <Flag className="w-3 h-3 mr-1" />
                                    Flagged
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                {msg.content}
                              </p>
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => setDetailDialog({ open: true, message: msg })}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {!msg.is_flagged ? (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-orange-600 hover:text-orange-700"
                                  onClick={() => openActionDialog(msg, 'flag')}
                                >
                                  <Flag className="w-4 h-4" />
                                </Button>
                              ) : (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-green-600 hover:text-green-700"
                                  onClick={() => openActionDialog(msg, 'unflag')}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                              )}
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-red-600 hover:text-red-700"
                                onClick={() => openActionDialog(msg, 'delete')}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between p-4 border-t">
                    <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="flagged" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flag className="w-5 h-5 text-orange-600" />
                  Flagged Messages
                </CardTitle>
                <CardDescription>Messages requiring review</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Same structure as all messages but filtered */}
                {loading ? (
                  <div className="flex justify-center py-12">
                    <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                    <p>No flagged messages! All clear.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.filter(m => m.is_flagged).map((msg) => (
                      <div key={msg.id} className="p-4 border rounded-lg bg-orange-50/50 dark:bg-orange-900/10">
                        <div className="flex items-start gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-indigo-100 text-indigo-700">
                              {getInitials(msg.sender?.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="font-medium">{msg.sender?.name}</span>
                              <Badge variant="outline">{msg.workspace?.name}</Badge>
                              {msg.flag_reason && (
                                <Badge className="bg-orange-100 text-orange-700">{msg.flag_reason}</Badge>
                              )}
                            </div>
                            <p className="text-sm">{msg.content}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => openActionDialog(msg, 'unflag')}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => openActionDialog(msg, 'delete')}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Top Workspaces */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Most Active Workspaces
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics?.top_workspaces?.length > 0 ? (
                    <div className="space-y-3">
                      {analytics.top_workspaces.map((ws, idx) => (
                        <div key={ws._id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-bold text-gray-400 w-6">{idx + 1}</span>
                            <span className="font-medium">{ws.workspace_name}</span>
                          </div>
                          <Badge variant="secondary">{ws.message_count} messages</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No data available</p>
                  )}
                </CardContent>
              </Card>

              {/* Top Users */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Most Active Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics?.top_users?.length > 0 ? (
                    <div className="space-y-3">
                      {analytics.top_users.map((user, idx) => (
                        <div key={user._id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-bold text-gray-400 w-6">{idx + 1}</span>
                            <div>
                              <p className="font-medium">{user.user_name}</p>
                              <p className="text-xs text-gray-500">{user.user_email}</p>
                            </div>
                          </div>
                          <Badge variant="secondary">{user.message_count} messages</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No data available</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Message Detail Dialog */}
        <Dialog open={detailDialog.open} onOpenChange={(open) => !open && setDetailDialog({ open: false, message: null })}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Message Details</DialogTitle>
            </DialogHeader>
            {detailDialog.message && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-indigo-100 text-indigo-700">
                      {getInitials(detailDialog.message.sender?.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{detailDialog.message.sender?.name}</p>
                    <p className="text-sm text-gray-500">{detailDialog.message.sender?.email}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Workspace</label>
                  <p>{detailDialog.message.workspace?.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Sent At</label>
                  <p>{format(new Date(detailDialog.message.created_at), 'PPpp')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Message</label>
                  <p className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg mt-1">
                    {detailDialog.message.content}
                  </p>
                </div>
                {detailDialog.message.is_flagged && (
                  <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <p className="text-sm font-medium text-orange-700">Flagged</p>
                    <p className="text-sm text-orange-600">{detailDialog.message.flag_reason || 'No reason provided'}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Action Dialog */}
        <Dialog open={actionDialog.open} onOpenChange={(open) => !open && setActionDialog({ open: false, message: null, action: '' })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="capitalize">{actionDialog.action} Message</DialogTitle>
              <DialogDescription>
                {actionDialog.action === 'delete' 
                  ? 'This message will be removed from the conversation.'
                  : actionDialog.action === 'flag'
                  ? 'This message will be flagged for review.'
                  : 'This message will be unflagged.'}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <label className="text-sm font-medium">Reason</label>
              <Textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Enter reason for this action..."
                className="mt-2"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setActionDialog({ open: false, message: null, action: '' })}>
                Cancel
              </Button>
              <Button
                onClick={performAction}
                disabled={actionLoading}
                variant={actionDialog.action === 'delete' ? 'destructive' : 'default'}
              >
                {actionLoading && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
};

export default AdminChatModerationPage;
