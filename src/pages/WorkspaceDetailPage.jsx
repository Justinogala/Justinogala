
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { 
  Settings, Users, HardDrive, Trash2, 
  Save, AlertTriangle, ArrowLeft, Activity,
  Clock, Calendar, MessageSquare, FileCheck2,
  FileText, Plus, Pin, MoreHorizontal, Megaphone,
  Globe, Lock, Send, X, Loader2, FolderOpen, ChevronRight,
  UserPlus, ExternalLink, Pencil
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { getWorkspaceById, deleteWorkspace, updateWorkspace } from '@/services/workspaceService';
import { API_URL } from '@/lib/api';
import { cn } from '@/lib/utils';
import PageTransition from '@/components/PageTransition';
import WorkspaceMemberManagement from '@/components/WorkspaceMemberManagement';

const DEFAULT_QUICK_LINKS = [
  { icon: MessageSquare, label: 'Chat', path: '/workspace/chat', color: 'from-blue-500 to-cyan-500', desc: 'Team messaging' },
  { icon: FileText, label: 'Files', path: '/files', color: 'from-emerald-500 to-green-500', desc: 'Document library' },
  { icon: FileCheck2, label: 'Approvals', path: '/approvals', color: 'from-violet-500 to-purple-500', desc: 'Workflow requests' },
  { icon: Calendar, label: 'Calendar', path: '/calendar', color: 'from-orange-500 to-amber-500', desc: 'Team schedule' },
];

const ICON_MAP = {
  'message-square': MessageSquare, 'folder': FolderOpen, 'clipboard-list': FileCheck2,
  'calendar': Calendar, 'file-text': FileText, 'users': Users, 'receipt': FileText,
  'megaphone': Megaphone, 'rocket': ExternalLink, 'book': FileText, 'palette': FolderOpen,
};

const ACTIVITY_ICONS = {
  member_joined: UserPlus,
  approval_created: FileCheck2,
  announcement: Megaphone,
  file_uploaded: FileText,
  message_sent: MessageSquare,
};

const WorkspaceDetailPage = () => {
  const params = useParams();
  const workspaceId = params.workspaceId || params.id;
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [stats, setStats] = useState({});
  const [activities, setActivities] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [showNewAnnouncement, setShowNewAnnouncement] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annPinned, setAnnPinned] = useState(false);
  const [annSaving, setAnnSaving] = useState(false);

  const fetchWorkspace = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getWorkspaceById(workspaceId);
      if (data) {
        setWorkspace(data);
        setEditName(data.name);
        setEditDesc(data.description || '');
      } else {
        toast({ variant: 'destructive', title: 'Error', description: 'Workspace not found' });
        navigate('/workspaces');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/workspaces/${workspaceId}/stats`);
      if (res.ok) setStats(await res.json());
    } catch { /* silent */ }
  }, [workspaceId]);

  const fetchActivity = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/workspaces/${workspaceId}/activity?limit=20`);
      if (res.ok) { const d = await res.json(); setActivities(d.activities || []); }
    } catch { /* silent */ }
  }, [workspaceId]);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/workspaces/${workspaceId}/announcements`);
      if (res.ok) { const d = await res.json(); setAnnouncements(d.announcements || []); }
    } catch { /* silent */ }
  }, [workspaceId]);

  useEffect(() => { fetchWorkspace(); fetchStats(); fetchActivity(); fetchAnnouncements(); }, [fetchWorkspace, fetchStats, fetchActivity, fetchAnnouncements]);

  const handleUpdate = async () => {
    try {
      await updateWorkspace(workspaceId, { name: editName, description: editDesc });
      toast({ title: 'Workspace Updated', description: 'Changes saved successfully.' });
      fetchWorkspace();
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update workspace.' });
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure? This will delete all data associated with this workspace.')) {
      await deleteWorkspace(workspaceId);
      toast({ title: 'Workspace Deleted' });
      navigate('/workspaces');
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!annTitle.trim()) return;
    setAnnSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/workspaces/${workspaceId}/announcements`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: annTitle, content: annContent, pinned: annPinned, author_id: user.id, author_name: user.name || user.email }),
      });
      if (res.ok) {
        toast({ title: 'Announcement posted!' });
        setShowNewAnnouncement(false);
        setAnnTitle(''); setAnnContent(''); setAnnPinned(false);
        fetchAnnouncements(); fetchActivity();
      }
    } catch { toast({ variant: 'destructive', title: 'Failed to post' }); }
    finally { setAnnSaving(false); }
  };

  const handleDeleteAnnouncement = async (id) => {
    await fetch(`${API_URL}/api/workspaces/${workspaceId}/announcements/${id}`, { method: 'DELETE' });
    fetchAnnouncements();
  };

  const timeAgo = (ts) => {
    if (!ts) return '';
    const diff = (Date.now() - new Date(ts).getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(ts).toLocaleDateString();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>;
  if (!workspace) return null;

  const isOwner = workspace.owner_id === user?.id;

  // Resolve quick links from template settings or defaults
  const COLORS = ['from-blue-500 to-cyan-500', 'from-emerald-500 to-green-500', 'from-violet-500 to-purple-500', 'from-orange-500 to-amber-500', 'from-rose-500 to-pink-500', 'from-teal-500 to-green-500'];
  const savedLinks = workspace.settings?.quick_links;
  const quickLinks = savedLinks ? savedLinks.map((ql, i) => ({
    icon: ICON_MAP[ql.icon] || FileText,
    label: ql.label,
    path: ql.path,
    color: COLORS[i % COLORS.length],
    desc: ql.label,
  })) : DEFAULT_QUICK_LINKS;

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50/50 dark:bg-slate-950" data-testid="workspace-detail">
        <Helmet><title>{workspace.name} | Munal</title></Helmet>

        {/* Hero Banner */}
        <div className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${workspace.color || '#6366f1'}dd, ${workspace.color || '#6366f1'}88)` }}>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0aDR2MWgtNHptMC0yaDF2NGgtMXptLTIgMmg0djFoLTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
          <div className="max-w-6xl mx-auto px-6 py-8 relative">
            <Button variant="ghost" onClick={() => navigate('/workspaces')} className="mb-4 text-white/80 hover:text-white hover:bg-white/10 -ml-2">
              <ArrowLeft className="w-4 h-4 mr-2" /> All Workspaces
            </Button>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl shadow-lg border border-white/20">
                  {workspace.icon || workspace.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white flex items-center gap-3" data-testid="workspace-name">
                    {workspace.name}
                    <Badge className={cn("text-xs", workspace.scope === 'org' ? "bg-white/20 text-white border-white/30" : "bg-white/20 text-white border-white/30")}>
                      {workspace.scope === 'org' ? <><Globe className="w-3 h-3 mr-1" /> Organisation</> : <><Lock className="w-3 h-3 mr-1" /> Team</>}
                    </Badge>
                  </h1>
                  <p className="text-white/70 mt-1 text-sm max-w-lg">{workspace.description || 'No description'}</p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button onClick={() => navigate(`/workspace/${workspaceId}/shifts`)} variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10 h-9" data-testid="shifts-btn">
                  <Clock className="w-4 h-4 mr-1" /> Shifts
                </Button>
                <Button onClick={() => navigate('/workspace/chat')} variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10 h-9">
                  <MessageSquare className="w-4 h-4 mr-1" /> Chat
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-6xl mx-auto px-6 -mt-4 relative z-10">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-white dark:bg-slate-900 p-1 rounded-xl border shadow-sm h-auto flex-wrap">
              {[
                { val: 'home', label: 'Home', icon: Activity },
                { val: 'news', label: 'News', icon: Megaphone },
                { val: 'members', label: 'Members', icon: Users },
                { val: 'activity', label: 'Activity', icon: Clock },
                { val: 'settings', label: 'Settings', icon: Settings },
              ].map(t => (
                <TabsTrigger key={t.val} value={t.val} className="px-4 py-2.5 rounded-lg gap-1.5 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 dark:data-[state=active]:bg-indigo-900/20 dark:data-[state=active]:text-indigo-300" data-testid={`tab-${t.val}`}>
                  <t.icon className="w-3.5 h-3.5" /> {t.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Home Tab - SharePoint Hub */}
            <TabsContent value="home" className="space-y-6 animate-in fade-in-50">
              {/* Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4" data-testid="workspace-stats">
                {[
                  { label: 'Members', value: stats.member_count || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/10' },
                  { label: 'Files', value: stats.file_count || 0, icon: FolderOpen, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/10' },
                  { label: 'Pending Approvals', value: stats.pending_approvals || 0, icon: FileCheck2, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-900/10' },
                  { label: 'Announcements', value: stats.announcement_count || 0, icon: Megaphone, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/10' },
                  { label: 'This Week', value: stats.recent_activity || 0, icon: Activity, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/10' },
                ].map(s => (
                  <Card key={s.label} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', s.bg)}>
                        <s.icon className={cn('w-5 h-5', s.color)} />
                      </div>
                      <div>
                        <p className="text-xl font-bold">{s.value}</p>
                        <p className="text-[11px] text-slate-500">{s.label}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Quick Links */}
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">Quick Access</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3" data-testid="quick-links">
                      {quickLinks.map(link => (
                        <Card key={link.label} className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-0.5 group" onClick={() => navigate(link.path)}>
                          <CardContent className="p-4 text-center">
                            <div className={cn('w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center bg-gradient-to-br', link.color)}>
                              <link.icon className="w-5 h-5 text-white" />
                            </div>
                            <p className="text-sm font-semibold">{link.label}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{link.desc}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Pinned Announcements */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide">Announcements</h3>
                      {isOwner && (
                        <Button variant="ghost" size="sm" className="text-indigo-600 h-7 text-xs" onClick={() => setShowNewAnnouncement(true)} data-testid="new-announcement-btn">
                          <Plus className="w-3 h-3 mr-1" /> New
                        </Button>
                      )}
                    </div>
                    {announcements.length === 0 ? (
                      <Card className="border-dashed">
                        <CardContent className="p-6 text-center text-sm text-slate-400">
                          <Megaphone className="w-8 h-8 mx-auto mb-2 opacity-30" />
                          No announcements yet
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-2" data-testid="announcements-list">
                        {announcements.slice(0, 5).map(ann => (
                          <Card key={ann.id} className={cn(ann.pinned && "border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-900/5")}>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    {ann.pinned && <Pin className="w-3 h-3 text-amber-500 shrink-0" />}
                                    <p className="text-sm font-semibold truncate">{ann.title}</p>
                                  </div>
                                  {ann.content && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{ann.content}</p>}
                                  <p className="text-[10px] text-slate-400 mt-2">{ann.author_name} &bull; {timeAgo(ann.created_at)}</p>
                                </div>
                                {isOwner && (
                                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-slate-400 hover:text-red-500" onClick={() => handleDeleteAnnouncement(ann.id)}>
                                    <X className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent Activity Sidebar */}
                <div>
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">Recent Activity</h3>
                  <Card>
                    <CardContent className="p-0">
                      {activities.length === 0 ? (
                        <div className="p-6 text-center text-sm text-slate-400">No recent activity</div>
                      ) : (
                        <div className="divide-y" data-testid="activity-feed">
                          {activities.slice(0, 10).map((a, i) => {
                            const Icon = ACTIVITY_ICONS[a.type] || Activity;
                            return (
                              <div key={i} className="flex items-start gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                                  <Icon className="w-3.5 h-3.5 text-slate-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs leading-relaxed">{a.message}</p>
                                  <p className="text-[10px] text-slate-400 mt-0.5">{timeAgo(a.timestamp)}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* News Tab */}
            <TabsContent value="news" className="space-y-4 animate-in fade-in-50">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Workspace News</h2>
                {isOwner && (
                  <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setShowNewAnnouncement(true)} data-testid="post-news-btn">
                    <Plus className="w-4 h-4 mr-1" /> Post Announcement
                  </Button>
                )}
              </div>
              {announcements.length === 0 ? (
                <Card className="border-dashed"><CardContent className="p-12 text-center text-slate-400">
                  <Megaphone className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No news yet</p>
                  <p className="text-sm mt-1">Announcements and updates will appear here</p>
                </CardContent></Card>
              ) : (
                announcements.map(ann => (
                  <Card key={ann.id} className={cn(ann.pinned && "border-amber-200 dark:border-amber-800")}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {ann.pinned && <Badge className="bg-amber-100 text-amber-700 text-[10px]"><Pin className="w-2.5 h-2.5 mr-0.5" /> Pinned</Badge>}
                            <span className="text-[11px] text-slate-400">{ann.author_name} &bull; {new Date(ann.created_at).toLocaleDateString()}</span>
                          </div>
                          <h3 className="text-base font-bold mb-1">{ann.title}</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{ann.content}</p>
                        </div>
                        {isOwner && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-500 shrink-0" onClick={() => handleDeleteAnnouncement(ann.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Members Tab */}
            <TabsContent value="members" className="animate-in fade-in-50">
              <WorkspaceMemberManagement workspaceId={workspaceId} />
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="animate-in fade-in-50">
              <Card>
                <CardHeader><CardTitle className="text-base">Activity Log</CardTitle></CardHeader>
                <CardContent>
                  {activities.length === 0 ? (
                    <div className="text-center py-10 text-slate-400">
                      <Activity className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p>No activity yet</p>
                    </div>
                  ) : (
                    <div className="space-y-0 divide-y" data-testid="activity-log">
                      {activities.map((a, i) => {
                        const Icon = ACTIVITY_ICONS[a.type] || Activity;
                        return (
                          <div key={i} className="flex items-start gap-3 py-3 first:pt-0">
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                              <Icon className="w-4 h-4 text-slate-500" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm">{a.message}</p>
                              <p className="text-xs text-slate-400 mt-0.5">{new Date(a.timestamp).toLocaleString()}</p>
                            </div>
                            {a.status && <Badge variant="outline" className="text-[10px]">{a.status}</Badge>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6 animate-in fade-in-50">
              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>Update basic workspace information.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Workspace Name</label>
                    <Input value={editName} onChange={e => setEditName(e.target.value)} data-testid="edit-workspace-name" />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Description</label>
                    <Textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Scope</label>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {workspace.scope === 'org' ? <><Globe className="w-3 h-3 mr-1" /> Organisation-wide</> : <><Lock className="w-3 h-3 mr-1" /> Team-specific</>}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleUpdate} data-testid="save-settings-btn"><Save className="w-4 h-4 mr-1" /> Save Changes</Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-red-200 dark:border-red-900/30 bg-red-50/10">
                <CardHeader>
                  <CardTitle className="text-red-600 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" /> Danger Zone
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Delete Workspace</p>
                    <p className="text-sm text-gray-500">Permanently delete this workspace and all data.</p>
                  </div>
                  <Button variant="destructive" onClick={handleDelete} data-testid="delete-workspace-btn">Delete</Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* New Announcement Dialog */}
        <Dialog open={showNewAnnouncement} onOpenChange={setShowNewAnnouncement}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>New Announcement</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Title *</label>
                <Input value={annTitle} onChange={e => setAnnTitle(e.target.value)} placeholder="Announcement title..." data-testid="announcement-title-input" />
              </div>
              <div>
                <label className="text-sm font-medium">Content</label>
                <Textarea value={annContent} onChange={e => setAnnContent(e.target.value)} placeholder="Details..." rows={3} />
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={annPinned} onChange={e => setAnnPinned(e.target.checked)} className="rounded" />
                <Pin className="w-3.5 h-3.5 text-amber-500" /> Pin to top
              </label>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewAnnouncement(false)}>Cancel</Button>
              <Button onClick={handleCreateAnnouncement} disabled={annSaving || !annTitle.trim()} className="bg-indigo-600 hover:bg-indigo-700" data-testid="post-announcement-btn">
                {annSaving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Send className="w-4 h-4 mr-1" />} Post
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
};

export default WorkspaceDetailPage;
