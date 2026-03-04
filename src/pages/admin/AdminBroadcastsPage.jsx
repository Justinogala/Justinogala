import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { 
  Send, 
  Radio, 
  Users, 
  Mail,
  MailCheck,
  Eye,
  Trash2,
  Plus,
  RefreshCw,
  Calendar,
  Clock,
  Download,
  FileText,
  Settings,
  Play,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

const API_URL = import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_BACKEND_URL || '';

const AdminBroadcastsPage = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('broadcasts');
  
  // Broadcasts state
  const [broadcasts, setBroadcasts] = useState([]);
  const [loadingBroadcasts, setLoadingBroadcasts] = useState(true);
  const [showNewBroadcast, setShowNewBroadcast] = useState(false);
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastContent, setBroadcastContent] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  
  // Scheduled exports state
  const [scheduledExports, setScheduledExports] = useState([]);
  const [loadingExports, setLoadingExports] = useState(true);
  const [showNewExport, setShowNewExport] = useState(false);
  const [exportName, setExportName] = useState('');
  const [exportFrequency, setExportFrequency] = useState('weekly');
  const [exportFormat, setExportFormat] = useState('csv');
  const [exportStatus, setExportStatus] = useState('all');
  const [exportEmails, setExportEmails] = useState('');
  const [exportEnabled, setExportEnabled] = useState(true);
  const [savingExport, setSavingExport] = useState(false);
  const [editingExport, setEditingExport] = useState(null);

  // Fetch broadcasts
  const fetchBroadcasts = useCallback(async () => {
    setLoadingBroadcasts(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/broadcasts`);
      const data = await response.json();
      if (data.success) {
        setBroadcasts(data.broadcasts);
      }
    } catch (error) {
      console.error('Error fetching broadcasts:', error);
      toast({ title: 'Error', description: 'Failed to load broadcasts', variant: 'destructive' });
    } finally {
      setLoadingBroadcasts(false);
    }
  }, [toast]);

  // Fetch scheduled exports
  const fetchScheduledExports = useCallback(async () => {
    setLoadingExports(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/scheduled-exports`);
      const data = await response.json();
      if (data.success) {
        setScheduledExports(data.exports);
      }
    } catch (error) {
      console.error('Error fetching scheduled exports:', error);
      toast({ title: 'Error', description: 'Failed to load scheduled exports', variant: 'destructive' });
    } finally {
      setLoadingExports(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchBroadcasts();
    fetchScheduledExports();
  }, [fetchBroadcasts, fetchScheduledExports]);

  // Send broadcast
  const handleSendBroadcast = async () => {
    if (!broadcastSubject.trim() || !broadcastContent.trim()) {
      toast({ title: 'Error', description: 'Please fill in subject and content', variant: 'destructive' });
      return;
    }
    
    setSendingBroadcast(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/broadcasts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: broadcastSubject,
          content: broadcastContent,
          send_email: sendEmail
        })
      });
      
      const data = await response.json();
      if (data.success) {
        toast({ 
          title: 'Broadcast Sent!', 
          description: `Message sent to ${data.broadcast.recipients_count} users` 
        });
        setShowNewBroadcast(false);
        setBroadcastSubject('');
        setBroadcastContent('');
        fetchBroadcasts();
      } else {
        toast({ title: 'Error', description: data.detail || 'Failed to send broadcast', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error sending broadcast:', error);
      toast({ title: 'Error', description: 'Failed to send broadcast', variant: 'destructive' });
    } finally {
      setSendingBroadcast(false);
    }
  };

  // Save scheduled export
  const handleSaveExport = async () => {
    if (!exportName.trim() || !exportEmails.trim()) {
      toast({ title: 'Error', description: 'Please fill in name and email recipients', variant: 'destructive' });
      return;
    }
    
    const emailList = exportEmails.split(',').map(e => e.trim()).filter(e => e);
    if (emailList.length === 0) {
      toast({ title: 'Error', description: 'Please enter at least one email', variant: 'destructive' });
      return;
    }
    
    setSavingExport(true);
    try {
      const url = editingExport 
        ? `${API_URL}/api/admin/scheduled-exports/${editingExport.id}`
        : `${API_URL}/api/admin/scheduled-exports`;
      
      const response = await fetch(url, {
        method: editingExport ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: exportName,
          frequency: exportFrequency,
          format: exportFormat,
          status_filter: exportStatus,
          email_recipients: emailList,
          enabled: exportEnabled
        })
      });
      
      const data = await response.json();
      if (data.success) {
        toast({ title: 'Success', description: editingExport ? 'Export schedule updated' : 'Export schedule created' });
        resetExportForm();
        fetchScheduledExports();
      } else {
        toast({ title: 'Error', description: data.detail || 'Failed to save export', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error saving export:', error);
      toast({ title: 'Error', description: 'Failed to save export', variant: 'destructive' });
    } finally {
      setSavingExport(false);
    }
  };

  // Run export now
  const handleRunExportNow = async (exportId) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/scheduled-exports/${exportId}/run`, {
        method: 'POST'
      });
      const data = await response.json();
      if (data.success) {
        toast({ 
          title: 'Export Complete', 
          description: `Exported ${data.messages_exported} messages to ${data.recipients_notified} recipients` 
        });
        fetchScheduledExports();
      } else {
        toast({ title: 'Error', description: data.detail || 'Failed to run export', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error running export:', error);
      toast({ title: 'Error', description: 'Failed to run export', variant: 'destructive' });
    }
  };

  // Delete export
  const handleDeleteExport = async (exportId) => {
    if (!confirm('Are you sure you want to delete this scheduled export?')) return;
    
    try {
      const response = await fetch(`${API_URL}/api/admin/scheduled-exports/${exportId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        toast({ title: 'Success', description: 'Scheduled export deleted' });
        fetchScheduledExports();
      }
    } catch (error) {
      console.error('Error deleting export:', error);
      toast({ title: 'Error', description: 'Failed to delete export', variant: 'destructive' });
    }
  };

  // Delete broadcast
  const handleDeleteBroadcast = async (broadcastId) => {
    if (!confirm('Are you sure you want to delete this broadcast? All associated messages will be removed.')) return;
    
    try {
      const response = await fetch(`${API_URL}/api/admin/broadcasts/${broadcastId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        toast({ title: 'Success', description: 'Broadcast deleted' });
        fetchBroadcasts();
      }
    } catch (error) {
      console.error('Error deleting broadcast:', error);
      toast({ title: 'Error', description: 'Failed to delete broadcast', variant: 'destructive' });
    }
  };

  // Edit export
  const handleEditExport = (exp) => {
    setEditingExport(exp);
    setExportName(exp.name);
    setExportFrequency(exp.frequency);
    setExportFormat(exp.format);
    setExportStatus(exp.status_filter);
    setExportEmails(exp.email_recipients.join(', '));
    setExportEnabled(exp.enabled);
    setShowNewExport(true);
  };

  // Reset export form
  const resetExportForm = () => {
    setShowNewExport(false);
    setEditingExport(null);
    setExportName('');
    setExportFrequency('weekly');
    setExportFormat('csv');
    setExportStatus('all');
    setExportEmails('');
    setExportEnabled(true);
  };

  return (
    <>
      <Helmet>
        <title>Broadcasts & Exports | Admin - Munal</title>
      </Helmet>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-6 space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
              <Radio className="w-8 h-8 text-violet-600" />
              Broadcasts & Scheduled Exports
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Send announcements to all users and manage automated compliance exports.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="broadcasts" className="gap-2">
              <Send className="w-4 h-4" />
              Broadcasts
            </TabsTrigger>
            <TabsTrigger value="exports" className="gap-2">
              <Calendar className="w-4 h-4" />
              Scheduled Exports
            </TabsTrigger>
          </TabsList>

          {/* Broadcasts Tab */}
          <TabsContent value="broadcasts" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Send messages to all users at once
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={fetchBroadcasts} disabled={loadingBroadcasts}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${loadingBroadcasts ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button onClick={() => setShowNewBroadcast(true)} className="bg-violet-600 hover:bg-violet-700">
                  <Plus className="w-4 h-4 mr-2" />
                  New Broadcast
                </Button>
              </div>
            </div>

            {loadingBroadcasts ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
              </div>
            ) : broadcasts.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Radio className="w-12 h-12 text-gray-300 mb-4" />
                  <p className="text-gray-500">No broadcasts sent yet</p>
                  <Button onClick={() => setShowNewBroadcast(true)} className="mt-4" variant="outline">
                    Send Your First Broadcast
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {broadcasts.map((broadcast) => (
                  <Card key={broadcast.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{broadcast.subject}</h3>
                            {broadcast.send_email && (
                              <Badge variant="secondary" className="text-xs">
                                <Mail className="w-3 h-3 mr-1" />
                                Email Sent
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {broadcast.content}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {broadcast.recipients_count} recipients
                            </span>
                            <span className="flex items-center gap-1">
                              <MailCheck className="w-4 h-4" />
                              {broadcast.emails_sent} emails sent
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {format(new Date(broadcast.created_at), 'MMM d, yyyy h:mm a')}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => handleDeleteBroadcast(broadcast.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Scheduled Exports Tab */}
          <TabsContent value="exports" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Automated compliance reports sent on schedule
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={fetchScheduledExports} disabled={loadingExports}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${loadingExports ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button onClick={() => setShowNewExport(true)} className="bg-violet-600 hover:bg-violet-700">
                  <Plus className="w-4 h-4 mr-2" />
                  New Schedule
                </Button>
              </div>
            </div>

            {loadingExports ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
              </div>
            ) : scheduledExports.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calendar className="w-12 h-12 text-gray-300 mb-4" />
                  <p className="text-gray-500">No scheduled exports configured</p>
                  <Button onClick={() => setShowNewExport(true)} className="mt-4" variant="outline">
                    Create Your First Schedule
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {scheduledExports.map((exp) => (
                  <Card key={exp.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{exp.name}</h3>
                            <Badge variant={exp.enabled ? "default" : "secondary"}>
                              {exp.enabled ? "Active" : "Paused"}
                            </Badge>
                            <Badge variant="outline">{exp.frequency}</Badge>
                            <Badge variant="outline">{exp.format.toUpperCase()}</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                            <span className="flex items-center gap-1">
                              <Mail className="w-4 h-4" />
                              {exp.email_recipients.length} recipient(s)
                            </span>
                            <span className="flex items-center gap-1">
                              <Play className="w-4 h-4" />
                              {exp.run_count} runs
                            </span>
                            {exp.last_run && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                Last: {format(new Date(exp.last_run), 'MMM d, h:mm a')}
                              </span>
                            )}
                            {exp.next_run && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                Next: {format(new Date(exp.next_run), 'MMM d, h:mm a')}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Recipients: {exp.email_recipients.join(', ')}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRunExportNow(exp.id)}
                          >
                            <Play className="w-4 h-4 mr-1" />
                            Run Now
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditExport(exp)}
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-600"
                            onClick={() => handleDeleteExport(exp.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* New Broadcast Modal */}
        <Dialog open={showNewBroadcast} onOpenChange={setShowNewBroadcast}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Send className="w-5 h-5 text-violet-600" />
                New Broadcast Message
              </DialogTitle>
              <DialogDescription>
                This message will be sent to all active users on the platform.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div>
                <Label>Subject</Label>
                <Input
                  value={broadcastSubject}
                  onChange={(e) => setBroadcastSubject(e.target.value)}
                  placeholder="Important announcement..."
                  className="mt-1.5"
                />
              </div>
              
              <div>
                <Label>Message</Label>
                <Textarea
                  value={broadcastContent}
                  onChange={(e) => setBroadcastContent(e.target.value)}
                  placeholder="Write your message to all users..."
                  className="mt-1.5 min-h-[150px]"
                />
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Also send email notification</span>
                </div>
                <Switch checked={sendEmail} onCheckedChange={setSendEmail} />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewBroadcast(false)}>Cancel</Button>
              <Button 
                onClick={handleSendBroadcast} 
                disabled={sendingBroadcast}
                className="bg-violet-600 hover:bg-violet-700"
              >
                {sendingBroadcast ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Send to All Users
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* New/Edit Scheduled Export Modal */}
        <Dialog open={showNewExport} onOpenChange={(open) => !open && resetExportForm()}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-violet-600" />
                {editingExport ? 'Edit Scheduled Export' : 'New Scheduled Export'}
              </DialogTitle>
              <DialogDescription>
                Configure automated message exports for compliance.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div>
                <Label>Export Name</Label>
                <Input
                  value={exportName}
                  onChange={(e) => setExportName(e.target.value)}
                  placeholder="Weekly Compliance Report"
                  className="mt-1.5"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Frequency</Label>
                  <Select value={exportFrequency} onValueChange={setExportFrequency}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Format</Label>
                  <Select value={exportFormat} onValueChange={setExportFormat}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label>Message Status Filter</Label>
                <Select value={exportStatus} onValueChange={setExportStatus}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Messages</SelectItem>
                    <SelectItem value="unread">Unread Only</SelectItem>
                    <SelectItem value="read">Read Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Email Recipients</Label>
                <Input
                  value={exportEmails}
                  onChange={(e) => setExportEmails(e.target.value)}
                  placeholder="compliance@company.com, admin@company.com"
                  className="mt-1.5"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Separate multiple emails with commas
                </p>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                <div>
                  <span className="text-sm font-medium">Enable Schedule</span>
                  <p className="text-xs text-muted-foreground">Run exports automatically</p>
                </div>
                <Switch checked={exportEnabled} onCheckedChange={setExportEnabled} />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={resetExportForm}>Cancel</Button>
              <Button 
                onClick={handleSaveExport} 
                disabled={savingExport}
                className="bg-violet-600 hover:bg-violet-700"
              >
                {savingExport ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Calendar className="w-4 h-4 mr-2" />
                )}
                {editingExport ? 'Update Schedule' : 'Create Schedule'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </>
  );
};

export default AdminBroadcastsPage;
