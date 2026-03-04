
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { 
  Settings, Users, HardDrive, BarChart2, Trash2, 
  Save, AlertTriangle, ArrowLeft, Archive, Activity,
  Clock, Calendar, CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { getWorkspaceById, deleteWorkspace, updateWorkspace } from '@/services/workspaceService';
import PageTransition from '@/components/PageTransition';
import WorkspaceMemberManagement from '@/components/WorkspaceMemberManagement';
import TeamBillingCard from '@/components/billing/TeamBillingCard';

const WorkspaceDetailPage = () => {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  useEffect(() => {
    fetchWorkspace();
  }, [workspaceId]);

  const fetchWorkspace = async () => {
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
  };

  const handleUpdate = async () => {
    try {
      await updateWorkspace(workspaceId, { name: editName, description: editDesc });
      toast({ title: 'Workspace Updated', description: 'Changes saved successfully.' });
      fetchWorkspace();
    } catch (error) {
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

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!workspace) return null;

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50/50 dark:bg-slate-950 p-6">
        <Helmet><title>{workspace.name} | Settings</title></Helmet>
        
        <div className="max-w-6xl mx-auto space-y-6">
          <Button variant="ghost" onClick={() => navigate('/workspaces')} className="mb-4 pl-0 hover:pl-2 transition-all">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Workspaces
          </Button>

          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {workspace.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  {workspace.name}
                  <Badge variant="secondary" className="bg-indigo-50 text-indigo-700">{workspace.plan}</Badge>
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">{workspace.description || 'No description provided.'}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => navigate(`/workspace/${workspaceId}/shifts`)} variant="outline" className="h-10" data-testid="shifts-btn">
                <Clock className="w-4 h-4 mr-2" />
                Shifts
              </Button>
              <Button onClick={() => navigate('/workspace/chat')} variant="outline" className="h-10">
                Open Chat
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-white dark:bg-slate-900 p-1 rounded-xl border border-gray-200 dark:border-gray-800 h-auto flex-wrap">
              {['overview', 'members', 'billing', 'settings', 'activity'].map(tab => (
                 <TabsTrigger 
                   key={tab} 
                   value={tab}
                   className="capitalize px-6 py-2.5 rounded-lg data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 dark:data-[state=active]:bg-indigo-900/20 dark:data-[state=active]:text-indigo-300"
                 >
                   {tab === 'billing' && <CreditCard className="w-4 h-4 mr-2" />}
                   {tab}
                 </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="overview" className="space-y-6 animate-in fade-in-50">
               <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                 <Card className="glass-panel">
                   <CardContent className="pt-6">
                     <div className="flex items-center justify-between mb-4">
                        <Users className="w-5 h-5 text-blue-500" />
                        <span className="text-2xl font-bold">12</span>
                     </div>
                     <p className="text-sm text-gray-500">Total Members</p>
                   </CardContent>
                 </Card>
                 <Card className="glass-panel">
                   <CardContent className="pt-6">
                     <div className="flex items-center justify-between mb-4">
                        <HardDrive className="w-5 h-5 text-purple-500" />
                        <span className="text-2xl font-bold">2.4 GB</span>
                     </div>
                     <p className="text-sm text-gray-500">Storage Used</p>
                   </CardContent>
                 </Card>
                 <Card className="glass-panel">
                   <CardContent className="pt-6">
                     <div className="flex items-center justify-between mb-4">
                        <Activity className="w-5 h-5 text-green-500" />
                        <span className="text-2xl font-bold">98%</span>
                     </div>
                     <p className="text-sm text-gray-500">System Health</p>
                   </CardContent>
                 </Card>
                 <Card 
                   className="glass-panel cursor-pointer hover:shadow-md transition-shadow" 
                   onClick={() => navigate(`/workspace/${workspaceId}/shifts`)}
                   data-testid="shifts-overview-card"
                 >
                   <CardContent className="pt-6">
                     <div className="flex items-center justify-between mb-4">
                        <Clock className="w-5 h-5 text-indigo-500" />
                        <Calendar className="w-5 h-5 text-indigo-400" />
                     </div>
                     <p className="text-sm font-medium text-gray-900 dark:text-white">Shift Management</p>
                     <p className="text-xs text-gray-500 mt-1">Schedule & manage team shifts</p>
                   </CardContent>
                 </Card>
               </div>
            </TabsContent>

            <TabsContent value="members" className="animate-in fade-in-50">
              <WorkspaceMemberManagement workspaceId={workspaceId} />
            </TabsContent>

            <TabsContent value="billing" className="space-y-6 animate-in fade-in-50">
              <TeamBillingCard 
                workspaceId={workspaceId} 
                ownerId={user?.id}
                currentMemberCount={workspace?.members?.length || 1}
              />
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart2 className="w-5 h-5" />
                    Billing History
                  </CardTitle>
                  <CardDescription>View past invoices and payments</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No billing history yet</p>
                    <p className="text-sm mt-1">Set up team billing to see invoices here</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6 animate-in fade-in-50">
              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>Update basic workspace information.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Workspace Name</label>
                    <Input value={editName} onChange={e => setEditName(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Description</label>
                    <Textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} />
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleUpdate}>Save Changes</Button>
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
                  <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity">
               <div className="flex flex-col items-center justify-center h-64 text-gray-500 bg-white/50 rounded-xl border border-dashed">
                 <Activity className="w-10 h-10 mb-2 opacity-50" />
                 <p>Activity logs coming soon</p>
               </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PageTransition>
  );
};

export default WorkspaceDetailPage;
